//! Módulo de cache para metadados de APIs externas
//!
//! Gerencia cache persistente em SQLite para respostas de RAWG e Steam,
//! reduzindo chamadas desnecessárias e melhorando performance.

use crate::constants::{
    CACHE_RAWG_GAME_TTL_DAYS, CACHE_STEAM_PLAYTIME_TTL_DAYS, CACHE_STEAM_REVIEWS_TTL_DAYS,
    CACHE_STEAM_STORE_TTL_DAYS,
};
use rusqlite::{params, Connection};
use std::time::{SystemTime, UNIX_EPOCH};
use tracing::{info, warn};

/// Inicializa o banco de cache e cria o schema
pub fn initialize_cache_db(conn: &Connection) -> Result<(), String> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS api_cache (
            source TEXT NOT NULL,
            external_id TEXT NOT NULL,
            payload TEXT NOT NULL,
            updated_at INTEGER NOT NULL,
            PRIMARY KEY (source, external_id)
        )",
        [],
    )
    .map_err(|e| format!("Erro ao criar tabela api_cache: {}", e))?;

    // Índice para facilitar queries de limpeza por data
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_cache_updated
         ON api_cache(source, updated_at)",
        [],
    )
    .map_err(|e| format!("Erro ao criar índice: {}", e))?;

    Ok(())
}

/// Obtém timestamp atual em segundos
fn current_timestamp() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64
}

/// Determina TTL baseado no tipo de dado (granular)
fn get_ttl_for_cache_type(cache_key: &str) -> i64 {
    if cache_key.starts_with("rawg_") {
        CACHE_RAWG_GAME_TTL_DAYS * 24 * 60 * 60
    } else if cache_key.starts_with("store_") {
        CACHE_STEAM_STORE_TTL_DAYS * 24 * 60 * 60
    } else if cache_key.starts_with("reviews_") {
        CACHE_STEAM_REVIEWS_TTL_DAYS * 24 * 60 * 60
    } else if cache_key.starts_with("playtime_") {
        CACHE_STEAM_PLAYTIME_TTL_DAYS * 24 * 60 * 60
    } else {
        7 * 24 * 60 * 60 // default 7 dias
    }
}

/// Verifica se o cache está expirado baseado no TTL do tipo de dado
fn is_cache_expired(cache_key: &str, updated_at: i64) -> bool {
    let now = current_timestamp();
    let ttl_seconds = get_ttl_for_cache_type(cache_key);

    (now - updated_at) > ttl_seconds
}

/// Busca dados em cache
///
/// Retorna None se:
/// - Dados não existem
/// - Cache expirou
pub fn get_cached_api_data(conn: &Connection, source: &str, external_id: &str) -> Option<String> {
    let result: Result<(String, i64), rusqlite::Error> = conn.query_row(
        "SELECT payload, updated_at FROM api_cache
         WHERE source = ?1 AND external_id = ?2",
        params![source, external_id],
        |row| Ok((row.get(0)?, row.get(1)?)),
    );

    match result {
        Ok((payload, updated_at)) => {
            // Usa a chave completa (external_id) para determinar TTL
            let full_key = external_id;
            if is_cache_expired(full_key, updated_at) {
                None
            } else {
                Some(payload)
            }
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => None,
        Err(e) => {
            warn!("Erro ao buscar cache: {}", e);
            None
        }
    }
}

/// Salva dados no cache
pub fn save_cached_api_data(
    conn: &Connection,
    source: &str,
    external_id: &str,
    payload: &str,
) -> Result<(), String> {
    let now = current_timestamp();

    conn.execute(
        "INSERT OR REPLACE INTO api_cache (source, external_id, payload, updated_at)
         VALUES (?1, ?2, ?3, ?4)",
        params![source, external_id, payload, now],
    )
    .map_err(|e| format!("Erro ao salvar cache: {}", e))?;

    Ok(())
}

/// Remove entradas expiradas do cache (limpeza granular)
pub fn cleanup_expired_cache(conn: &Connection) -> Result<usize, String> {
    let now = current_timestamp();

    // Diferentes cutoffs para diferentes tipos
    let rawg_cutoff = now - (CACHE_RAWG_GAME_TTL_DAYS * 24 * 60 * 60);
    let store_cutoff = now - (CACHE_STEAM_STORE_TTL_DAYS * 24 * 60 * 60);
    let reviews_cutoff = now - (CACHE_STEAM_REVIEWS_TTL_DAYS * 24 * 60 * 60);
    let playtime_cutoff = now - (CACHE_STEAM_PLAYTIME_TTL_DAYS * 24 * 60 * 60);

    let deleted = conn
        .execute(
            "DELETE FROM api_cache
             WHERE (source = 'rawg' AND external_id LIKE 'search_%' AND updated_at < ?1)
                OR (source = 'steam' AND external_id LIKE 'store_%' AND updated_at < ?2)
                OR (source = 'steam' AND external_id LIKE 'reviews_%' AND updated_at < ?3)
                OR (source = 'steam' AND external_id LIKE 'playtime_%' AND updated_at < ?4)",
            params![rawg_cutoff, store_cutoff, reviews_cutoff, playtime_cutoff],
        )
        .map_err(|e| format!("Erro ao limpar cache: {}", e))?;

    if deleted > 0 {
        info!("Cache cleanup: {} entradas removidas", deleted);
    }

    Ok(deleted)
}

/// Retorna estatísticas do cache
#[derive(Debug, serde::Serialize)]
pub struct CacheStats {
    pub total_entries: i32,
    pub rawg_entries: i32,
    pub steam_entries: i32,
    pub expired_entries: i32,
}

pub fn get_cache_stats(conn: &Connection) -> Result<CacheStats, String> {
    let total: i32 = conn
        .query_row("SELECT COUNT(*) FROM api_cache", [], |row| row.get(0))
        .unwrap_or(0);

    let rawg: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM api_cache WHERE source = 'rawg'",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let steam: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM api_cache WHERE source = 'steam'",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let now = current_timestamp();
    let rawg_cutoff = now - (CACHE_RAWG_GAME_TTL_DAYS * 24 * 60 * 60);
    let store_cutoff = now - (CACHE_STEAM_STORE_TTL_DAYS * 24 * 60 * 60);
    let reviews_cutoff = now - (CACHE_STEAM_REVIEWS_TTL_DAYS * 24 * 60 * 60);
    let playtime_cutoff = now - (CACHE_STEAM_PLAYTIME_TTL_DAYS * 24 * 60 * 60);

    let expired: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM api_cache
             WHERE (source = 'rawg' AND external_id LIKE 'search_%' AND updated_at < ?1)
                OR (source = 'steam' AND external_id LIKE 'store_%' AND updated_at < ?2)
                OR (source = 'steam' AND external_id LIKE 'reviews_%' AND updated_at < ?3)
                OR (source = 'steam' AND external_id LIKE 'playtime_%' AND updated_at < ?4)",
            params![rawg_cutoff, store_cutoff, reviews_cutoff, playtime_cutoff],
            |row| row.get(0),
        )
        .unwrap_or(0);

    Ok(CacheStats {
        total_entries: total,
        rawg_entries: rawg,
        steam_entries: steam,
        expired_entries: expired,
    })
}
