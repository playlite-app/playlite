//! Heroic - Importa jogos instalados do Heroic Games Launcher

use crate::commands::plataforms::core::persist_source_games;
use crate::database::AppState;
use crate::errors::AppError;
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
pub async fn import_heroic_games(
    app: AppHandle,
    state: State<'_, AppState>,
    heroic_config_path: Option<String>,
) -> Result<String, AppError> {
    use crate::sources::heroic::HeroicSource;

    let config_path = heroic_config_path
        .filter(|s| !s.trim().is_empty())
        .map(std::path::PathBuf::from);

    let games = HeroicSource::import_installed(config_path).await?;
    let (inserted, updated) = persist_source_games(&state, games).await?;
    let _ = app.emit("library_updated", ());

    Ok(format!(
        "Heroic: {} adicionados, {} atualizados",
        inserted, updated
    ))
}
