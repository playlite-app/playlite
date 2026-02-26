//! Implementação do GameSource para a Ubisoft
//!
//! Lê tanto os arquivos de instalação quanto o cache de biblioteca.
//!
//! **Nota:**
//! - O cache de biblioteca é um arquivo binário com entradas YAML embutidas, onde cada jogo tem um nome e um identificador único.
//! - O arquivo de instalação é um JSON com informações sobre jogos instalados, incluindo caminho de instalação e nome de exibição.

use crate::errors::AppError;
use crate::sources::providers::{GameSource, SourceGame};
use async_trait::async_trait;
use serde::Deserialize;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

pub struct UbisoftSource {
    pub ubisoft_root: Option<String>,
    pub include_library_cache: bool,
}

impl UbisoftSource {
    pub fn new(ubisoft_root: Option<String>, include_library_cache: bool) -> Self {
        Self {
            ubisoft_root,
            include_library_cache,
        }
    }

    fn resolve_launcher_root(&self) -> Option<PathBuf> {
        if let Some(ref root) = self.ubisoft_root {
            let path = PathBuf::from(root);
            if path.exists() {
                return Some(path);
            }
        }

        #[cfg(target_os = "windows")]
        {
            let program_files_x86 = std::env::var("PROGRAMFILES(X86)").ok();
            let program_files = std::env::var("PROGRAMFILES").ok();

            // Caminhos padrão no Program Files
            let pf_candidates: Vec<PathBuf> = [program_files_x86, program_files]
                .into_iter()
                .flatten()
                .flat_map(|pf| {
                    vec![
                        Path::new(&pf).join("Ubisoft").join("Ubisoft Game Launcher"),
                        Path::new(&pf).join("Ubisoft Game Launcher"),
                    ]
                })
                .collect();

            for path in &pf_candidates {
                if path.exists() {
                    return Some(path.clone());
                }
            }

            // Caminhos em raízes de drives comuns (C:\ até Z:\)
            for letter in b'C'..=b'Z' {
                let drive = format!("{}:", char::from(letter));
                let candidates = [
                    PathBuf::from(&drive).join("Ubisoft Game Launcher"),
                    PathBuf::from(&drive)
                        .join("Ubisoft")
                        .join("Ubisoft Game Launcher"),
                    PathBuf::from(&drive)
                        .join("Program Files")
                        .join("Ubisoft")
                        .join("Ubisoft Game Launcher"),
                    PathBuf::from(&drive)
                        .join("Program Files (x86)")
                        .join("Ubisoft")
                        .join("Ubisoft Game Launcher"),
                ];
                for path in &candidates {
                    if path.exists() {
                        return Some(path.clone());
                    }
                }
            }
        }

        None
    }

    fn find_install_files(base_path: &Path) -> Vec<PathBuf> {
        let mut install_files = Vec::new();

        if let Ok(entries) = fs::read_dir(base_path) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().map(|e| e == "install").unwrap_or(false) {
                    install_files.push(path);
                }
            }
        }

        install_files
    }

    fn read_install_games(base_path: &Path) -> Vec<SourceGame> {
        let mut games = Vec::new();

        let install_files = Self::find_install_files(base_path);

        for file_path in install_files {
            let content = match fs::read_to_string(&file_path) {
                Ok(c) => c,
                Err(_) => continue,
            };

            let parsed: UbisoftInstallFile = match serde_json::from_str(&content) {
                Ok(p) => p,
                Err(_) => continue,
            };

            let install_path = parsed.install_location.clone();

            let executable_path = install_path
                .as_ref()
                .and_then(|path| find_main_executable(Path::new(path)));

            games.push(SourceGame {
                platform: "Ubisoft".to_string(),
                platform_game_id: parsed.app_id.unwrap_or_default(),
                name: parsed.display_name,
                installed: install_path.is_some(),
                executable_path: executable_path.map(|p| p.to_string_lossy().to_string()),
                install_path,
                playtime_minutes: None,
                last_played: None,
            });
        }

        games
    }

    /// Lê o cache de biblioteca da Ubisoft.
    ///
    /// O arquivo `cache/configuration/configurations` é binário com entradas YAML embutidas.
    /// Cada entrada começa com `version: 2.0` (sem recuo) seguido de `root:`.
    /// Exemplo de estrutura relevante:
    ///
    /// ```text
    /// version: 2.0\r\n          <- marcador de início de bloco (pode ter \r)
    /// root:\r\n
    ///   name: "Far Cry 3"\r\n   <- 2 espaços, filho direto de root
    ///   ...
    ///   installer:\r\n
    ///     game_identifier: Far Cry 3\r\n   <- 4 espaços
    /// ```
    ///
    /// Regras de parsing:
    /// - Bloco inicia em `version: 2.0` — salva o bloco anterior e reinicia estado
    /// - `  name:` (2 espaços) = nome do jogo raiz
    /// - `    game_identifier:` (4 espaços) = ID único
    /// - Linhas com `\r` são limpas antes do processamento
    /// - DLCs são excluídos: entradas cujo `game_identifier` é diferente do nome principal do
    ///   jogo pai (detectado por pertencer a um bloco com `  name:` igual ao do jogo pai)
    fn read_configuration_library(base_path: &Path) -> Vec<SourceGame> {
        let mut games = Vec::new();

        let config_path = base_path
            .join("cache")
            .join("configuration")
            .join("configurations");

        if !config_path.exists() {
            return games;
        }

        let content = match fs::read(&config_path) {
            Ok(bytes) => String::from_utf8_lossy(&bytes).to_string(),
            Err(_) => return games,
        };

        let mut current_name: Option<String> = None;
        let mut current_id: Option<String> = None;
        // Rastreia IDs e nomes normalizados já adicionados para evitar duplicatas
        let mut seen_ids: std::collections::HashSet<String> = std::collections::HashSet::new();
        let mut seen_names: std::collections::HashSet<String> = std::collections::HashSet::new();

        let flush = |name: Option<String>,
                     id: Option<String>,
                     games: &mut Vec<SourceGame>,
                     seen_ids: &mut std::collections::HashSet<String>,
                     seen_names: &mut std::collections::HashSet<String>| {
            if let Some(n) = name {
                // Filtra DLCs: nomes que contêm " - " após o nome do jogo pai
                // ou que são claramente add-ons (Season Pass, Pack, Set, Helmet, etc.)
                if is_likely_dlc(&n) {
                    return;
                }
                let game_id = id.unwrap_or_else(|| n.clone());
                let name_key = normalize_name(&n).to_lowercase();
                if !game_id.is_empty()
                    && !seen_ids.contains(&game_id)
                    && !seen_names.contains(&name_key)
                {
                    seen_ids.insert(game_id.clone());
                    seen_names.insert(name_key);
                    games.push(make_library_game(game_id, n));
                }
            }
        };

        for raw_line in content.lines() {
            // Remove \r residual (CRLF)
            let line = raw_line.trim_end_matches('\r');

            // Início de novo bloco de jogo
            if line == "version: 2.0" {
                let name = current_name.take();
                let id = current_id.take();
                flush(name, id, &mut games, &mut seen_ids, &mut seen_names);
                continue;
            }

            // Nome do jogo: exatamente 2 espaços (filho direto de `root:`)
            if let Some(rest) = line.strip_prefix("  name: ") {
                let name = parse_yaml_string_value(rest);
                if name.is_empty() || name == "GAMENAME" {
                    continue;
                }
                // Novo nome dentro do mesmo bloco = entrada raiz já tinha nome (DLC inline)
                // Salva o anterior e começa novo
                let prev_name = current_name.take();
                let prev_id = current_id.take();
                flush(
                    prev_name,
                    prev_id,
                    &mut games,
                    &mut seen_ids,
                    &mut seen_names,
                );
                current_name = Some(name);
                current_id = None;
                continue;
            }

            // game_identifier: exatamente 4 espaços
            if let Some(rest) = line.strip_prefix("    game_identifier: ") {
                let id = parse_yaml_string_value(rest);
                if !id.is_empty() && current_id.is_none() {
                    // Só usa o primeiro game_identifier do bloco
                    current_id = Some(id);
                }
            }
        }

        // Último bloco
        let name = current_name.take();
        let id = current_id.take();
        flush(name, id, &mut games, &mut seen_ids, &mut seen_names);

        games
    }
}

fn make_library_game(id: String, name: String) -> SourceGame {
    SourceGame {
        platform: "Ubisoft".to_string(),
        platform_game_id: id,
        name: Some(name),
        installed: false,
        executable_path: None,
        install_path: None,
        playtime_minutes: None,
        last_played: None,
    }
}

/// Remove aspas simples, duplas e espaços ao redor do valor de um campo YAML.
/// Garante que \r é removido antes de tentar desquotar.
fn parse_yaml_string_value(s: &str) -> String {
    let trimmed = s.trim().trim_end_matches('\r').trim();
    let unquoted = trimmed
        .strip_prefix('"')
        .and_then(|s| s.strip_suffix('"'))
        .or_else(|| {
            trimmed
                .strip_prefix('\'')
                .and_then(|s| s.strip_suffix('\''))
        })
        .unwrap_or(trimmed);
    unquoted.trim().trim_end_matches('\r').trim().to_string()
}

#[async_trait]
impl GameSource for UbisoftSource {
    async fn fetch_games(&self) -> Result<Vec<SourceGame>, AppError> {
        let Some(base_path) = self.resolve_launcher_root() else {
            return Ok(Vec::new());
        };

        let installed_games = Self::read_install_games(&base_path);

        if !self.include_library_cache {
            return Ok(installed_games);
        }

        let library_games = Self::read_configuration_library(&base_path);

        Ok(merge_games(installed_games, library_games))
    }
}

#[derive(Debug, Deserialize)]
struct UbisoftInstallFile {
    #[serde(rename = "InstallLocation")]
    install_location: Option<String>,
    #[serde(rename = "AppId")]
    app_id: Option<String>,
    #[serde(rename = "DisplayName")]
    display_name: Option<String>,
}

/// Mescla as listas de jogos instalados e da biblioteca, dando preferência aos dados de instalação.
fn merge_games(installed: Vec<SourceGame>, library: Vec<SourceGame>) -> Vec<SourceGame> {
    let mut map: HashMap<String, SourceGame> = HashMap::new();

    for game in installed {
        let key = if game.platform_game_id.is_empty() {
            game.name.clone().unwrap_or_default()
        } else {
            game.platform_game_id.clone()
        };

        map.insert(key, game);
    }

    for game in library {
        let key = game.platform_game_id.clone();
        map.entry(key).or_insert(game);
    }

    map.into_values().collect()
}

fn normalize_name(name: &str) -> String {
    name.chars()
        .filter(|c| c.is_alphanumeric() || c.is_whitespace())
        .collect::<String>()
        .trim()
        .to_string()
}

/// Detecta se uma entrada é provavelmente um DLC, cosmético ou add-on e não um jogo base.
fn is_likely_dlc(name: &str) -> bool {
    let lower = name.to_lowercase();

    // IDs inválidos ou muito curtos (artefatos binários)
    if name.len() <= 2 {
        return true;
    }

    // Padrão mais comum: "Nome do Jogo - DLC Name"
    if name.contains(" - ") {
        return true;
    }

    // Subtítulos que indicam episódios/DLCs de Trials Fusion, Watch Dogs, etc.
    // Ex: "Trials Fusion: Welcome to the Abyss", "Far Cry 4: Valley of the Yetis"
    // Mas NÃO "Assassin's Creed: Origins" (jogo base com colon no título)
    // Heurística: se tem ": " e começa com um nome de jogo já conhecido como base, é DLC
    // Fazemos isso checando palavras-chave de episódio após o ":"
    if let Some(pos) = name.find(": ") {
        let after = &name[pos + 2..].to_lowercase();
        let episode_keywords = [
            "riders of",
            "empire of",
            "welcome to",
            "fire in",
            "fault one",
            "after the",
            "season pass",
            "awesome level",
            "battle for",
        ];
        for kw in &episode_keywords {
            if after.starts_with(kw) {
                return true;
            }
        }
    }

    // Keywords que indicam DLC / conteúdo extra
    let dlc_keywords = [
        "season pass",
        "dlc",
        " pack",
        " set",
        "helmet",
        "outfit",
        "skin",
        "add-on",
        "addon",
        "expansion",
        "upgrade set",
        "knuckles",
        "gauntlet",
        "machete",
        "pistol",
        "revolver",
        "rifle",
        "nitro express",
        "kukri",
        "preorder",
        "pre-order",
        "pre order",
        "full game",
        "starter pack",
        "ornament",
        "giveaway",
        "demo",
    ];

    for kw in &dlc_keywords {
        if lower.contains(kw) {
            return true;
        }
    }

    false
}

/// Retorna o maior .exe encontrado acima de 5 MB, em vez do primeiro.
fn find_main_executable(path: &Path) -> Option<PathBuf> {
    if !path.exists() {
        return None;
    }

    let entries = fs::read_dir(path).ok()?;

    let mut best: Option<(u64, PathBuf)> = None;

    for entry in entries.flatten() {
        let file_path = entry.path();

        if file_path
            .extension()
            .map(|e| e.eq_ignore_ascii_case("exe"))
            .unwrap_or(false)
        {
            if let Ok(metadata) = fs::metadata(&file_path) {
                let size = metadata.len();
                if size > 5 * 1024 * 1024 {
                    if best
                        .as_ref()
                        .map_or(true, |(prev_size, _)| size > *prev_size)
                    {
                        best = Some((size, file_path));
                    }
                }
            }
        }
    }

    best.map(|(_, path)| path)
}
