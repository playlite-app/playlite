//! Módulo de integrações com APIs externas.
//!
//! Coordena a comunicação com serviços de terceiros (RAWG, Steam) e
//! orquestra operações complexas como importação em lote e enriquecimento.

use crate::constants::{RAWG_RATE_LIMIT_MS, RAWG_REQUISITIONS_PER_BATCH};
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
    #[serde(rename = "successCount")]
    pub success_count: i32,
    #[serde(rename = "errorCount")]
    pub error_count: i32,
    #[serde(rename = "totalProcessed")]
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

// === FUNÇÕES AUXILIARES ===

fn get_api_key(app_handle: &AppHandle) -> Result<String, String> {
    database::get_secret(app_handle, "rawg_api_key")
}

fn query_basic_games_batch(
    conn: &rusqlite::Connection,
    query: &str,
    limit: u32,
) -> Vec<(String, String)> {
    let mut stmt = conn.prepare(query).unwrap();
    let rows = stmt
        .query_map(params![limit], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .unwrap();
    rows.flatten().collect()
}

/// Helper para extrair Steam AppID de uma URL da Steam Store
/// Ex: "https://store.steampowered.com/app/1091500/Cyberpunk_2077/" -> Some("1091500")
fn extract_steam_id_from_url(url: &str) -> Option<String> {
    if url.contains("store.steampowered.com/app/") {
        let parts: Vec<&str> = url.split("/app/").collect();
        if let Some(right_part) = parts.get(1) {
            // Pega o número antes da próxima barra
            let id_part: String = right_part.chars().take_while(|c| c.is_numeric()).collect();
            if !id_part.is_empty() {
                return Some(id_part);
            }
        }
    }
    None
}

// === COMANDOS PRINCIPAIS ===

/// Atualiza metadados de jogos faltantes via RAWG e Steam.
///
/// Utiliza uma estratégia híbrida para maximizar a cobertura:
/// 1. Tenta buscar dados na RAWG primeiro.
/// 2. Se disponível, tenta extrair o Steam ID via RAWG.
/// 3. Se tiver Steam ID (nativo ou extraído), busca dados adicionais na Steam.
///
/// Atualiza o banco de dados em lotes assíncronos, emitindo progresso via eventos.
/// Continua até que todos os jogos sem detalhes sejam processados.
#[tauri::command]
pub async fn update_metadata(app: AppHandle) -> Result<(), String> {
    let app_handle = app.clone();
    let api_key = get_api_key(&app).unwrap_or_default();
    let has_rawg = !api_key.is_empty();

    tauri::async_runtime::spawn(async move {
        info!("Iniciando atualização de metadados (Híbrido: RAWG + Steam Cross-Platform)...");

        loop {
            let state: State<AppState> = app_handle.state();

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

                let rows = stmt
                    .query_map(params![RAWG_REQUISITIONS_PER_BATCH], |row| {
                        Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
                    })
                    .unwrap();

                rows.flatten().collect()
            };

            if games_to_update.is_empty() {
                let _ = app_handle.emit("update_complete", "Todos os jogos atualizados!");
                break;
            }

            let total_in_batch = games_to_update.len();

            for (index, (game_id, name, platform, platform_id)) in
                games_to_update.into_iter().enumerate()
            {
                let _ = app_handle.emit(
                    "update_progress",
                    EnrichProgress {
                        current: (index + 1) as i32,
                        total_found: total_in_batch as i32,
                        last_game: name.clone(),
                        status: "running".to_string(),
                    },
                );

                let series_name = series::infer_series(&name);

                // Variáveis para preenchimento
                let mut description_raw: Option<String> = None;
                let description_ptbr: Option<String> = None;
                let mut release_date: Option<String> = None;
                let mut genres_str = String::new();
                let mut tags_str = String::new();
                let mut developer: Option<String> = None;
                let mut publisher: Option<String> = None;
                let mut critic_score: Option<i32> = None;
                let mut background: Option<String> = None;
                let esrb_rating: Option<String> = None;

                // Variáveis Steam (Reviews e Adult Content)
                let mut is_adult = false;
                let mut adult_tags_json = None;
                let mut steam_review_label = None;
                let mut steam_review_count = None;
                let mut steam_review_score = None;
                let mut steam_review_updated_at = None;

                let mut links_map: HashMap<String, String> = HashMap::new();

                // === ESTRATÉGIA DE STEAM ID ===

                // Tenta obter o Steam ID de duas formas:
                // 1. Se o jogo já for da plataforma Steam (temos o ID nativo)
                // 2. Se a RAWG nos der um link para a loja Steam
                let mut target_steam_id = if platform.to_lowercase() == "steam" {
                    platform_id.clone()
                } else {
                    None
                };

                // === BUSCA NA RAWG ===
                if has_rawg {
                    match rawg::search_games(&api_key, &name).await {
                        Ok(results) => {
                            if let Some(best_match) = results.first() {
                                if let Ok(details) =
                                    rawg::fetch_game_details(&api_key, best_match.id.to_string())
                                        .await
                                {
                                    // Preenchimento Básico
                                    description_raw = details.description_raw;
                                    release_date = details.released;
                                    genres_str = details
                                        .genres
                                        .iter()
                                        .map(|g| g.name.clone())
                                        .collect::<Vec<_>>()
                                        .join(", ");
                                    tags_str = details
                                        .tags
                                        .iter()
                                        .take(10)
                                        .map(|t| t.name.clone())
                                        .collect::<Vec<_>>()
                                        .join(", ");
                                    developer = details.developers.first().map(|d| d.name.clone());
                                    publisher = details.publishers.first().map(|p| p.name.clone());
                                    critic_score = details.metacritic;
                                    background = details
                                        .background_image
                                        .or(best_match.background_image.clone());

                                    // Links
                                    if let Some(url) = &details.website {
                                        links_map.insert("website".to_string(), url.clone());
                                    }
                                    if let Some(url) = &details.reddit_url {
                                        links_map.insert("reddit".to_string(), url.clone());
                                    }
                                    if let Some(url) = &details.metacritic_url {
                                        links_map.insert("metacritic".to_string(), url.clone());
                                    }

                                    let r_url =
                                        format!("https://rawg.io/games/{}", best_match.slug);
                                    links_map.insert("rawg".to_string(), r_url);

                                    // === TENTATIVA DE DESCOBRIR STEAM ID VIA RAWG ===

                                    if target_steam_id.is_none() {
                                        for store_data in &details.stores {
                                            if store_data.store.slug == "steam" {
                                                if let Some(extracted_id) =
                                                    extract_steam_id_from_url(&store_data.url)
                                                {
                                                    info!("Steam ID descoberto via RAWG para '{}': {}", name, extracted_id);
                                                    target_steam_id = Some(extracted_id);
                                                    // Salva o link da loja
                                                    links_map.insert(
                                                        "steam".to_string(),
                                                        store_data.url.clone(),
                                                    );
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        Err(e) => warn!("Erro RAWG para {}: {}", name, e),
                    }
                    sleep(Duration::from_millis(RAWG_RATE_LIMIT_MS)).await;
                }

                // === BUSCA NA STEAM (Se tivermos um ID, independente da origem) ===

                if let Some(steam_id) = &target_steam_id {
                    // Garante que o link da Steam esteja no mapa se viemos da importação nativa
                    if !links_map.contains_key("steam") {
                        links_map.insert(
                            "steam".to_string(),
                            format!("https://store.steampowered.com/app/{}", steam_id),
                        );
                    }

                    // A. Metadados e Conteúdo Adulto
                    match steam::get_app_details(steam_id).await {
                        Ok(Some(store_data)) => {
                            // Detecção de Adulto PRIMEIRO (antes de consumir campos)
                            let (detected_adult, flags) = steam::detect_adult_content(&store_data);
                            is_adult = detected_adult;
                            if !flags.is_empty() {
                                adult_tags_json = serde_json::to_string(&flags).ok();
                            }

                            // Fallbacks se RAWG falhou
                            if description_raw.is_none() {
                                description_raw = Some(store_data.short_description);
                            }
                            if release_date.is_none() {
                                release_date = store_data.release_date;
                            }
                            if background.is_none() {
                                background = Some(store_data.header_image);
                            }
                        }
                        _ => {}
                    }

                    // B. Reviews
                    match steam::get_app_reviews(steam_id).await {
                        Ok(Some(reviews)) => {
                            steam_review_label = Some(reviews.review_score_desc);
                            steam_review_count = Some(reviews.total_reviews as i32);
                            let total = reviews.total_positive + reviews.total_negative;
                            if total > 0 {
                                let score_pct =
                                    (reviews.total_positive as f32 / total as f32) * 100.0;
                                steam_review_score = Some(score_pct);
                            }
                            steam_review_updated_at = Some(chrono::Utc::now().to_rfc3339());
                        }
                        _ => {}
                    }
                }

                // C. Tempo Médio (SteamSpy)
                if let Some(steam_id) = &target_steam_id {
                    match steam::get_median_playtime(steam_id).await {
                        Ok(Some(hours)) => {
                            let conn = state.library_db.lock().unwrap();
                            let _ = conn.execute(
                                "UPDATE game_details SET median_playtime = ?1 WHERE game_id = ?2",
                                params![hours as i32, game_id],
                            );
                        }
                        _ => {}
                    }

                    // Rate limit de 1 req/segundo
                    sleep(Duration::from_secs(1)).await;
                }

                // === SALVAR NO BANCO ===

                let links_json = if !links_map.is_empty() {
                    serde_json::to_string(&links_map).ok()
                } else {
                    None
                };

                {
                    let conn = state.library_db.lock().unwrap();
                    let _ = conn.execute(
                        "INSERT OR REPLACE INTO game_details (
                            game_id, description_raw, description_ptbr, release_date, genres, tags,
                            developer, publisher, critic_score, background_image, series,
                            steam_review_label, steam_review_count, steam_review_score, steam_review_updated_at,
                            esrb_rating, is_adult, adult_tags, external_links, steam_app_id, median_playtime
                         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21)",
                        params![
                            game_id,
                            description_raw,
                            description_ptbr,
                            release_date,
                            genres_str,
                            tags_str,
                            developer,
                            publisher,
                            critic_score,
                            background,
                            series_name,
                            steam_review_label,
                            steam_review_count,
                            steam_review_score,
                            steam_review_updated_at,
                            esrb_rating,
                            is_adult,
                            adult_tags_json,
                            links_json,
                            target_steam_id,
                            None::<i32> // median_playtime será preenchido depois via SteamSpy
                        ],
                    );

                    if let Some(img) = &background {
                        let _ = conn.execute(
                            "UPDATE games SET cover_url = ?1 WHERE id = ?2 AND (cover_url IS NULL OR cover_url = '')",
                            params![img, game_id],
                        );
                    }
                }
            }
        }
        info!("Metadata update concluído.");
    });

    Ok(())
}

/// Busca capas faltantes via RAWG e atualiza o banco de dados.
///
/// Processa jogos em lotes assíncronos, emitindo progresso via eventos.
/// Continua até que todos os jogos sem capa sejam processados.
#[tauri::command]
pub async fn fetch_missing_covers(app: AppHandle) -> Result<(), String> {
    let app_handle = app.clone();
    let api_key = get_api_key(&app)?;

    if api_key.is_empty() {
        return Err("API Key RAWG necessária".to_string());
    }

    tauri::async_runtime::spawn(async move {
        info!("Iniciando busca de capas faltantes...");

        let mut total_updated = 0;
        let mut total_failed = 0;

        loop {
            let state: State<AppState> = app_handle.state();

            let games_without_cover = {
                let conn = state.library_db.lock().unwrap();
                query_basic_games_batch(
                    &conn,
                    "SELECT id, name FROM games WHERE cover_url IS NULL OR cover_url = '' LIMIT ?",
                    RAWG_REQUISITIONS_PER_BATCH,
                )
            };

            if games_without_cover.is_empty() {
                let summary = format!(
                    "Busca concluída! {} atualizadas, {} falharam",
                    total_updated, total_failed
                );
                let _ = app_handle.emit("enrich_complete", summary);
                break;
            }

            let batch_size = games_without_cover.len();

            for (index, (game_id, name)) in games_without_cover.into_iter().enumerate() {
                let _ = app_handle.emit(
                    "enrich_progress",
                    EnrichProgress {
                        current: (index + 1) as i32,
                        total_found: batch_size as i32,
                        last_game: format!("Capa: {}", name),
                        status: "running".to_string(),
                    },
                );

                match rawg::search_games(&api_key, &name).await {
                    Ok(results) => {
                        if let Some(img) = results.first().and_then(|g| g.background_image.as_ref())
                        {
                            let conn = state.library_db.lock().unwrap();
                            match conn.execute(
                                "UPDATE games SET cover_url = ?1 WHERE id = ?2",
                                params![img, game_id],
                            ) {
                                Ok(_) => {
                                    total_updated += 1;
                                    info!("Capa atualizada para: {}", name);
                                }
                                Err(e) => {
                                    total_failed += 1;
                                    warn!("Erro ao salvar capa de {}: {}", name, e);
                                }
                            }
                        } else {
                            total_failed += 1;
                            warn!("Nenhuma capa encontrada para: {}", name);
                        }
                    }
                    Err(e) => {
                        total_failed += 1;
                        warn!("Erro RAWG ao buscar {}: {}", name, e);
                    }
                }

                sleep(Duration::from_millis(RAWG_RATE_LIMIT_MS)).await;
            }
        }

        info!(
            "Busca de capas finalizada: {} sucesso, {} falhas",
            total_updated, total_failed
        );
    });

    Ok(())
}

// === PROXIES DO FRONTEND ===

#[tauri::command]
pub async fn fetch_game_details(
    app: AppHandle,
    query: String,
) -> Result<rawg::GameDetails, String> {
    let api_key = get_api_key(&app)?;
    rawg::fetch_game_details(&api_key, query).await
}

#[tauri::command]
pub async fn get_trending_games(app: AppHandle) -> Result<Vec<rawg::RawgGame>, String> {
    let api_key = get_api_key(&app)?;
    rawg::fetch_trending_games(&api_key).await
}

#[tauri::command]
pub async fn get_upcoming_games(app: AppHandle) -> Result<Vec<rawg::RawgGame>, String> {
    let api_key = get_api_key(&app)?;
    rawg::fetch_upcoming_games(&api_key).await
}
