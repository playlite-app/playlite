//! Módulo de integrações com APIs externas.
//!
//! Coordena a comunicação com serviços de terceiros (RAWG, Steam) e
//! orquestra operações complexas como importação em lote e enriquecimento.

use crate::constants::{RAWG_RATE_LIMIT_MS, RAWG_REQUISITIONS_PER_BATCH, STEAMSPY_RATE_LIMIT_MS};
use crate::database::{self, AppState};
use crate::services::{rawg, steam};
use crate::utils::series;
use rusqlite::params;
use std::collections::HashMap;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::time::sleep;
use tracing::{info, warn};

// === ESTRUTURAS ===

#[derive(serde::Serialize)]
pub struct ImportSummary {
    pub success_count: i32,
    pub error_count: i32,
    pub total_processed: i32,
    pub message: String,
    pub errors: Vec<String>,
}

#[derive(serde::Serialize, Clone)]
struct EnrichProgress {
    current: i32,
    total_found: i32,
    last_game: String,
    status: String,
}

/// Estrutura intermediária
struct ProcessedGameDetails {
    game_id: String,
    description_raw: Option<String>,
    description_ptbr: Option<String>,
    release_date: Option<String>,
    genres: String,
    tags: String,
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
    external_links: Option<String>, // JSON
    steam_app_id: Option<String>,
    median_playtime: Option<i32>,
}

// === FUNÇÕES UTILITÁRIAS ===

fn get_api_key(app_handle: &AppHandle) -> Result<String, String> {
    database::get_secret(app_handle, "rawg_api_key")
}

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

// === LÓGICA CORE ===

/// Processa um único jogo: busca RAWG, infere Steam ID, busca Steam e monta o objeto final.
async fn process_single_game(
    api_key: &str,
    has_rawg: bool,
    game_id: &str,
    name: &str,
    platform: &str,
    platform_id: Option<String>,
) -> ProcessedGameDetails {
    let series_name = series::infer_series(name);
    let mut details = ProcessedGameDetails {
        game_id: game_id.to_string(),
        description_raw: None,
        description_ptbr: None,
        release_date: None,
        genres: String::new(),
        tags: String::new(),
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
    };

    let mut links_map: HashMap<String, String> = HashMap::new();

    // 1. Estratégia de Steam ID
    let mut target_steam_id = if platform.to_lowercase() == "steam" {
        platform_id
    } else {
        None
    };

    // 2. Busca na RAWG
    if has_rawg {
        if let Ok(results) = rawg::search_games(api_key, name).await {
            if let Some(best_match) = results.first() {
                if let Ok(rawg_det) =
                    rawg::fetch_game_details(api_key, best_match.id.to_string()).await
                {
                    // Preenchimento
                    details.description_raw = rawg_det.description_raw;
                    details.release_date = rawg_det.released;
                    details.genres = rawg_det
                        .genres
                        .iter()
                        .map(|g| g.name.clone())
                        .collect::<Vec<_>>()
                        .join(", ");
                    details.tags = rawg_det
                        .tags
                        .iter()
                        .take(10)
                        .map(|t| t.name.clone())
                        .collect::<Vec<_>>()
                        .join(", ");
                    details.developer = rawg_det.developers.first().map(|d| d.name.clone());
                    details.publisher = rawg_det.publishers.first().map(|p| p.name.clone());
                    details.critic_score = rawg_det.metacritic;
                    details.background_image = rawg_det
                        .background_image
                        .or(best_match.background_image.clone());
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
                        format!("https://rawg.io/games/{}", best_match.slug),
                    );

                    // Tenta descobrir Steam ID via RAWG
                    if target_steam_id.is_none() {
                        for store_data in &rawg_det.stores {
                            if store_data.store.slug == "steam" {
                                if let Some(extracted_id) =
                                    extract_steam_id_from_url(&store_data.url)
                                {
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
            }
        }
    }

    // 3. Busca na Steam (Se tivermos ID)
    if let Some(steam_id) = &target_steam_id {
        if !links_map.contains_key("steam") {
            links_map.insert(
                "steam".to_string(),
                format!("https://store.steampowered.com/app/{}", steam_id),
            );
        }
        details.steam_app_id = Some(steam_id.clone());

        // A. Loja (Adult + Metadados fallback)
        if let Ok(Some(store_data)) = steam::get_app_details(steam_id).await {
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
        if let Ok(Some(reviews)) = steam::get_app_reviews(steam_id).await {
            details.steam_review_label = Some(reviews.review_score_desc);
            details.steam_review_count = Some(reviews.total_reviews as i32);
            let total = reviews.total_positive + reviews.total_negative;
            if total > 0 {
                details.steam_review_score =
                    Some((reviews.total_positive as f32 / total as f32) * 100.0);
            }
            details.steam_review_updated_at = Some(chrono::Utc::now().to_rfc3339());
        }

        // C. Median Playtime (SteamSpy)
        if let Ok(Some(hours)) = steam::get_median_playtime(steam_id).await {
            details.median_playtime = Some(hours as i32);
        }
    }

    if !links_map.is_empty() {
        details.external_links = serde_json::to_string(&links_map).ok();
    }

    // === LOG DE DEBUG ===
    info!(
        "Processado {}: ESRB={:?}, Playtime={:?}, SteamID={:?}",
        name, details.esrb_rating, details.median_playtime, details.steam_app_id
    );

    details
}

// === PERSISTÊNCIA ===

/// Salva os detalhes processados no banco de dados.
fn save_game_details(
    conn: &rusqlite::Connection,
    d: ProcessedGameDetails,
) -> Result<(), rusqlite::Error> {
    // 1. Salva detalhes
    conn.execute(
        "INSERT OR REPLACE INTO game_details (
            game_id, description_raw, description_ptbr, release_date, genres, tags,
            developer, publisher, critic_score, background_image, series,
            steam_review_label, steam_review_count, steam_review_score, steam_review_updated_at,
            esrb_rating, is_adult, adult_tags, external_links, steam_app_id, median_playtime
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21)",
        params![
            d.game_id, d.description_raw, d.description_ptbr, d.release_date, d.genres, d.tags,
            d.developer, d.publisher, d.critic_score, d.background_image, d.series,
            d.steam_review_label, d.steam_review_count, d.steam_review_score, d.steam_review_updated_at,
            d.esrb_rating, d.is_adult, d.adult_tags, d.external_links, d.steam_app_id, d.median_playtime
        ],
    )?;

    // 2. Atualiza capa na tabela principal se necessário
    if let Some(img) = d.background_image {
        conn.execute(
            "UPDATE games SET cover_url = ?1 WHERE id = ?2 AND (cover_url IS NULL OR cover_url = '')",
            params![img, d.game_id],
        )?;
    }

    Ok(())
}

// === COMANDOS PRINCIPAIS ===

/// Atualiza metadados de jogos na biblioteca.
///
/// Processa jogos em lotes assíncronos, emitindo progresso via eventos.
/// Continua até que todos os jogos sem detalhes sejam processados.
#[tauri::command]
pub async fn update_metadata(app: AppHandle) -> Result<(), String> {
    let app_handle = app.clone();
    let api_key = get_api_key(&app).unwrap_or_default();
    let has_rawg = !api_key.is_empty();

    tauri::async_runtime::spawn(async move {
        info!("Iniciando atualização de metadados...");

        loop {
            let state: State<AppState> = app_handle.state();

            // 1. Busca lote de jogos
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

            // 2. Processa cada jogo
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

                let processed_data = process_single_game(
                    &api_key,
                    has_rawg,
                    &game_id,
                    &name,
                    &platform,
                    platform_id,
                )
                .await;
                {
                    let conn = state.library_db.lock().unwrap();
                    if let Err(e) = save_game_details(&conn, processed_data) {
                        warn!("Erro ao salvar metadados para {}: {}", name, e);
                    }
                }

                if has_rawg {
                    sleep(Duration::from_millis(RAWG_RATE_LIMIT_MS)).await;
                } else {
                    sleep(Duration::from_millis(STEAMSPY_RATE_LIMIT_MS)).await;
                }
            }
        }

        info!("Metadata update concluído.");
        let _ = app_handle.emit("enrich_complete", "Metadados atualizados!");
    });

    Ok(())
}

/// Busca capas faltantes via RAWG.
///
/// Busca a lista de jogos SEM CAPA, e atualiza cada um que encontrar a capa na RAWG.
#[tauri::command]
pub async fn fetch_missing_covers(app: AppHandle) -> Result<(), String> {
    let app_handle = app.clone();
    let api_key = get_api_key(&app)?;

    if api_key.is_empty() {
        return Err("API Key RAWG necessária".to_string());
    }

    tauri::async_runtime::spawn(async move {
        info!("Iniciando busca de capas faltantes...");

        let state: State<AppState> = app_handle.state();
        let mut total_updated = 0;
        let mut total_failed = 0;

        // 1. Busca TODOS os jogos que precisam de capa de uma vez
        let games_without_cover: Vec<(String, String)> = {
            let conn = state.library_db.lock().unwrap();
            let mut stmt = conn
                .prepare("SELECT id, name FROM games WHERE cover_url IS NULL OR cover_url = ''")
                .unwrap();

            stmt.query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
                .unwrap()
                .flatten()
                .collect()
        };

        if !games_without_cover.is_empty() {
            let count = games_without_cover.len();

            for (index, (game_id, name)) in games_without_cover.into_iter().enumerate() {
                // Emite progresso com prefixo "Capa:" para o frontend identificar
                let _ = app_handle.emit(
                    "enrich_progress",
                    EnrichProgress {
                        current: (index + 1) as i32,
                        total_found: count as i32,
                        last_game: format!("Capa: {}", name),
                        status: "running".to_string(),
                    },
                );

                match rawg::search_games(&api_key, &name).await {
                    Ok(results) => {
                        if let Some(img) = results.first().and_then(|g| g.background_image.as_ref())
                        {
                            let conn = state.library_db.lock().unwrap();
                            if conn
                                .execute(
                                    "UPDATE games SET cover_url = ?1 WHERE id = ?2",
                                    params![img, game_id],
                                )
                                .is_ok()
                            {
                                total_updated += 1;
                            } else {
                                total_failed += 1;
                            }
                        } else {
                            total_failed += 1;
                        }
                    }
                    Err(_) => {
                        total_failed += 1;
                    }
                }

                sleep(Duration::from_millis(RAWG_RATE_LIMIT_MS)).await;
            }
        }

        // Emite o evento final
        info!(
            "Busca de capas finalizada: {} sucesso, {} falhas",
            total_updated, total_failed
        );
        let _ = app_handle.emit("enrich_complete", "Busca de capas finalizada.");
    });

    Ok(())
}

// === PROXIES DO FRONTEND ===

/// Busca detalhes de um jogo na RAWG.
#[tauri::command]
pub async fn fetch_game_details(
    app: AppHandle,
    query: String,
) -> Result<rawg::GameDetails, String> {
    let api_key = get_api_key(&app)?;
    rawg::fetch_game_details(&api_key, query).await
}

/// Busca jogos em alta na RAWG.
#[tauri::command]
pub async fn get_trending_games(app: AppHandle) -> Result<Vec<rawg::RawgGame>, String> {
    let api_key = get_api_key(&app)?;
    rawg::fetch_trending_games(&api_key).await
}

/// Busca jogos que serão lançados em breve na RAWG.
#[tauri::command]
pub async fn get_upcoming_games(app: AppHandle) -> Result<Vec<rawg::RawgGame>, String> {
    let api_key = get_api_key(&app)?;
    rawg::fetch_upcoming_games(&api_key).await
}
