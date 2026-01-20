//! Comandos para busca de metadados externos

use crate::database;
use crate::services::rawg;
use tauri::AppHandle;

#[tauri::command]
pub async fn fetch_game_details(
    app: AppHandle,
    query: String,
) -> Result<rawg::GameDetails, String> {
    let api_key = database::get_secret(&app, "rawg_api_key")?;
    rawg::fetch_game_details(&api_key, query).await
}

#[tauri::command]
pub async fn get_trending_games(app: AppHandle) -> Result<Vec<rawg::RawgGame>, String> {
    let api_key = database::get_secret(&app, "rawg_api_key")?;
    rawg::fetch_trending_games(&api_key).await
}

#[tauri::command]
pub async fn get_upcoming_games(app: AppHandle) -> Result<Vec<rawg::RawgGame>, String> {
    let api_key = database::get_secret(&app, "rawg_api_key")?;
    rawg::fetch_upcoming_games(&api_key).await
}
