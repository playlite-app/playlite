//! Módulo compartilhado para enriquecimento de metadados
//!
//! Contém estruturas e funções reutilizadas por metadata_enrichment e cover_enrichment.
//! Utiliza pub(crate) para limitar visibilidade ao crate.

use crate::database;
use crate::services::{metadata_cache, rawg};
use tauri::AppHandle;

// === ESTRUTURAS COMPARTILHADAS ===

/// Progresso de enriquecimento de metadados
#[derive(serde::Serialize, Clone)]
pub(crate) struct EnrichProgress {
    pub current: i32,
    pub total_found: i32,
    pub last_game: String,
    pub status: String,
}

// === FUNÇÕES COMPARTILHADAS ===

/// Função auxiliar para obter a chave API RAWG
pub(crate) fn get_api_key(app_handle: &AppHandle) -> Result<String, String> {
    database::get_secret(app_handle, "rawg_api_key")
}

/// Busca metadados RAWG com cache
///
/// Esta função é compartilhada entre metadata_enrichment e cover_enrichment
/// para buscar informações de jogos na API RAWG com suporte a cache SQLite.
pub(crate) async fn fetch_rawg_metadata(
    api_key: &str,
    name: &str,
    cache_conn: &rusqlite::Connection,
) -> Option<rawg::GameDetails> {
    // Tenta buscar no cache primeiro
    let cache_key = format!("search_{}", name.to_lowercase());

    if let Some(cached) = metadata_cache::get_cached_api_data(cache_conn, "rawg", &cache_key) {
        if let Ok(details) = serde_json::from_str::<rawg::GameDetails>(&cached) {
            return Some(details);
        }
    }

    // Se não está em cache, busca na API
    match rawg::search_games(api_key, name).await {
        Ok(results) => {
            if let Some(best_match) = results.first() {
                match rawg::fetch_game_details(api_key, best_match.id.to_string()).await {
                    Ok(details) => {
                        // Salva no cache
                        if let Ok(json) = serde_json::to_string(&details) {
                            let _ = metadata_cache::save_cached_api_data(
                                cache_conn, "rawg", &cache_key, &json,
                            );
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
