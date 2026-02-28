//! Módulo para integração com o Heroic Games Launcher
//!
//! Fornece funcionalidade para detectar jogos instalados via Heroic, lendo os arquivos de
//! configuração do Heroic e mapeando-os para o formato genérico de jogos usado pela aplicação.
//!
//! Suporta **Linux** (instalação nativa e Flatpak) e **Windows** (detecção automática via
//! `%APPDATA%\heroic` ou caminho personalizado fornecido pelo usuário).
//!
//! ## Caminhos de configuração detectados automaticamente
//!
//! **Linux (nativo):** `~/.config/heroic/installed.json`  
//! **Linux (Flatpak):** `~/.var/app/com.heroicgameslauncher.hgl/config/heroic/installed.json`  
//! **Windows:** `%APPDATA%\heroic\installed.json`
//!
//! ## Aviso sobre duplicatas
//!
//! Se o usuário importar jogos via Heroic **e** via um launcher nativo (Epic, GOG, etc.),
//! os mesmos títulos aparecerão duas vezes na biblioteca com plataformas diferentes
//! (ex.: "Heroic" e "Epic Games"). Isso é esperado — cada entrada representa uma
//! instalação/plataforma distinta.

use std::fs;
use std::path::{Path, PathBuf};

use serde::Deserialize;

use crate::errors::AppError;
use crate::sources::providers::SourceGame;

#[derive(Debug, Deserialize)]
struct HeroicInstalledGame {
    app_name: Option<String>,
    title: Option<String>,
    install_path: Option<String>,
    executable: Option<String>,
}

#[derive(Debug, Deserialize)]
struct HeroicInstalledFile {
    installed: Vec<HeroicInstalledGame>,
}

pub struct HeroicSource;

impl HeroicSource {
    /// Importa os jogos instalados via Heroic.
    ///
    /// `config_path_override` — permite fornecer um caminho personalizado para o diretório de
    /// configuração do Heroic. Quando `None`, a detecção automática é usada.
    pub async fn import_installed(
        config_path_override: Option<PathBuf>,
    ) -> Result<Vec<SourceGame>, AppError> {
        let config_path = match config_path_override {
            Some(path) => path,
            None => Self::detect_heroic_config_path()?,
        };

        let installed_file = config_path.join("installed.json");

        if !installed_file.exists() {
            return Ok(vec![]);
        }

        let content = fs::read_to_string(&installed_file)?;

        let parsed: HeroicInstalledFile = serde_json::from_str(&content)?;

        let mut games = Vec::new();

        for game in parsed.installed {
            if let Some(source_game) = Self::map_to_source_game(game) {
                games.push(source_game);
            }
        }

        Ok(games)
    }

    /// Detecta automaticamente o diretório de configuração do Heroic.
    ///
    /// Ordem de verificação:
    /// 1. **Linux Flatpak:** `~/.var/app/com.heroicgameslauncher.hgl/config/heroic`
    /// 2. **Linux nativo:** `~/.config/heroic`
    /// 3. **Windows:** `%APPDATA%\heroic`
    fn detect_heroic_config_path() -> Result<PathBuf, AppError> {
        // === LINUX ===
        #[cfg(target_os = "linux")]
        {
            let home = std::env::var("HOME")
                .map_err(|_| AppError::ValidationError("HOME não encontrado".into()))?;

            // Flatpak path
            let flatpak_path =
                Path::new(&home).join(".var/app/com.heroicgameslauncher.hgl/config/heroic");
            if flatpak_path.exists() {
                return Ok(flatpak_path);
            }

            // Native installation path
            let native_path = Path::new(&home).join(".config/heroic");
            if native_path.exists() {
                return Ok(native_path);
            }
        }

        // === WINDOWS ===
        #[cfg(target_os = "windows")]
        {
            if let Ok(appdata) = std::env::var("APPDATA") {
                let path = Path::new(&appdata).join("heroic");
                if path.exists() {
                    return Ok(path);
                }
            }
        }

        Err(AppError::ValidationError(
            "Heroic não encontrado no sistema. Verifique se está instalado ou informe o diretório manualmente.".into(),
        ))
    }

    fn map_to_source_game(game: HeroicInstalledGame) -> Option<SourceGame> {
        let title = game.title?;
        let install_path = game.install_path?;
        let executable = game.executable?;
        let app_name = game.app_name?;

        let full_executable_path = Path::new(&install_path)
            .join(&executable)
            .to_string_lossy()
            .to_string();

        Some(SourceGame {
            platform: "Heroic".to_string(),
            platform_game_id: app_name,
            name: Some(title),
            installed: true,
            executable_path: Some(full_executable_path),
            install_path: Some(install_path),
            playtime_minutes: None,
            last_played: None,
        })
    }
}
