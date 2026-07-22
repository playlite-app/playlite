//! Xbox / Microsoft Store - Importação de jogos instalados via Gaming Services

use crate::commands::platforms::core::persist_source_games;
use crate::database::AppState;
use crate::errors::AppError;
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
pub async fn import_xbox_games(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    let games = crate::sources::xbox::import_installed()?;

    if games.is_empty() {
        return Ok("Nenhum jogo Xbox/Microsoft Store encontrado.".to_string());
    }

    let (inserted, updated, _newly_imported) = persist_source_games(&state, games).await?;
    let _ = app.emit("library_updated", ());

    Ok(format!(
        "Xbox: {} adicionados, {} atualizados",
        inserted, updated
    ))
}
