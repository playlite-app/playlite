//! Comandos relacionados a versionamento da aplicação
//!
//! Fornece informações sobre versões atual e anterior do app

use crate::database;
use crate::errors::AppError;
use serde::Serialize;
use tauri::AppHandle;

#[derive(Serialize)]
pub struct AppVersionInfo {
    #[serde(rename = "currentVersion")]
    pub current_version: String,
    #[serde(rename = "previousVersion")]
    pub previous_version: Option<String>,
}

/// Retorna informações sobre a versão atual e anterior do aplicativo
///
/// Usado pelo frontend para detectar atualizações e exibir modals apropriados
#[tauri::command]
pub fn get_app_version_info(app: AppHandle) -> Result<AppVersionInfo, AppError> {
    let current_version = app.package_info().version.to_string();
    let previous_version = database::get_stored_app_version(&app)?;

    // Se é primeira execução, previous_version será "0.0.0"
    let previous = if previous_version == "0.0.0" {
        None
    } else {
        Some(previous_version)
    };

    Ok(AppVersionInfo {
        current_version,
        previous_version: previous,
    })
}
