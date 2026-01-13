//! Módulo unificado de enriquecimento de metadados.
//!
//! Combina dados de múltiplas fontes (RAWG, Steam, inferência local)
//! e processa em paralelo para melhor performance.

use crate::services::rawg;
use crate::utils::series;
use futures::stream::{self, StreamExt};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tokio::time::sleep;
use tracing::{debug, warn};

/// Metadados unificados de múltiplas fontes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedGameMetadata {
    pub game_id: String,
    pub game_name: String,

    // Dados inferidos localmente
    pub series: Option<String>,

    // Dados da RAWG
    pub description: String,
    pub release_date: Option<String>,
    pub genres: String,
    pub tags: String,
    pub developer: Option<String>,
    pub publisher: Option<String>,
    pub critic_score: Option<i32>,
    pub website_url: String,
    pub background_image: Option<String>,
    pub rawg_url: Option<String>,

    // Dados da Steam (se disponível)
    pub steam_app_id: Option<String>,

    // Status
    pub success: bool,
    pub error_message: Option<String>,
}

/// Configuração para busca de metadados
#[derive(Clone)]
pub struct MetadataConfig {
    pub rawg_api_key: String,
    pub steam_api_key: Option<String>,
    pub enable_steam: bool,
    pub rate_limit_ms: u64,
    pub max_concurrent: usize,
}

impl UnifiedGameMetadata {
    /// Cria metadados vazios para caso de erro
    fn empty_with_error(game_id: String, game_name: String, error: String) -> Self {
        Self {
            game_id,
            game_name,
            series: None,
            description: "Metadados não encontrados".to_string(),
            release_date: None,
            genres: String::new(),
            tags: String::new(),
            developer: None,
            publisher: None,
            critic_score: None,
            website_url: String::new(),
            background_image: None,
            rawg_url: None,
            steam_app_id: None,
            success: false,
            error_message: Some(error),
        }
    }
}

/// Busca metadados de um único jogo de múltiplas fontes
async fn fetch_single_game_metadata(
    game_id: String,
    game_name: String,
    config: MetadataConfig,
    delay_ms: u64,
) -> UnifiedGameMetadata {
    // Delay para rate limiting
    if delay_ms > 0 {
        sleep(Duration::from_millis(delay_ms)).await;
    }

    debug!("Buscando metadados para: {}", game_name);

    // 1. Inferência de série (local, rápido)
    let series = series::infer_series(&game_name);

    // 2. Busca na RAWG (principal fonte)
    let rawg_result = rawg::search_games(&config.rawg_api_key, &game_name).await;

    match rawg_result {
        Ok(results) => {
            if let Some(best_match) = results.first() {
                // Busca detalhes completos
                match rawg::fetch_game_details(&config.rawg_api_key, best_match.id.to_string())
                    .await
                {
                    Ok(details) => {
                        let description = details.description_raw.unwrap_or_default();
                        let website = details.website.unwrap_or_default();
                        let background_image = details
                            .background_image
                            .or(best_match.background_image.clone());

                        let genres = details
                            .genres
                            .iter()
                            .map(|g| g.name.clone())
                            .collect::<Vec<_>>()
                            .join(", ");

                        let tags = details
                            .tags
                            .iter()
                            .take(10)
                            .map(|t| t.name.clone())
                            .collect::<Vec<_>>()
                            .join(", ");

                        let developer = details.developers.first().map(|d| d.name.clone());
                        let publisher = details.publishers.first().map(|p| p.name.clone());

                        UnifiedGameMetadata {
                            game_id,
                            game_name,
                            series,
                            description,
                            release_date: details.released.clone(),
                            genres,
                            tags,
                            developer,
                            publisher,
                            critic_score: details.metacritic,
                            website_url: website,
                            background_image,
                            rawg_url: Some(format!("https://rawg.io/games/{}", best_match.id)),
                            steam_app_id: None, // TODO: Implementar busca Steam
                            success: true,
                            error_message: None,
                        }
                    }
                    Err(e) => {
                        warn!("Erro buscando detalhes RAWG para {}: {}", game_name, e);
                        UnifiedGameMetadata::empty_with_error(game_id, game_name, e)
                    }
                }
            } else {
                UnifiedGameMetadata::empty_with_error(
                    game_id,
                    game_name,
                    "Nenhum resultado encontrado".to_string(),
                )
            }
        }
        Err(e) => {
            warn!("Erro buscando na RAWG para {}: {}", game_name, e);
            UnifiedGameMetadata::empty_with_error(game_id, game_name, e)
        }
    }
}

/// Busca metadados para múltiplos jogos em paralelo
///
/// Processa jogos em lote com controle de concorrência e rate limiting.
/// Retorna lista de metadados unificados prontos para salvar no banco.
pub async fn fetch_batch_metadata(
    games: Vec<(String, String)>, // (id, name)
    config: MetadataConfig,
) -> Vec<UnifiedGameMetadata> {
    let total = games.len();
    let rate_limit_ms = config.rate_limit_ms;
    let max_concurrent = config.max_concurrent;

    debug!(
        "Iniciando busca em lote: {} jogos, concorrência: {}",
        total, max_concurrent
    );

    // Processa em paralelo com controle de concorrência
    let results = stream::iter(games.into_iter().enumerate())
        .map(|(index, (game_id, game_name))| {
            let cfg = config.clone();
            async move {
                // Calcula delay escalonado para evitar burst
                let delay = (index as u64) * (rate_limit_ms / max_concurrent as u64);
                fetch_single_game_metadata(game_id, game_name, cfg, delay).await
            }
        })
        .buffer_unordered(max_concurrent)
        .collect::<Vec<_>>()
        .await;

    debug!(
        "Busca em lote concluída: {}/{} sucessos",
        results.iter().filter(|r| r.success).count(),
        total
    );

    results
}

/// Salva metadados em batch usando uma transação
pub fn save_batch_to_db(
    conn: &mut rusqlite::Connection,
    metadata_list: Vec<UnifiedGameMetadata>,
) -> Result<usize, String> {
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let mut success_count = 0;

    for metadata in metadata_list {
        let result = tx.execute(
            "INSERT OR REPLACE INTO game_details (
                game_id, description, release_date, genres, tags,
                developer, publisher, critic_score, website_url,
                background_image, rawg_url, series, steam_app_id
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            rusqlite::params![
                metadata.game_id,
                metadata.description,
                metadata.release_date,
                metadata.genres,
                metadata.tags,
                metadata.developer,
                metadata.publisher,
                metadata.critic_score,
                metadata.website_url,
                metadata.background_image,
                metadata.rawg_url,
                metadata.series,
                metadata.steam_app_id,
            ],
        );

        if result.is_ok() {
            success_count += 1;

            // Atualiza capa se disponível
            if let Some(img) = &metadata.background_image {
                let _ = tx.execute(
                    "UPDATE games SET cover_url = ?1 WHERE id = ?2 AND (cover_url IS NULL OR cover_url = '')",
                    rusqlite::params![img, metadata.game_id],
                );
            }
        }
    }

    tx.commit().map_err(|e| e.to_string())?;

    Ok(success_count)
}
