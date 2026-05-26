//! Comamdos para obter catálogo de jogos de serviços assinados.

use crate::database::AppState;
use crate::scrapers::amazon_luna::LunaGame;
use crate::scrapers::game_pass::GamePassGame;
use crate::services::subscriptions;
use tauri::State;

#[tauri::command]
pub async fn get_amazon_luna_catalog(state: State<'_, AppState>) -> Result<Vec<LunaGame>, String> {
    subscriptions::get_amazon_luna_games(&state).await
}

#[tauri::command]
pub async fn get_game_pass_catalog(
    state: State<'_, AppState>,
    exclude_ea_play: bool,
) -> Result<Vec<GamePassGame>, String> {
    subscriptions::get_game_pass_games(&state, exclude_ea_play).await
}

#[tauri::command]
pub async fn get_ea_play_catalog(state: State<'_, AppState>) -> Result<Vec<GamePassGame>, String> {
    subscriptions::get_ea_play_games(&state).await
}

#[tauri::command]
pub fn get_subscription_settings(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    subscriptions::get_enabled_services(&state)
}

#[tauri::command]
pub fn save_subscription_settings(
    state: State<'_, AppState>,
    services: Vec<String>,
) -> Result<(), String> {
    subscriptions::set_enabled_services(&state, services)
}
