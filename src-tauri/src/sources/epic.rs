//! Source para importar jogos instalados via Epic Games Launcher
//!
//! Detecta jogos instalados lendo os arquivos de manifesto `.item` do Epic Games Launcher.
//!
//! **Observações:**
//! - Atualmente suporta apenas Windows, onde os manifests estão localizados em `C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests`.
//! - Cada arquivo `.item` é um JSON contendo informações sobre o jogo, como nome, caminho de instalação e executável de lançamento.
//! - O source extrai essas informações para criar objetos `SourceGame` que representam os jogos instalados via Epic.

use crate::errors::AppError;
use crate::sources::providers::SourceGame;
use serde::Deserialize;
use std::fs;
use std::path::{Path, PathBuf};

// === EPIC GAMES SOURCE - JOGOS INSTALADOS ===

/// Caminho padrão dos manifests da Epic (Windows)
const EPIC_MANIFEST_PATH: &str = r"C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests";

/// Estrutura mínima do JSON dos arquivos `.item`
#[derive(Debug, Deserialize)]
struct EpicManifest {
    #[serde(rename = "DisplayName")]
    display_name: Option<String>,

    #[serde(rename = "InstallLocation")]
    install_location: Option<String>,

    #[serde(rename = "LaunchExecutable")]
    launch_executable: Option<String>,

    #[serde(rename = "AppName")]
    app_name: Option<String>,
}

/// Source responsável por importar jogos instalados via Epic Games
pub struct EpicSource;

/// Importa todos os jogos instalados detectados nos manifests
impl EpicSource {
    pub async fn import_installed() -> Result<Vec<SourceGame>, AppError> {
        let manifest_dir = Path::new(EPIC_MANIFEST_PATH);

        if !manifest_dir.exists() {
            return Ok(vec![]); // Epic não instalada ou sem jogos
        }

        let mut games = Vec::new();

        for entry in fs::read_dir(manifest_dir)? {
            let entry = entry?;
            let path = entry.path();

            if !is_item_file(&path) {
                continue;
            }

            match Self::parse_manifest(&path) {
                Ok(game) => games.push(game),
                Err(err) => {
                    eprintln!("Erro ao processar manifest {:?}: {}", path, err);
                    continue;
                }
            }
        }

        Ok(games)
    }

    fn parse_manifest(path: &PathBuf) -> Result<SourceGame, AppError> {
        let content = fs::read_to_string(path)?;

        let manifest: EpicManifest = serde_json::from_str(&content)?;

        let name = manifest
            .display_name
            .unwrap_or_else(|| "Unknown".to_string());

        let install_location = manifest.install_location.ok_or_else(|| {
            AppError::ValidationError("InstallLocation ausente no manifest Epic".into())
        })?;

        let launch_executable = manifest.launch_executable.ok_or_else(|| {
            AppError::ValidationError("LaunchExecutable ausente no manifest Epic".into())
        })?;

        let app_name = manifest
            .app_name
            .ok_or_else(|| AppError::ValidationError("AppName ausente no manifest Epic".into()))?;

        let full_executable_path = Path::new(&install_location)
            .join(&launch_executable)
            .to_string_lossy()
            .to_string();

        Ok(SourceGame {
            platform: "Epic".to_string(),
            platform_game_id: app_name,
            name: Some(name),
            installed: true,
            executable_path: Some(full_executable_path),
            install_path: Some(install_location),
            playtime_minutes: None,
            last_played: None,
        })
    }
}

fn is_item_file(path: &Path) -> bool {
    path.extension()
        .and_then(|s| s.to_str())
        .map(|ext| ext.eq_ignore_ascii_case("item"))
        .unwrap_or(false)
}
