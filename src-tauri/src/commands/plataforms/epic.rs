//! Epic Games - Importa jogos instalados da Epic Games

use crate::commands::plataforms::core::persist_source_games;
use crate::database::AppState;
use crate::errors::AppError;
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
pub async fn import_epic_games(
    app: AppHandle,
    state: State<'_, AppState>,
    wine_prefix: Option<String>,
) -> Result<String, AppError> {
    use crate::sources::epic::EpicSource;

    let prefix = wine_prefix
        .filter(|s| !s.trim().is_empty())
        .map(std::path::PathBuf::from);

    let source = EpicSource::new(prefix);
    let games = source.import_installed().await?;
    let (inserted, updated) = persist_source_games(&state, games).await?;
    let _ = app.emit("library_updated", ());

    Ok(format!(
        "Epic: {} adicionados, {} atualizados",
        inserted, updated
    ))
}
