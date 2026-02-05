//! Módulo para importar jogos da plataforma Steam.
//!
//! Fornece estruturas de dados e funções para:
//! - Buscar jogos instalados (via arquivos VDF locais)
//! - Buscar jogos não instalados (via librarycache)
//! - Buscar via API Steam como fallback
//! - Fazer merge de múltiplas fontes

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

// === ESTRUTURAS ===

/// Estrutura interna para representar um jogo
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct GameData {
    pub name: String,
    pub platform: String,
    pub platform_game_id: String,
    pub install_path: Option<String>,
    pub installed: bool,
    pub import_confidence: String,
    pub playtime_forever: i32,
    pub rtime_last_played: i64,
}

// === FUNÇÃO PRINCIPAL ===

/// Obtém a lista completa de jogos Steam do usuário
pub async fn get_complete_library(
    steam_root: &Path,
    api_key: &str,
    steam_id: &str,
) -> Result<Vec<GameData>, String> {
    let mut sources = Vec::new();

    // 1. Jogos instalados (maior prioridade)
    match scan_installed_games(steam_root) {
        Ok(games) => {
            println!("Encontrados {} jogos instalados", games.len());
            sources.push(games);
        }
        Err(e) => eprintln!("Aviso ao buscar instalados: {}", e),
    }

    // 2. Library cache (prioridade média)
    match scan_library_cache(steam_root).await {
        Ok(games) => {
            println!("Encontrados {} jogos no cache", games.len());
            sources.push(games);
        }
        Err(e) => eprintln!("Aviso ao buscar cache: {}", e),
    }

    // 3. API Steam (fallback)
    match fetch_steam_api(api_key, steam_id).await {
        Ok(games) => {
            println!("Encontrados {} jogos via API", games.len());
            sources.push(games);
        }
        Err(e) => eprintln!("Buscar na API: {}", e),
    }

    let merged = merge_games(sources);
    println!("Total: {} jogos após merge", merged.len());

    Ok(merged)
}

// === SCAN DE JOGOS INSTALADOS ===

/// Escaneia jogos instalados via VDF e appmanifest
pub fn scan_installed_games(steam_root: &Path) -> Result<Vec<GameData>, String> {
    let mut games = Vec::new();
    let library_folders = read_library_folders(steam_root)?;

    for library in library_folders {
        let steamapps = library.join("steamapps");
        if !steamapps.exists() {
            continue;
        }

        // Lê todos os appmanifest_*.acf
        let entries =
            fs::read_dir(&steamapps).map_err(|e| format!("Erro ao ler steamapps: {}", e))?;

        for entry in entries.flatten() {
            let path = entry.path();

            if is_appmanifest(&path) {
                if let Ok(game) = parse_appmanifest(&path, &library) {
                    games.push(game);
                }
            }
        }
    }

    Ok(games)
}

/// Lê libraryfolders.vdf e retorna lista de bibliotecas Steam
fn read_library_folders(steam_root: &Path) -> Result<Vec<PathBuf>, String> {
    let vdf_path = steam_root.join("steamapps").join("libraryfolders.vdf");
    let mut libraries = vec![steam_root.to_path_buf()];

    if !vdf_path.exists() {
        return Ok(libraries);
    }

    let content = fs::read_to_string(&vdf_path)
        .map_err(|e| format!("Erro ao ler libraryfolders.vdf: {}", e))?;

    // Parse manual do VDF
    let mut in_folder = false;
    let mut current_path: Option<PathBuf> = None;

    for line in content.lines() {
        let trimmed = line.trim();

        // Detecta entrada de folder (número como chave)
        if trimmed.starts_with('"') && trimmed.contains('"') {
            let parts: Vec<&str> = trimmed.split('"').collect();
            if parts.len() >= 2 {
                // Se é um número, estamos entrando em um folder
                if parts[1].chars().all(|c| c.is_ascii_digit()) {
                    in_folder = true;
                }
            }
        }

        // Extrai path
        if in_folder && trimmed.starts_with("\"path\"") {
            if let Some(path_str) = extract_vdf_value(trimmed) {
                let cleaned = path_str.replace("\\\\", "\\");
                current_path = Some(PathBuf::from(cleaned));
            }
        }

        // Fim do folder
        if trimmed == "}" && in_folder {
            if let Some(path) = current_path.take() {
                if path != steam_root.to_path_buf() {
                    libraries.push(path);
                }
            }
            in_folder = false;
        }
    }

    Ok(libraries)
}

/// Parseia um arquivo appmanifest
fn parse_appmanifest(manifest_path: &Path, library_root: &Path) -> Result<GameData, String> {
    let content =
        fs::read_to_string(manifest_path).map_err(|e| format!("Erro ao ler manifest: {}", e))?;

    let mut appid: Option<String> = None;
    let mut name: Option<String> = None;
    let mut installdir: Option<String> = None;

    for line in content.lines() {
        let trimmed = line.trim();

        if trimmed.starts_with("\"appid\"") {
            appid = extract_vdf_value(trimmed);
        } else if trimmed.starts_with("\"name\"") {
            name = extract_vdf_value(trimmed);
        } else if trimmed.starts_with("\"installdir\"") {
            installdir = extract_vdf_value(trimmed);
        }

        // Otimização: para quando tiver tudo
        if appid.is_some() && name.is_some() && installdir.is_some() {
            break;
        }
    }

    let appid = appid.ok_or("appid não encontrado")?;
    let name = name.unwrap_or_else(|| "Unknown".to_string());
    let install_path = installdir.map(|dir| {
        library_root
            .join("steamapps")
            .join("common")
            .join(dir)
            .to_string_lossy()
            .to_string()
    });

    Ok(GameData {
        name,
        platform: "Steam".to_string(),
        platform_game_id: appid,
        install_path,
        installed: true,
        import_confidence: "High".to_string(),
        playtime_forever: 0,
        rtime_last_played: 0,
    })
}

/// Verifica se o path é um appmanifest
fn is_appmanifest(path: &Path) -> bool {
    path.file_name()
        .and_then(|f| f.to_str())
        .map(|f| f.starts_with("appmanifest_") && f.ends_with(".acf"))
        .unwrap_or(false)
}

/// Extrai valor de uma linha VDF: "key" "value" → "value"
fn extract_vdf_value(line: &str) -> Option<String> {
    let parts: Vec<&str> = line.split('"').collect();
    if parts.len() >= 4 {
        Some(parts[3].to_string())
    } else {
        None
    }
}

// === SCAN DO LIBRARY CACHE ===

/// Escaneia jogos não-instalados via library cache
pub async fn scan_library_cache(steam_root: &Path) -> Result<Vec<GameData>, String> {
    let mut games = Vec::new();
    let userdata = steam_root.join("userdata");

    if !userdata.exists() {
        return Ok(games);
    }

    let user_dirs = fs::read_dir(&userdata).map_err(|e| format!("Erro: {}", e))?;

    for user_entry in user_dirs.flatten() {
        if !user_entry.path().is_dir() {
            continue;
        }

        let cache_dir = user_entry.path().join("config").join("librarycache");

        if cache_dir.exists() {
            scan_librarycache_dir(&cache_dir, &mut games).await?; // ← async
        }
    }

    let mut seen = std::collections::HashSet::new();
    games.retain(|g| seen.insert(g.platform_game_id.clone()));

    Ok(games)
}

/// Escaneia um diretório librarycache
async fn scan_librarycache_dir(dir: &Path, games: &mut Vec<GameData>) -> Result<(), String> {
    let entries = fs::read_dir(dir).map_err(|e| format!("Erro: {}", e))?;

    for entry in entries.flatten() {
        let path = entry.path();

        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }

        if let Some(filename) = path.file_stem().and_then(|s| s.to_str()) {
            if !filename.chars().all(|c| c.is_ascii_digit()) {
                continue;
            }
        }

        if let Ok(cache_games) = parse_librarycache_file(&path).await {
            // ← async
            games.extend(cache_games);
        }
    }

    Ok(())
}

/// Parseia um arquivo JSON do library cache
async fn parse_librarycache_file(path: &Path) -> Result<Vec<GameData>, String> {
    let appid = extract_appid_from_filename(path)?;

    let game_name = fetch_steam_game_name(&appid)
        .await // ← async
        .unwrap_or_else(|| format!("Game {}", appid));

    Ok(vec![GameData {
        name: game_name,
        platform: "Steam".to_string(),
        platform_game_id: appid,
        install_path: None,
        installed: false,
        import_confidence: "Medium".to_string(),
        playtime_forever: 0,
        rtime_last_played: 0,
    }])
}

/// Busca nome do jogo via Steam Store API - VERSÃO ASYNC
pub async fn fetch_steam_game_name(app_id: &str) -> Option<String> {
    use crate::utils::http_client::HTTP_CLIENT; // Usa o cliente async existente

    let url = format!(
        "https://store.steampowered.com/api/appdetails?appids={}",
        app_id
    );

    let resp = HTTP_CLIENT.get(&url).send().await.ok()?; // ← async
    let json: serde_json::Value = resp.json().await.ok()?; // ← async

    let app_data = json.get(app_id)?;
    if !app_data.get("success")?.as_bool()? {
        return None;
    }

    app_data
        .get("data")?
        .get("name")?
        .as_str()
        .map(|s| s.to_string())
}

/// Extrai o AppID do nome do arquivo
fn extract_appid_from_filename(path: &Path) -> Result<String, String> {
    let filename = path
        .file_stem()
        .and_then(|s| s.to_str())
        .ok_or_else(|| format!("Nome de arquivo inválido: {:?}", path))?;

    if filename.chars().all(|c| c.is_ascii_digit()) {
        Ok(filename.to_string())
    } else {
        Err(format!("Não é um AppID válido: {}", filename))
    }
}

// === API STEAM ===

/// Busca jogos via API Steam
async fn fetch_steam_api(api_key: &str, steam_id: &str) -> Result<Vec<GameData>, String> {
    let steam_games =
        crate::services::integration::steam_api::list_steam_games(api_key, steam_id).await?;

    Ok(steam_games
        .into_iter()
        .map(|game| GameData {
            name: game.name,
            platform: "Steam".to_string(),
            platform_game_id: game.appid.to_string(),
            install_path: None,
            installed: false,
            import_confidence: "Low".to_string(),
            playtime_forever: game.playtime_forever,
            rtime_last_played: game.rtime_last_played,
        })
        .collect())
}

// === MERGE DE JOGOS ===

/// Faz merge de múltiplas fontes de jogos
pub fn merge_games(sources: Vec<Vec<GameData>>) -> Vec<GameData> {
    let mut map: HashMap<String, GameData> = HashMap::new();

    for list in sources {
        for game in list {
            let key = format!("{}::{}", game.platform, game.platform_game_id);

            match map.get(&key) {
                None => {
                    map.insert(key, game);
                }
                Some(existing) => {
                    let merged = merge_two(existing, &game);
                    map.insert(key, merged);
                }
            }
        }
    }

    let mut result: Vec<GameData> = map.into_values().collect();
    result.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    result
}

/// Faz merge de dois registros do mesmo jogo
fn merge_two(a: &GameData, b: &GameData) -> GameData {
    // Instalado sempre vence
    if a.installed && !b.installed {
        return enrich(a, b);
    }
    if b.installed && !a.installed {
        return enrich(b, a);
    }

    // Usa confidence como critério
    let a_conf = confidence_score(&a.import_confidence);
    let b_conf = confidence_score(&b.import_confidence);

    if a_conf > b_conf {
        enrich(a, b)
    } else if b_conf > a_conf {
        enrich(b, a)
    } else {
        choose_more_complete(a, b)
    }
}

/// Score de confiança
fn confidence_score(conf: &str) -> i32 {
    match conf {
        "High" => 3,
        "Medium" => 2,
        "Low" => 1,
        _ => 0,
    }
}

/// Enriquece dados primários com secundários
fn enrich(primary: &GameData, secondary: &GameData) -> GameData {
    GameData {
        name: if primary.name.len() >= secondary.name.len() {
            primary.name.clone()
        } else {
            secondary.name.clone()
        },
        platform: primary.platform.clone(),
        platform_game_id: primary.platform_game_id.clone(),
        install_path: primary
            .install_path
            .clone()
            .or_else(|| secondary.install_path.clone()),
        installed: primary.installed || secondary.installed,
        import_confidence: primary.import_confidence.clone(),
        playtime_forever: if secondary.playtime_forever > 0 {
            secondary.playtime_forever
        } else {
            primary.playtime_forever
        },
        rtime_last_played: if secondary.rtime_last_played > 0 {
            secondary.rtime_last_played
        } else {
            primary.rtime_last_played
        },
    }
}

/// Escolhe o mais completo entre dois
fn choose_more_complete(a: &GameData, b: &GameData) -> GameData {
    let score_a = completeness_score(a);
    let score_b = completeness_score(b);

    if score_a >= score_b {
        enrich(a, b)
    } else {
        enrich(b, a)
    }
}

/// Score de completude
fn completeness_score(game: &GameData) -> i32 {
    let mut score = 0;
    if !game.name.is_empty() {
        score += 1;
    }
    if game.install_path.is_some() {
        score += 1;
    }
    if game.installed {
        score += 2;
    }
    if game.playtime_forever > 0 {
        score += 2;
    }
    if game.rtime_last_played > 0 {
        score += 1;
    }
    score
}
