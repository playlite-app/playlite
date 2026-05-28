//! Comandos para busca de metadados externos
//!
//! Permite buscar detalhes de jogos, listas de tendências e giveaways
//! usando APIs externas como RAWG e GamerPower.

use crate::database;
use crate::errors::AppError;
use crate::services::integration::gamebrain::{GameMedia, SimilarGame};
use crate::services::integration::gamerpower::{self, Giveaway};
use crate::services::integration::{gamebrain, rawg};
use tauri::AppHandle;

/// Busca detalhes de um jogo na RAWG
#[tauri::command]
pub async fn fetch_game_details(
    app: AppHandle,
    query: String,
) -> Result<rawg::GameDetails, AppError> {
    let api_key = database::get_secret(&app, "rawg_api_key")?;
    rawg::fetch_game_details(&api_key, query)
        .await
        .map_err(AppError::NetworkError)
}

/// Busca jogos em tendência no momento na RAWG
#[tauri::command]
pub async fn get_trending_games(app: AppHandle) -> Result<Vec<rawg::RawgGame>, AppError> {
    let api_key = database::get_secret(&app, "rawg_api_key")?;
    rawg::fetch_trending_games(&app, &api_key)
        .await
        .map_err(AppError::NetworkError)
}

/// Busca jogos que serão lançados em breve na RAWG
#[tauri::command]
pub async fn get_upcoming_games(app: AppHandle) -> Result<Vec<rawg::RawgGame>, AppError> {
    let api_key = database::get_secret(&app, "rawg_api_key")?;
    rawg::fetch_upcoming_games(&app, &api_key)
        .await
        .map_err(AppError::NetworkError)
}

/// Busca giveaways ativos na GamerPower
#[tauri::command]
pub async fn get_active_giveaways(app: AppHandle) -> Result<Vec<Giveaway>, AppError> {
    gamerpower::fetch_giveaways(&app)
        .await
        .map_err(AppError::NetworkError)
}

/// Busca jogos similares usando a API do GameBrain
#[tauri::command]
pub async fn get_similar_games(
    app: AppHandle,
    game_id: String,
    game_name: String,
) -> Result<Vec<SimilarGame>, String> {
    gamebrain::fetch_similar_games(&app, &game_id, &game_name, Some(12)).await
}

/// Busca midia de jogos (screenshots, trailers) usando a API do GameBrain
#[tauri::command]
pub async fn get_game_media(
    app: AppHandle,
    game_id: String,
    game_name: String,
) -> Result<GameMedia, String> {
    gamebrain::fetch_game_media(&app, &game_id, &game_name).await
}
