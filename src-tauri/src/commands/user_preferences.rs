//! Comandos para gerenciar configurações de usuário do sistema de recomendação
//!
//! Usa arquivo JSON (Tauri Store pattern) para persistência

use crate::errors::AppError;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

const PREFERENCES_FILENAME: &str = "user_preferences.json";

/// Configurações de usuário que podem ser persistidas
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserPreferences {
    pub filter_adult_content: bool,
    pub series_limit: String, // "none", "moderate", "aggressive"
}

impl Default for UserPreferences {
    fn default() -> Self {
        Self {
            filter_adult_content: false,
            series_limit: "moderate".to_string(),
        }
    }
}

/// Obtém o caminho do arquivo de preferências
fn get_preferences_path(app: &AppHandle) -> Result<PathBuf, AppError> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::IoError(format!("Failed to get app data dir: {}", e)))?;

    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir)
            .map_err(|e| AppError::IoError(format!("Failed to create app data dir: {}", e)))?;
    }

    Ok(app_data_dir.join(PREFERENCES_FILENAME))
}

/// Obtém as configurações de usuário
#[tauri::command]
pub async fn get_user_preferences(app: AppHandle) -> Result<UserPreferences, AppError> {
    let path = get_preferences_path(&app)?;

    if !path.exists() {
        return Ok(UserPreferences::default());
    }

    let contents = fs::read_to_string(&path)
        .map_err(|e| AppError::IoError(format!("Failed to read preferences: {}", e)))?;

    let preferences: UserPreferences =
        serde_json::from_str(&contents).unwrap_or_else(|_| UserPreferences::default());

    Ok(preferences)
}

/// Salva as configurações de usuário
#[tauri::command]
pub async fn save_user_preferences(
    app: AppHandle,
    preferences: UserPreferences,
) -> Result<(), AppError> {
    let path = get_preferences_path(&app)?;

    let json = serde_json::to_string_pretty(&preferences)
        .map_err(|e| AppError::SerializationError(e.to_string()))?;

    fs::write(&path, json)
        .map_err(|e| AppError::IoError(format!("Failed to write preferences: {}", e)))?;

    Ok(())
}
