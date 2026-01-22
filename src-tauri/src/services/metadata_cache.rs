//! Módulo de cache para metadados de APIs externas
//!
//! Gerencia cache persistente em SQLite para respostas de RAWG e Steam,
//! reduzindo chamadas desnecessárias e melhorando performance.

use rusqlite::{params, Connection};
use std::time::{SystemTime, UNIX_EPOCH};
use tracing::{info, warn};

// TTL (Time To Live) em dias - GRANULAR por tipo de dado
const RAWG_GAME_TTL_DAYS: i64 = 30; // Metadados gerais da RAWG
const STEAM_STORE_TTL_DAYS: i64 = 30; // Dados da loja Steam (mudam pouco)
const STEAM_REVIEWS_TTL_DAYS: i64 = 7; // Reviews Steam (atualizam frequentemente)
const STEAM_PLAYTIME_TTL_DAYS: i64 = 15; // Playtime médio (muda moderadamente)

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

    info!("Schema do cache inicializado");
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
    if cache_key.starts_with("search_") {
        RAWG_GAME_TTL_DAYS * 24 * 60 * 60
    } else if cache_key.starts_with("store_") {
        STEAM_STORE_TTL_DAYS * 24 * 60 * 60
    } else if cache_key.starts_with("reviews_") {
        STEAM_REVIEWS_TTL_DAYS * 24 * 60 * 60
    } else if cache_key.starts_with("playtime_") {
        STEAM_PLAYTIME_TTL_DAYS * 24 * 60 * 60
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
                info!(
                    "Cache expirado para {}:{} (age: {}s, TTL: {}s)",
                    source,
                    external_id,
                    current_timestamp() - updated_at,
                    get_ttl_for_cache_type(full_key)
                );
                None
            } else {
                info!("Cache HIT: {}:{}", source, external_id);
                Some(payload)
            }
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => {
            info!("Cache MISS: {}:{}", source, external_id);
            None
        }
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
    let rawg_cutoff = now - (RAWG_GAME_TTL_DAYS * 24 * 60 * 60);
    let store_cutoff = now - (STEAM_STORE_TTL_DAYS * 24 * 60 * 60);
    let reviews_cutoff = now - (STEAM_REVIEWS_TTL_DAYS * 24 * 60 * 60);
    let playtime_cutoff = now - (STEAM_PLAYTIME_TTL_DAYS * 24 * 60 * 60);

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

/// Invalida (remove) cache específico
pub fn invalidate_cache(conn: &Connection, source: &str, external_id: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM api_cache WHERE source = ?1 AND external_id = ?2",
        params![source, external_id],
    )
    .map_err(|e| format!("Erro ao invalidar cache: {}", e))?;

    Ok(())
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
    let rawg_cutoff = now - (RAWG_GAME_TTL_DAYS * 24 * 60 * 60);
    let store_cutoff = now - (STEAM_STORE_TTL_DAYS * 24 * 60 * 60);
    let reviews_cutoff = now - (STEAM_REVIEWS_TTL_DAYS * 24 * 60 * 60);
    let playtime_cutoff = now - (STEAM_PLAYTIME_TTL_DAYS * 24 * 60 * 60);

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
