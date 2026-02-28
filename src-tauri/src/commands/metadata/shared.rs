//! Módulo compartilhado para enriquecimento de metadados
//!
//! Contém estruturas e funções reutilizadas por enrichment e covers.

use crate::services::cache;
use crate::services::integration::rawg;

// === ESTRUTURAS COMPARTILHADAS ===

/// Progresso de enriquecimento de metadados
#[derive(serde::Serialize, Clone)]
pub struct EnrichProgress {
    pub current: i32,
    pub total_found: i32,
    pub last_game: String,
    pub status: String,
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

async fn fetch_rawg_metadata_inner(
    api_key: &str,
    name: &str,
    cache_conn: &rusqlite::Connection,
    bypass_cache: bool,
) -> Option<rawg::GameDetails> {
    let cache_key = format!("search_{}", name.to_lowercase());

    if !bypass_cache {
        if let Some(cached) = cache::get_cached_api_data(cache_conn, "rawg", &cache_key) {
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
                    Err(_) => None,
                }
            } else {
                None
            }
        }
        Err(_) => None,
    }
}
