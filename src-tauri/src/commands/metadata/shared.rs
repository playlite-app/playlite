//! Módulo compartilhado para enriquecimento de metadados
//!
//! Contém estruturas e funções reutilizadas por enrichment e covers.

use crate::constants::RAWG_NOT_FOUND_MARKER;
use crate::services::cache;
use crate::services::integration::{rawg, steam_api, steamspy};
use std::collections::HashMap;

// === ESTRUTURAS COMPARTILHADAS ===

/// Progresso de enriquecimento de metadados
#[derive(serde::Serialize, Clone)]
pub struct EnrichProgress {
    pub current: i32,
    pub total_found: i32,
    pub last_game: String,
    pub status: String,
}

// === HELPERS LOCAIS ===

fn rawg_cache_key(name: &str) -> String {
    format!("search_{}", name.to_lowercase())
}

pub(in crate::commands::metadata) fn rawg_not_found_cached(
    name: &str,
    cache_conn: &rusqlite::Connection,
) -> bool {
    let cache_key = rawg_cache_key(name);
    cache::get_cached_api_data(cache_conn, "rawg", &cache_key)
        .is_some_and(|cached| cached == RAWG_NOT_FOUND_MARKER)
}

async fn fetch_rawg_metadata_inner(
    api_key: &str,
    name: &str,
    cache_conn: &rusqlite::Connection,
    bypass_cache: bool,
) -> Option<rawg::GameDetails> {
    let cache_key = rawg_cache_key(name);

    if !bypass_cache {
        if let Some(cached) = cache::get_cached_api_data(cache_conn, "rawg", &cache_key) {
            if cached == RAWG_NOT_FOUND_MARKER {
                return None;
            }
            if let Ok(details) = serde_json::from_str::<rawg::GameDetails>(&cached) {
                return Some(details);
            }
        }
    }

    match rawg::search_games(api_key, name).await {
        Ok(results) => {
            if let Some(best_match) = results.first() {
                match rawg::fetch_game_details(api_key, best_match.id.to_string()).await {
                    Ok(details) => {
                        if let Ok(json) = serde_json::to_string(&details) {
                            let _ =
                                cache::save_cached_api_data(cache_conn, "rawg", &cache_key, &json);
                        }
                        Some(details)
                    }
                    Err(err) => {
                        if err.contains("não encontrado") || err.contains("404") {
                            let _ = cache::save_cached_api_data(
                                cache_conn,
                                "rawg",
                                &cache_key,
                                RAWG_NOT_FOUND_MARKER,
                            );
                        }
                        None
                    }
                }
            } else {
                let _ = cache::save_cached_api_data(
                    cache_conn,
                    "rawg",
                    &cache_key,
                    RAWG_NOT_FOUND_MARKER,
                );
                None
            }
        }
        Err(_) => None,
    }
}

// === FUNÇÕES COMPARTILHADAS ===

/// Busca metadados RAWG com cache
///
/// Esta função é compartilhada entre enrichment e covers
/// para buscar informações de jogos na API RAWG com suporte a cache SQLite.
pub async fn fetch_rawg_metadata(
    api_key: &str,
    name: &str,
    cache_conn: &rusqlite::Connection,
) -> Option<rawg::GameDetails> {
    fetch_rawg_metadata_inner(api_key, name, cache_conn, false).await
}

/// Variante que ignora o cache e sempre consulta a RAWG ao vivo.
///
/// Usada pelo comando `fill_missing_metadata` para garantir que dados
/// possivelmente atualizados na RAWG sejam buscados mesmo para jogos
/// cujo cache ainda é válido.
pub async fn fetch_rawg_metadata_fresh(
    api_key: &str,
    name: &str,
    cache_conn: &rusqlite::Connection,
) -> Option<rawg::GameDetails> {
    fetch_rawg_metadata_inner(api_key, name, cache_conn, true).await
}

// === FUNÇÕES AUXILIARES ===

pub(crate) fn extract_steam_id_from_url(url: &str) -> Option<String> {
    if url.contains("store.steampowered.com/app/") {
        let parts: Vec<&str> = url.split("/app/").collect();
        if let Some(right_part) = parts.get(1) {
            let id_part: String = right_part.chars().take_while(|c| c.is_numeric()).collect();
            if !id_part.is_empty() {
                return Some(id_part);
            }
        }
    }
    None
}

/// Tenta localizar um Steam App ID em qualquer valor de `external_links`, não apenas na chave "steam".
///
/// Cobre o caso em que a RAWG não lista Steam como "store" própria, mas outro campo (ex: `website`) já é a página da Steam.
pub(crate) fn find_steam_id_in_links(links: &HashMap<String, String>) -> Option<String> {
    links
        .values()
        .find_map(|url| extract_steam_id_from_url(url))
}

// === ENRIQUECIMENTO COM CACHE ===

/// Busca dados Steam Store com cache
pub(crate) async fn fetch_steam_store_data(
    steam_id: &str,
    cache_conn: &rusqlite::Connection,
) -> Option<steam_api::SteamStoreData> {
    let cache_key = format!("store_{}", steam_id);

    if let Some(cached) = cache::get_cached_api_data(cache_conn, "steam", &cache_key) {
        if let Ok(data) = serde_json::from_str::<steam_api::SteamStoreData>(&cached) {
            return Some(data);
        }
    }

    match steam_api::get_app_details(steam_id).await {
        Ok(Some(data)) => {
            if let Ok(json) = serde_json::to_string(&data) {
                let _ = cache::save_cached_api_data(cache_conn, "steam", &cache_key, &json);
            }
            Some(data)
        }
        _ => None,
    }
}

/// Busca reviews Steam com cache
pub(crate) async fn fetch_steam_reviews(
    steam_id: &str,
    cache_conn: &rusqlite::Connection,
) -> Option<steam_api::SteamReviewSummary> {
    let cache_key = format!("reviews_{}", steam_id);

    if let Some(cached) = cache::get_cached_api_data(cache_conn, "steam", &cache_key) {
        if let Ok(reviews) = serde_json::from_str::<steam_api::SteamReviewSummary>(&cached) {
            return Some(reviews);
        }
    }

    match steam_api::get_app_reviews(steam_id).await {
        Ok(Some(reviews)) => {
            if let Ok(json) = serde_json::to_string(&reviews) {
                let _ = cache::save_cached_api_data(cache_conn, "steam", &cache_key, &json);
            }
            Some(reviews)
        }
        _ => None,
    }
}

/// Busca median playtime com cache
pub(crate) async fn fetch_steam_playtime(
    steam_id: &str,
    cache_conn: &rusqlite::Connection,
) -> Option<u32> {
    let cache_key = format!("playtime_{}", steam_id);

    if let Some(cached) = cache::get_cached_api_data(cache_conn, "steam", &cache_key) {
        if let Ok(hours) = cached.parse::<u32>() {
            return Some(hours);
        }
    }

    match steamspy::get_median_playtime(steam_id).await {
        Ok(Some(hours)) => {
            let _ =
                cache::save_cached_api_data(cache_conn, "steam", &cache_key, &hours.to_string());
            Some(hours)
        }
        _ => None,
    }
}
