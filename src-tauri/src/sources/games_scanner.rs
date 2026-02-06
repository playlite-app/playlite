//! Módulo para escanear diretórios de jogos localmente.
//!
//! Este módulo implementa um scanner inteligente para detectar jogos instalados
//! localmente, identificando executáveis candidatos e permitindo seleção manual.
//! Ele é otimizado para jogos indie/antigos/locais, não dependendo de lojas oficiais.
//!
//! **Funcionalidades principais:**
//! - Escaneamento recursivo de pastas
//! - Detecção heurística de executáveis de jogos
//! - Ranking baseado em nome, tamanho e localização
//! - Suporte cross-platform (Windows e Linux)
//! - Foco em jogos indie/antigos/portados

use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;

// === STRUCTS INTERNAS (NÃO REFLETEM O BANCO DE DADOS) ===

#[derive(Debug, Clone)]
pub struct ScanSession {
    pub id: String,
    pub root_path: PathBuf,
    pub started_at: SystemTime,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct GameDiscovery {
    pub id: String,
    pub base_path: String,
    pub suggested_name: String,
    pub confidence: i32, // frontend usa number
    pub executables: Vec<ExecutableCandidate>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct ExecutableCandidate {
    pub path: String,
    pub filename: String,
    pub size_mb: u64,
    pub rank_score: i32,
    pub executable_type: ExecutableType,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ExecutableType {
    WindowsExe,
    LinuxElf,
    Script,
    Unknown,
}

// === FUNÇÕES PRINCIPAIS DE SCAN ===

/// Escaneia uma pasta raiz procurando por subpastas que contenham jogos
///
/// **Argumentos:**
/// * `root` - Caminho da pasta raiz para escanear (ex: "C:\Games" ou "/home/user/games")
///
/// **Retorna:**
/// * `Ok(Vec<GameDiscovery>)` - Lista de possíveis jogos encontrados
/// * `Err(String)` - Mensagem de erro se houver falha na leitura
pub fn scan_folder(root: &Path) -> Result<Vec<GameDiscovery>, String> {
    let mut discoveries = Vec::new();

    // Gera ID único para esta sessão de scan
    let session_id = uuid::Uuid::new_v4().to_string();

    // Lê as entradas da pasta raiz
    let entries = fs::read_dir(root)
        .map_err(|e| format!("Erro ao ler pasta raiz '{}': {}", root.display(), e))?;

    // Processa cada subpasta
    for entry in entries.flatten() {
        let path = entry.path();

        // Ignora arquivos, processa apenas diretórios
        if !path.is_dir() {
            continue;
        }

        // Escaneia a pasta em busca de executáveis
        if let Some(discovery) = scan_game_folder(&session_id, &path)? {
            discoveries.push(discovery);
        }
    }

    Ok(discoveries)
}

/// Escaneia uma pasta individual procurando por executáveis de jogos
///
/// **Argumentos:**
/// * `session_id` - ID da sessão de scan atual
/// * `folder` - Pasta a ser escaneada
///
/// **Retorna:**
/// * `Ok(Some(GameDiscovery))` - Se encontrou executáveis candidatos
/// * `Ok(None)` - Se não encontrou nenhum executável
/// * `Err(String)` - Se houve erro na leitura
fn scan_game_folder(_session_id: &str, folder: &Path) -> Result<Option<GameDiscovery>, String> {
    let mut executables = Vec::new();

    // Busca recursivamente por executáveis (profundidade limitada)
    scan_executables_recursive(folder, &mut executables, 0)?;

    // Se não encontrou nenhum executável, esta pasta não é um jogo
    if executables.is_empty() {
        return Ok(None);
    }

    // Usa o nome da pasta como nome sugerido do jogo
    let folder_name = folder
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Unknown")
        .to_string();

    // Calcula confiança baseada no melhor score dos executáveis
    let confidence = executables.iter().map(|e| e.rank_score).max().unwrap_or(0);

    Ok(Some(GameDiscovery {
        id: uuid::Uuid::new_v4().to_string(),
        base_path: folder.to_string_lossy().to_string(),
        suggested_name: folder_name,
        confidence,
        executables,
    }))
}

/// Busca recursivamente por executáveis em uma pasta
///
/// **Argumentos:**
/// * `dir` - Diretório atual sendo escaneado
/// * `out` - Vetor onde os candidatos encontrados serão adicionados
/// * `depth` - Profundidade atual da recursão
///
/// **Limitações:**
/// * Máximo de 4 níveis de profundidade para evitar scans muito longos
/// * Ignora arquivos menores que 5MB (geralmente não são jogos)
fn scan_executables_recursive(
    dir: &Path,
    out: &mut Vec<ExecutableCandidate>,
    depth: usize,
) -> Result<(), String> {
    // Limita profundidade para evitar scans infinitos ou muito lentos
    const MAX_DEPTH: usize = 4;
    if depth > MAX_DEPTH {
        return Ok(());
    }

    let entries =
        fs::read_dir(dir).map_err(|e| format!("Erro ao ler pasta '{}': {}", dir.display(), e))?;

    for entry in entries.flatten() {
        let path = entry.path();

        // Se for diretório, escaneia recursivamente
        if path.is_dir() {
            scan_executables_recursive(&path, out, depth + 1)?;
            continue;
        }

        // Se for arquivo, analisa se é um executável candidato
        if let Some(candidate) = analyze_file(&path)? {
            out.push(candidate);
        }
    }

    Ok(())
}

// === ANÁLISE DE ARQUIVOS ===

/// Analisa um arquivo para determinar se é um executável candidato
///
/// **Heurísticas aplicadas:**
/// * Tamanho mínimo: 5MB (evita ferramentas pequenas)
/// * Tipo de executável: .exe no Windows, ELF com bit de execução no Linux
/// * Score de ranking baseado em nome e tamanho
///
/// **Retorna:**
/// * `Ok(Some(ExecutableCandidate))` - Se o arquivo é um candidato válido
/// * `Ok(None)` - Se o arquivo deve ser ignorado
/// * `Err(String)` - Se houve erro ao analisar
fn analyze_file(path: &Path) -> Result<Option<ExecutableCandidate>, String> {
    let metadata = fs::metadata(path)
        .map_err(|e| format!("Erro ao obter metadata de '{}': {}", path.display(), e))?;

    // Tamanho mínimo: 5MB
    // Heurística: jogos indie simples geralmente têm pelo menos 5MB
    // Isso elimina launchers pequenos, crash reporters, etc.
    const MIN_SIZE_BYTES: u64 = 5 * 1024 * 1024;
    if metadata.len() < MIN_SIZE_BYTES {
        return Ok(None);
    }

    let filename = path
        .file_name()
        .ok_or_else(|| "Nome de arquivo inválido".to_string())?
        .to_string_lossy()
        .to_string();

    // Detecta tipo de executável (cross-platform)
    let executable_type = detect_executable_type(path)?;

    if executable_type == ExecutableType::Unknown {
        return Ok(None);
    }

    let size_mb = metadata.len() / (1024 * 1024);

    // Calcula score de ranking para ordenação
    let rank_score = calculate_rank(&filename, size_mb, path);

    Ok(Some(ExecutableCandidate {
        path: path.to_string_lossy().to_string(),
        filename,
        size_mb,
        rank_score,
        executable_type,
    }))
}

// === DETECÇÃO DE TIPO DE EXECUTÁVEL (CROSS-PLATAFORM) ===

/// Detecta o tipo de executável baseado na plataforma atual
///
/// **Windows:**
/// * Verifica extensão .exe
///
/// **Linux:**
/// * Verifica bit de execução (chmod +x)
/// * Idealmente deveria verificar ELF header, mas por simplicidade usa apenas permissões
fn detect_executable_type(path: &Path) -> Result<ExecutableType, String> {
    // Windows: verifica extensão .exe
    #[cfg(windows)]
    {
        if let Some(ext) = path.extension() {
            if ext.eq_ignore_ascii_case("exe") {
                return Ok(ExecutableType::WindowsExe);
            }
        }
        return Ok(ExecutableType::Unknown);
    }

    // Linux/Unix: verifica bit de execução
    #[cfg(unix)]
    {
        let metadata =
            fs::metadata(path).map_err(|e| format!("Erro ao obter permissões: {}", e))?;

        let permissions = metadata.permissions();

        // Verifica se tem bit de execução (owner, group ou other)
        if permissions.mode() & 0o111 != 0 {
            // Poderia verificar se é script (.sh) ou ELF binário
            // Por enquanto, assume ELF
            return Ok(ExecutableType::LinuxElf);
        }

        return Ok(ExecutableType::Unknown);
    }

    // Outras plataformas não suportadas
    #[cfg(not(any(windows, unix)))]
    {
        Ok(ExecutableType::Unknown)
    }
}

// === RANKING DE EXECUTÁVEIS ===

/// Calcula um score de ranking para priorizar executáveis
///
/// **Sistema de pontos:**
/// * -5: Nomes suspeitos (launcher, crash, uninstall, setup, redist)
/// * +2: Nomes positivos (game, play, start)
/// * +2: Arquivo > 100MB
/// * +3: Arquivo > 500MB
/// * +3: Nome similar ao nome da pasta pai
/// * +2: Executável na raiz da pasta do jogo
///
/// **Contexto:**
/// Esta heurística é otimizada para jogos indie/antigos/locais.
fn calculate_rank(filename: &str, size_mb: u64, path: &Path) -> i32 {
    let mut score = 0;

    let name_lower = filename.to_lowercase();

    // === PENALIDADES ===

    // Arquivos que certamente NÃO são o jogo principal
    let bad_keywords = [
        "launcher",
        "crash",
        "uninstall",
        "uninst",
        "setup",
        "redist",
        "vcredist",
        "dx",
        "directx",
        "reporter",
        "updater",
        "patcher",
        "config",
        "settings",
    ];

    for keyword in &bad_keywords {
        if name_lower.contains(keyword) {
            score -= 5;
            break;
        }
    }

    // === BÔNUS ===

    // Nomes que sugerem ser o executável principal
    let good_keywords = ["game", "play", "start", "run"];

    for keyword in &good_keywords {
        if name_lower.contains(keyword) {
            score += 2;
            break;
        }
    }

    // Tamanho do arquivo (jogos geralmente são maiores)
    if size_mb > 100 {
        score += 2;
    }

    if size_mb > 500 {
        score += 3;
    }

    // Bônus se o nome do arquivo é similar ao nome da pasta
    if let Some(parent) = path.parent() {
        if let Some(folder_name) = parent.file_name() {
            let folder_str = folder_name.to_string_lossy().to_lowercase();
            let file_stem = path
                .file_stem()
                .map(|s| s.to_string_lossy().to_lowercase())
                .unwrap_or_default();

            // Verifica similaridade básica
            if folder_str.contains(&file_stem) || file_stem.contains(&folder_str) {
                score += 3;
            }
        }
    }

    // Bônus se está na raiz da pasta do jogo (não em subpastas)
    if path.parent().and_then(|p| p.file_name()).is_some() {
        // Conta níveis de profundidade
        let depth = path.ancestors().count();
        if depth <= 3 {
            // Raiz ou nível 1
            score += 2;
        }
    }

    score
}

// === FUNÇÕES AUXILIARES ===

impl GameDiscovery {
    /// Retorna o executável com maior ranking
    pub fn best_executable(&self) -> Option<&ExecutableCandidate> {
        self.executables.iter().max_by_key(|e| e.rank_score)
    }

    /// Ordena executáveis por ranking (maior primeiro)
    pub fn sorted_executables(&self) -> Vec<ExecutableCandidate> {
        let mut sorted = self.executables.clone();
        sorted.sort_by(|a, b| b.rank_score.cmp(&a.rank_score));
        sorted
    }
}

impl std::fmt::Display for ExecutableType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ExecutableType::WindowsExe => write!(f, "Windows EXE"),
            ExecutableType::LinuxElf => write!(f, "Linux ELF"),
            ExecutableType::Script => write!(f, "Script"),
            ExecutableType::Unknown => write!(f, "Unknown"),
        }
    }
}
