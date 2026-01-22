//! Comandos para gerenciar o cache de metadados
//!
//! Permite visualizar estatísticas, limpar cache expirado e invalidar entradas específicas
//! Expõe comandos Tauri para uso no frontend.

use crate::database::AppState;
use crate::services::metadata_cache;
use tauri::State;

/// Retorna estatísticas do cache
#[tauri::command]
pub fn get_cache_stats(state: State<AppState>) -> Result<metadata_cache::CacheStats, String> {
    let conn = state
        .metadata_db
        .lock()
        .map_err(|_| "Falha ao acessar metadata_db")?;

    metadata_cache::get_cache_stats(&conn)
}

/// Remove entradas expiradas do cache
#[tauri::command]
pub fn cleanup_cache(state: State<AppState>) -> Result<String, String> {
    let conn = state
        .metadata_db
        .lock()
        .map_err(|_| "Falha ao acessar metadata_db")?;

    let deleted = metadata_cache::cleanup_expired_cache(&conn)?;

    Ok(format!("{} entradas removidas", deleted))
}

/// Limpa TODO o cache (use com cuidado)
#[tauri::command]
pub fn clear_all_cache(state: State<AppState>) -> Result<String, String> {
    let conn = state
        .metadata_db
        .lock()
        .map_err(|_| "Falha ao acessar metadata_db")?;

    let deleted = conn
        .execute("DELETE FROM api_cache", [])
        .map_err(|e| e.to_string())?;

    Ok(format!("Cache limpo: {} entradas removidas", deleted))
}

/// Invalida cache de um jogo específico
#[tauri::command]
pub fn invalidate_game_cache(
    state: State<AppState>,
    source: String,
    external_id: String,
) -> Result<(), String> {
    let conn = state
        .metadata_db
        .lock()
        .map_err(|_| "Falha ao acessar metadata_db")?;

    metadata_cache::invalidate_cache(&conn, &source, &external_id)
}

/// Invalida apenas reviews de um jogo (força re-fetch)
#[tauri::command]
pub fn invalidate_game_reviews(state: State<AppState>, steam_app_id: String) -> Result<(), String> {
    let conn = state
        .metadata_db
        .lock()
        .map_err(|_| "Falha ao acessar metadata_db")?;

    let cache_key = format!("reviews_{}", steam_app_id);
    metadata_cache::invalidate_cache(&conn, "steam", &cache_key)
}

/// Estatísticas detalhadas por tipo de cache
#[derive(serde::Serialize)]
pub struct DetailedCacheStats {
    pub total: i32,
    pub rawg_searches: i32,
    pub steam_store: i32,
    pub steam_reviews: i32,
    pub steam_playtime: i32,
    pub expired: i32,
}

#[tauri::command]
pub fn get_detailed_cache_stats(state: State<AppState>) -> Result<DetailedCacheStats, String> {
    let conn = state
        .metadata_db
        .lock()
        .map_err(|_| "Falha ao acessar metadata_db")?;

    let total: i32 = conn
        .query_row("SELECT COUNT(*) FROM api_cache", [], |row| row.get(0))
        .unwrap_or(0);

    let rawg: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM api_cache
             WHERE source = 'rawg' AND external_id LIKE 'search_%'",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let store: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM api_cache
             WHERE source = 'steam' AND external_id LIKE 'store_%'",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let reviews: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM api_cache
             WHERE source = 'steam' AND external_id LIKE 'reviews_%'",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let playtime: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM api_cache
             WHERE source = 'steam' AND external_id LIKE 'playtime_%'",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let stats = metadata_cache::get_cache_stats(&conn)?;

    Ok(DetailedCacheStats {
        total,
        rawg_searches: rawg,
        steam_store: store,
        steam_reviews: reviews,
        steam_playtime: playtime,
        expired: stats.expired_entries,
    })
}
