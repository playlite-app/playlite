//! Comandos para enriquecimento automático de metadados
//!
//! Este módulo contém comandos Tauri para atualizar metadados de jogos na biblioteca
//! do usuário, buscando informações de APIs externas como RAWG e Steam.
//! Versão otimizada com cache SQLite e processamento em batch.
//!
//! Design notes:
//! - Cache persistente via SQLite (metadata.db)
//! - block_in_place usado para manter conexão SQLite durante awaits
//! - Itens compartilhados com cover_enrichment estão em enrichment_shared

use crate::commands::enrichment_shared::{fetch_rawg_metadata, get_api_key, EnrichProgress};
use crate::constants::{RAWG_RATE_LIMIT_MS, RAWG_REQUISITIONS_PER_BATCH};
use crate::database;
use crate::database::AppState;
use crate::services::{metadata_cache, playtime_estimator, steam};
use crate::utils::series;
use rusqlite::params;
use std::collections::{HashMap, HashSet};
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::time::sleep;
use tracing::{info, warn};

// === ESTRUTURAS DE DADOS ===

#[derive(serde::Serialize)]
pub struct ImportSummary {
    pub success_count: i32,
    pub error_count: i32,
    pub total_processed: i32,
    pub message: String,
    pub errors: Vec<String>,
}

/// Estrutura intermediária
struct ProcessedGameDetails {
    game_id: String,
    description_raw: Option<String>,
    description_ptbr: Option<String>,
    release_date: Option<String>,
    genres: String,
    tags: Vec<crate::models::GameTag>,
    developer: Option<String>,
    publisher: Option<String>,
    critic_score: Option<i32>,
    background_image: Option<String>,
    series: Option<String>,
    steam_review_label: Option<String>,
    steam_review_count: Option<i32>,
    steam_review_score: Option<f32>,
    steam_review_updated_at: Option<String>,
    esrb_rating: Option<String>,
    is_adult: bool,
    adult_tags: Option<String>,
    external_links: Option<String>,
    steam_app_id: Option<String>,
    median_playtime: Option<i32>,
    estimated_playtime: Option<f32>,
}

// === FUNÇÕES AUXILIARES ===

fn extract_steam_id_from_url(url: &str) -> Option<String> {
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

// === ENRIQUECIMENTO COM CACHE ===

/// Busca dados Steam Store com cache
async fn fetch_steam_store_data(
    steam_id: &str,
    cache_conn: &rusqlite::Connection,
) -> Option<steam::SteamStoreData> {
    let cache_key = format!("store_{}", steam_id);

    if let Some(cached) = metadata_cache::get_cached_api_data(cache_conn, "steam", &cache_key) {
        if let Ok(data) = serde_json::from_str::<steam::SteamStoreData>(&cached) {
            return Some(data);
        }
    }

    match steam::get_app_details(steam_id).await {
        Ok(Some(data)) => {
            if let Ok(json) = serde_json::to_string(&data) {
                let _ =
                    metadata_cache::save_cached_api_data(cache_conn, "steam", &cache_key, &json);
            }
            Some(data)
        }
        _ => None,
    }
}

/// Busca reviews Steam com cache
async fn fetch_steam_reviews(
    steam_id: &str,
    cache_conn: &rusqlite::Connection,
) -> Option<steam::SteamReviewSummary> {
    let cache_key = format!("reviews_{}", steam_id);

    if let Some(cached) = metadata_cache::get_cached_api_data(cache_conn, "steam", &cache_key) {
        if let Ok(reviews) = serde_json::from_str::<steam::SteamReviewSummary>(&cached) {
            return Some(reviews);
        }
    }

    match steam::get_app_reviews(steam_id).await {
        Ok(Some(reviews)) => {
            if let Ok(json) = serde_json::to_string(&reviews) {
                let _ =
                    metadata_cache::save_cached_api_data(cache_conn, "steam", &cache_key, &json);
            }
            Some(reviews)
        }
        _ => None,
    }
}

/// Busca median playtime com cache
async fn fetch_steam_playtime(steam_id: &str, cache_conn: &rusqlite::Connection) -> Option<u32> {
    let cache_key = format!("playtime_{}", steam_id);

    if let Some(cached) = metadata_cache::get_cached_api_data(cache_conn, "steam", &cache_key) {
        if let Ok(hours) = cached.parse::<u32>() {
            return Some(hours);
        }
    }

    match steam::get_median_playtime(steam_id).await {
        Ok(Some(hours)) => {
            let _ = metadata_cache::save_cached_api_data(
                cache_conn,
                "steam",
                &cache_key,
                &hours.to_string(),
            );
            Some(hours)
        }
        _ => None,
    }
}

// === LÓGICA CORE (REFATORADA) ===

/// Processa um único jogo com cache integrado (sem manter lock)
async fn enrich_game_metadata(
    api_key: &str,
    game_id: &str,
    name: &str,
    platform: &str,
    platform_id: Option<String>,
    cache_conn: &rusqlite::Connection,
) -> (ProcessedGameDetails, Vec<String>) {
    let series_name = series::infer_series(name);
    let mut details = ProcessedGameDetails {
        game_id: game_id.to_string(),
        description_raw: None,
        description_ptbr: None,
        release_date: None,
        genres: String::new(),
        tags: Vec::new(),
        developer: None,
        publisher: None,
        critic_score: None,
        background_image: None,
        series: series_name,
        steam_review_label: None,
        steam_review_count: None,
        steam_review_score: None,
        steam_review_updated_at: None,
        esrb_rating: None,
        is_adult: false,
        adult_tags: None,
        external_links: None,
        steam_app_id: None,
        median_playtime: None,
        estimated_playtime: None,
    };

    let mut links_map: HashMap<String, String> = HashMap::new();
    let mut found_raw_tags: Vec<String> = Vec::new();

    // 1. Estratégia de Steam ID
    let mut target_steam_id = if platform.to_lowercase() == "steam" {
        platform_id
    } else {
        None
    };

    // 2. Busca na RAWG (com cache)
    if let Some(rawg_det) = fetch_rawg_metadata(api_key, name, cache_conn).await {
        found_raw_tags = rawg_det.tags.iter().map(|t| t.slug.clone()).collect();

        let raw_tag_slugs: Vec<String> = rawg_det.tags.iter().map(|t| t.slug.clone()).collect();

        details.description_raw = rawg_det.description_raw;
        details.release_date = rawg_det.released;
        details.genres = rawg_det
            .genres
            .iter()
            .map(|g| g.name.clone())
            .collect::<Vec<_>>()
            .join(", ");
        details.tags = crate::services::tag_service::classify_and_sort_tags(raw_tag_slugs, 10);
        details.developer = rawg_det.developers.first().map(|d| d.name.clone());
        details.publisher = rawg_det.publishers.first().map(|p| p.name.clone());
        details.critic_score = rawg_det.metacritic;
        details.background_image = rawg_det.background_image;
        details.esrb_rating = rawg_det.esrb_rating.as_ref().map(|r| r.name.clone());

        // Links
        if let Some(url) = &rawg_det.website {
            links_map.insert("website".to_string(), url.clone());
        }
        if let Some(url) = &rawg_det.reddit_url {
            links_map.insert("reddit".to_string(), url.clone());
        }
        if let Some(url) = &rawg_det.metacritic_url {
            links_map.insert("metacritic".to_string(), url.clone());
        }
        links_map.insert(
            "rawg".to_string(),
            format!("https://rawg.io/api/games/{}", rawg_det.id),
        );

        // Descobre Steam ID via RAWG
        if target_steam_id.is_none() {
            for store_data in &rawg_det.stores {
                if store_data.store.slug == "steam" {
                    if let Some(extracted_id) = extract_steam_id_from_url(&store_data.url) {
                        info!(
                            "Steam ID descoberto via RAWG para '{}': {}",
                            name, extracted_id
                        );
                        target_steam_id = Some(extracted_id);
                        links_map.insert("steam".to_string(), store_data.url.clone());
                    }
                }
            }
        }
    }

    // 3. Busca na Steam (com cache)
    if let Some(steam_id) = &target_steam_id {
        if !links_map.contains_key("steam") {
            links_map.insert(
                "steam".to_string(),
                format!("https://store.steampowered.com/app/{}", steam_id),
            );
        }
        details.steam_app_id = Some(steam_id.clone());

        // A. Store data
        if let Some(store_data) = fetch_steam_store_data(steam_id, cache_conn).await {
            let (detected_adult, flags) = steam::detect_adult_content(&store_data);
            details.is_adult = detected_adult;
            if !flags.is_empty() {
                details.adult_tags = serde_json::to_string(&flags).ok();
            }

            // Fallbacks
            if details.description_raw.is_none() {
                details.description_raw = Some(store_data.short_description);
            }
            if details.release_date.is_none() {
                details.release_date = store_data.release_date;
            }
            if details.background_image.is_none() {
                details.background_image = Some(store_data.header_image);
            }
        }

        // B. Reviews
        if let Some(reviews) = fetch_steam_reviews(steam_id, cache_conn).await {
            details.steam_review_label = Some(reviews.review_score_desc);
            details.steam_review_count = Some(reviews.total_reviews as i32);
            let total = reviews.total_positive + reviews.total_negative;
            if total > 0 {
                details.steam_review_score =
                    Some((reviews.total_positive as f32 / total as f32) * 100.0);
            }
            details.steam_review_updated_at = Some(chrono::Utc::now().to_rfc3339());
        }

        // C. Playtime
        if let Some(hours) = fetch_steam_playtime(steam_id, cache_conn).await {
            details.median_playtime = Some(hours as i32);

            let genre_list: Vec<String> = details
                .genres
                .split(',')
                .map(|s| s.trim().to_lowercase())
                .collect();

            if let Some(estimated_hours) =
                playtime_estimator::estimate_playtime(Some(hours), &genre_list, &details.tags)
            {
                details.estimated_playtime = Some(estimated_hours as f32);

                info!(
                    "Playtime '{}': SteamSpy={}h -> Estimado={}h",
                    name, hours, estimated_hours
                );
            }
        }
    }

    if !links_map.is_empty() {
        details.external_links = serde_json::to_string(&links_map).ok();
    }

    info!(
        "Processado {}: ESRB={:?}, Playtime={:?}, SteamID={:?}",
        name, details.esrb_rating, details.median_playtime, details.steam_app_id
    );

    (details, found_raw_tags)
}

// === PERSISTÊNCIA ===

fn save_game_details(
    conn: &rusqlite::Connection,
    d: ProcessedGameDetails,
) -> Result<(), rusqlite::Error> {
    let tags_json = database::serialize_tags(&d.tags).unwrap_or_else(|_| "[]".to_string());

    conn.execute(
        "INSERT OR REPLACE INTO game_details (
            game_id, description_raw, description_ptbr, release_date, genres, tags,
            developer, publisher, critic_score, background_image, series,
            steam_review_label, steam_review_count, steam_review_score, steam_review_updated_at,
            esrb_rating, is_adult, adult_tags, external_links, steam_app_id, median_playtime,
            estimated_playtime
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22)",
        params![
            d.game_id, d.description_raw, d.description_ptbr, d.release_date, d.genres, tags_json,
            d.developer, d.publisher, d.critic_score, d.background_image, d.series,
            d.steam_review_label, d.steam_review_count, d.steam_review_score, d.steam_review_updated_at,
            d.esrb_rating, d.is_adult, d.adult_tags, d.external_links, d.steam_app_id, d.median_playtime,
            d.estimated_playtime
        ],
    )?;

    if let Some(img) = d.background_image {
        conn.execute(
            "UPDATE games SET cover_url = ?1 WHERE id = ?2 AND (cover_url IS NULL OR cover_url = '')",
            params![img, d.game_id],
        )?;
    }

    Ok(())
}

// === COMANDOS PRINCIPAIS ===

/// Atualiza metadados de jogos na biblioteca (OTIMIZADO)
#[tauri::command]
pub async fn update_metadata(app: AppHandle) -> Result<(), String> {
    let app_handle = app.clone();
    let api_key = get_api_key(&app).unwrap_or_default();

    if api_key.is_empty() {
        return Err("API Key RAWG necessária para atualização de metadados".to_string());
    }

    tauri::async_runtime::spawn(async move {
        info!("Iniciando atualização de metadados com cache...");

        let state: State<AppState> = app_handle.state();
        let mut all_session_tags: HashSet<String> = HashSet::new();

        // Limpeza de cache expirado no início
        {
            let cache_conn = state.metadata_db.lock().unwrap();
            if let Ok(deleted) = metadata_cache::cleanup_expired_cache(&cache_conn) {
                if deleted > 0 {
                    info!("Cache cleanup: {} entradas removidas", deleted);
                }
            }
        }

        loop {
            // 1. Busca batch de jogos
            let games_to_update: Vec<(String, String, String, Option<String>)> = {
                let conn = match state.library_db.lock() {
                    Ok(c) => c,
                    Err(_) => break,
                };
                let mut stmt = conn
                    .prepare(
                        "SELECT g.id, g.name, g.platform, g.platform_id
                         FROM games g
                         LEFT JOIN game_details gd ON g.id = gd.game_id
                         WHERE gd.game_id IS NULL
                         LIMIT ?",
                    )
                    .unwrap();

                stmt.query_map(params![RAWG_REQUISITIONS_PER_BATCH], |row| {
                    Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
                })
                .unwrap()
                .flatten()
                .collect()
            };

            if games_to_update.is_empty() {
                break;
            }

            let total_in_batch = games_to_update.len();

            // 2. Processa batch
            for (index, (game_id, name, platform, platform_id)) in
                games_to_update.into_iter().enumerate()
            {
                let _ = app_handle.emit(
                    "enrich_progress",
                    EnrichProgress {
                        current: (index + 1) as i32,
                        total_found: total_in_batch as i32,
                        last_game: name.clone(),
                        status: "running".to_string(),
                    },
                );

                // Primeiro fazer o processamento SEM async que precisa do cache
                let (processed_data, raw_tags) = {
                    let cache_conn = state.metadata_db.lock().unwrap();

                    // Executar TUDO com a conexão disponível e fazer await dentro do block_in_place
                    let result = tokio::task::block_in_place(|| {
                        let rt = tokio::runtime::Handle::current();
                        rt.block_on(async {
                            enrich_game_metadata(
                                &api_key,
                                &game_id,
                                &name,
                                &platform,
                                platform_id.clone(),
                                &cache_conn,
                            )
                            .await
                        })
                    });
                    result
                };

                for tag in raw_tags {
                    all_session_tags.insert(tag);
                }

                {
                    let conn = state.library_db.lock().unwrap();
                    if let Err(e) = save_game_details(&conn, processed_data) {
                        warn!("Erro ao salvar metadados para {}: {}", name, e);
                    }
                }
            }

            // 3. Rate limit por batch
            sleep(Duration::from_millis(RAWG_RATE_LIMIT_MS)).await;
        }

        // Estatísticas do cache
        {
            let cache_conn = state.metadata_db.lock().unwrap();
            if let Ok(stats) = metadata_cache::get_cache_stats(&cache_conn) {
                info!("Cache stats: {:?}", stats);
            }
        }

        match crate::services::tag_service::generate_analysis_report(&app_handle, all_session_tags)
        {
            Ok(path) => info!("Relatório de tags salvo em: {}", path),
            Err(e) => warn!("Falha ao salvar relatório de tags: {}", e),
        }

        info!("Metadata update concluído.");
        let _ = app_handle.emit("enrich_complete", "Metadados atualizados!");
    });

    Ok(())
}
