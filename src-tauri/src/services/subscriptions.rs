//! Modulo para buscar games de serviços de assinatura e gerenciar quais serviços o usuário assina.

use crate::database::AppState;
use crate::scrapers::amazon_luna::fetch_amazon_luna_catalog;
use crate::scrapers::amazon_luna::LunaGame;
use crate::scrapers::game_pass::{fetch_game_pass_pc_catalog, GamePassGame};
use crate::services::cache;
use rusqlite::params;
use tauri::State;

/// Retorna catálogo do Amazon Luna (do cache ou scraping)
pub async fn get_amazon_luna_games(state: &State<'_, AppState>) -> Result<Vec<LunaGame>, String> {
    let cached = {
        let conn = state.metadata_db.lock().map_err(|e| e.to_string())?;
        cache::get_cached_api_data(&conn, "prime_gaming", "catalog")
    };

    if let Some(cached) = cached {
        if let Ok(games) = serde_json::from_str::<Vec<LunaGame>>(&cached) {
            return Ok(games);
        }
    }

    let games = fetch_amazon_luna_catalog().await?;

    {
        let conn = state.metadata_db.lock().map_err(|e| e.to_string())?;
        let payload = serde_json::to_string(&games).map_err(|e| e.to_string())?;
        cache::save_cached_api_data(&conn, "prime_gaming", "catalog", &payload)?;
    }

    Ok(games)
}

/// Retorna catálogo do Game Pass PC (do cache ou scraping)
pub async fn get_game_pass_games(state: &State<'_, AppState>) -> Result<Vec<GamePassGame>, String> {
    let cached = {
        let conn = state.metadata_db.lock().map_err(|e| e.to_string())?;
        cache::get_cached_api_data(&conn, "game_pass", "catalog")
    };

    if let Some(cached) = cached {
        if let Ok(games) = serde_json::from_str::<Vec<GamePassGame>>(&cached) {
            return Ok(games);
        }
    }

    let games = fetch_game_pass_pc_catalog(false).await?;

    {
        let conn = state.metadata_db.lock().map_err(|e| e.to_string())?;
        let payload = serde_json::to_string(&games).map_err(|e| e.to_string())?;
        cache::save_cached_api_data(&conn, "game_pass", "catalog", &payload)?;
    }

    Ok(games)
}
pub fn get_enabled_services(state: &State<'_, AppState>) -> Result<Vec<String>, String> {
    let conn = state.library_db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT service FROM subscription_settings WHERE enabled = 1")
        .map_err(|e| e.to_string())?;

    let services = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(services)
}

/// Salva quais serviços o usuário assina
pub fn set_enabled_services(
    state: &State<'_, AppState>,
    services: Vec<String>,
) -> Result<(), String> {
    let conn = state.library_db.lock().map_err(|e| e.to_string())?;

    // Reseta todos para disabled
    conn.execute("UPDATE subscription_settings SET enabled = 0", [])
        .map_err(|e| e.to_string())?;

    // Habilita os selecionados (upsert)
    for service in services {
        conn.execute(
            "INSERT INTO subscription_settings (service, enabled)
             VALUES (?1, 1)
             ON CONFLICT(service) DO UPDATE SET enabled = 1",
            params![service],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}
