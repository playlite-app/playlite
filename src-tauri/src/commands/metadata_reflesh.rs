//! Módulo de refresh seletivo de metadados
//!
//! Responsável por atualizar dados que mudam com frequência (reviews, preços)
//! sem re-processar metadados completos. Complementa metadata_enrichment.rs.
//!
//! Design principles:
//! - Foco em atualizações incrementais e periódicas
//! - Reutiliza cache e funções existentes
//! - Não duplica lógica de enriquecimento inicial
//! - Operações assíncronas em background

use crate::database::AppState;
use crate::services::{itad, metadata_cache, steam};
use rusqlite::params;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::time::sleep;
use tracing::{info, warn};

// === ESTRUTURAS DE PROGRESSO ===

#[derive(serde::Serialize, Clone)]
struct RefreshProgress {
    current: i32,
    total: i32,
    item_name: String,
    refresh_type: String, // "reviews" | "prices"
}

// === REFRESH DE REVIEWS STEAM ===

/// Busca reviews Steam atualizados (reutiliza cache)
async fn fetch_fresh_steam_reviews(
    steam_id: &str,
    cache_conn: &rusqlite::Connection,
) -> Option<steam::SteamReviewSummary> {
    // Invalida cache antigo para forçar nova busca
    let cache_key = format!("reviews_{}", steam_id);
    let _ = metadata_cache::invalidate_cache(cache_conn, "steam", &cache_key);

    // Busca novos dados (que serão salvos no cache automaticamente)
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

/// Atualiza apenas os reviews Steam de jogos que precisam
///
/// Critério: reviews com mais de 7 dias ou nunca atualizados
#[tauri::command]
pub async fn refresh_steam_reviews(app: AppHandle) -> Result<String, String> {
    let app_handle = app.clone();

    tauri::async_runtime::spawn(async move {
        info!("Iniciando refresh seletivo de Steam reviews...");

        let state: State<AppState> = app_handle.state();
        let mut updated_count = 0;
        let mut failed_count = 0;

        // 1. Busca jogos que precisam atualizar reviews
        let games_to_update: Vec<(String, String, String)> = {
            let conn = state.library_db.lock().unwrap();
            let mut stmt = conn
                .prepare(
                    "SELECT gd.game_id, gd.steam_app_id, g.name
                     FROM game_details gd
                     JOIN games g ON g.id = gd.game_id
                     WHERE gd.steam_app_id IS NOT NULL
                       AND (
                         gd.steam_review_updated_at IS NULL
                         OR julianday('now') - julianday(gd.steam_review_updated_at) > 7
                       )
                     ORDER BY g.last_played DESC NULLS LAST",
                )
                .unwrap();

            stmt.query_map([], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)))
                .unwrap()
                .flatten()
                .collect()
        };

        let total = games_to_update.len();
        info!("Encontrados {} jogos para atualizar reviews", total);

        if total == 0 {
            let _ = app_handle.emit(
                "reviews_refresh_complete",
                "Nenhum review precisa atualizar",
            );
            return;
        }

        // 2. Atualiza reviews de cada jogo
        for (index, (game_id, steam_id, name)) in games_to_update.into_iter().enumerate() {
            // Emite progresso
            let _ = app_handle.emit(
                "refresh_progress",
                RefreshProgress {
                    current: (index + 1) as i32,
                    total: total as i32,
                    item_name: name.clone(),
                    refresh_type: "reviews".to_string(),
                },
            );

            info!("Atualizando reviews: {} (Steam ID: {})", name, steam_id);

            // Busca reviews atualizados
            let reviews_data = {
                let cache_conn = state.metadata_db.lock().unwrap();
                tokio::task::block_in_place(|| {
                    let rt = tokio::runtime::Handle::current();
                    rt.block_on(async { fetch_fresh_steam_reviews(&steam_id, &cache_conn).await })
                })
            };

            match reviews_data {
                Some(reviews) => {
                    let total_reviews = reviews.total_positive + reviews.total_negative;
                    let score = if total_reviews > 0 {
                        Some((reviews.total_positive as f32 / total_reviews as f32) * 100.0)
                    } else {
                        None
                    };

                    // Atualiza apenas campos de review
                    let conn = state.library_db.lock().unwrap();
                    match conn.execute(
                        "UPDATE game_details SET
                            steam_review_label = ?1,
                            steam_review_count = ?2,
                            steam_review_score = ?3,
                            steam_review_updated_at = ?4
                         WHERE game_id = ?5",
                        params![
                            reviews.review_score_desc,
                            reviews.total_reviews as i32,
                            score,
                            chrono::Utc::now().to_rfc3339(),
                            game_id
                        ],
                    ) {
                        Ok(_) => {
                            updated_count += 1;
                            info!(
                                "Reviews atualizados: {} - {} ({:.1}%)",
                                name,
                                reviews.review_score_desc,
                                score.unwrap_or(0.0)
                            );
                        }
                        Err(e) => {
                            failed_count += 1;
                            warn!("Erro ao salvar reviews para {}: {}", name, e);
                        }
                    }
                }
                None => {
                    failed_count += 1;
                    warn!("Falha ao buscar reviews para {}", name);
                }
            }

            // Rate limit (1 req/sec para Steam)
            sleep(Duration::from_millis(1000)).await;
        }

        let summary = format!(
            "{} reviews atualizados | {} falhas",
            updated_count, failed_count
        );

        info!("🏁 Refresh de reviews concluído: {}", summary);
        let _ = app_handle.emit("reviews_refresh_complete", summary.clone());
    });

    Ok("Atualização de reviews iniciada em background".to_string())
}

// === REFRESH DE PREÇOS WISHLIST ===

/// Atualiza preços da wishlist de forma automática
///
/// Critério: jogos com preços desatualizados há mais de 3 dias
#[tauri::command]
pub async fn auto_refresh_wishlist_prices(app: AppHandle) -> Result<String, String> {
    let app_handle = app.clone();

    tauri::async_runtime::spawn(async move {
        info!("Iniciando auto-refresh de preços da wishlist...");

        let state: State<AppState> = app_handle.state();

        // 1. Busca jogos que precisam atualizar
        let games_to_update: Vec<(String, String, Option<String>)> = {
            let conn = state.library_db.lock().unwrap();
            let mut stmt = conn
                .prepare(
                    "SELECT id, name, itad_id
                     FROM wishlist
                     WHERE itad_id IS NOT NULL
                       AND itad_id != ''
                       AND (
                         added_at IS NULL
                         OR julianday('now') - julianday(added_at) > 3
                       )
                     ORDER BY added_at ASC NULLS FIRST",
                )
                .unwrap();

            stmt.query_map([], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)))
                .unwrap()
                .flatten()
                .collect()
        };

        let total = games_to_update.len();

        if total == 0 {
            info!("Nenhum jogo da wishlist precisa atualizar preços");
            let _ = app_handle.emit(
                "wishlist_refresh_complete",
                "Nenhum preço precisa atualizar",
            );
            return;
        }

        info!("{} jogos da wishlist precisam atualizar preços", total);

        // 2. Coleta IDs para buscar em batch
        let mut game_map = std::collections::HashMap::new();
        let mut itad_ids = Vec::new();

        for (local_id, name, itad_id) in games_to_update {
            if let Some(id) = itad_id {
                itad_ids.push(id.clone());
                game_map.insert(id, (local_id, name));
            }
        }

        // 3. Busca preços na ITAD
        let overviews = match itad::get_prices(itad_ids).await {
            Ok(data) => data,
            Err(e) => {
                warn!("Erro ao buscar preços na ITAD: {}", e);
                let _ = app_handle.emit("wishlist_refresh_complete", format!("Erro: {}", e));
                return;
            }
        };

        info!("Recebidos {} resultados de preços da ITAD", overviews.len());

        let mut updated_count = 0;
        let mut failed_count = 0;

        // 4. Atualiza apenas os preços
        for (index, game_data) in overviews.iter().enumerate() {
            if let Some((local_id, name)) = game_map.get(&game_data.id) {
                // Emite progresso
                let _ = app_handle.emit(
                    "refresh_progress",
                    RefreshProgress {
                        current: (index + 1) as i32,
                        total: overviews.len() as i32,
                        item_name: name.clone(),
                        refresh_type: "prices".to_string(),
                    },
                );

                if let Some(deal) = &game_data.current {
                    let lowest = game_data
                        .lowest
                        .as_ref()
                        .map(|l| l.price)
                        .unwrap_or(deal.price);
                    let cut = deal.cut.unwrap_or(0) as f64;
                    let normal_price = if cut > 0.0 {
                        deal.price / (1.0 - (cut / 100.0))
                    } else {
                        deal.price
                    };

                    // Adquire lock apenas quando necessário
                    let conn = state.library_db.lock().unwrap();
                    match conn.execute(
                        "UPDATE wishlist SET
                            current_price = ?1,
                            currency = ?2,
                            lowest_price = ?3,
                            store_platform = ?4,
                            store_url = ?5,
                            on_sale = ?6,
                            normal_price = ?7,
                            voucher = ?8,
                            added_at = CURRENT_TIMESTAMP
                         WHERE id = ?9",
                        params![
                            deal.price,
                            deal.currency,
                            lowest,
                            deal.shop.name,
                            deal.url,
                            deal.cut > Some(0),
                            normal_price,
                            deal.voucher,
                            local_id
                        ],
                    ) {
                        Ok(_) => {
                            updated_count += 1;
                            info!(
                                "Preço atualizado: {} - {} {}",
                                name, deal.currency, deal.price
                            );
                        }
                        Err(e) => {
                            failed_count += 1;
                            warn!("Erro ao atualizar preço de {}: {}", name, e);
                        }
                    }
                    // Lock é liberado automaticamente aqui
                } else {
                    warn!("Nenhuma oferta atual disponível para: {}", name);
                }
            }
        }

        let summary = format!(
            "{} preços atualizados | {} falhas",
            updated_count, failed_count
        );

        info!("Auto-refresh de preços concluído: {}", summary);
        let _ = app_handle.emit("wishlist_refresh_complete", summary.clone());
    });

    Ok("Atualização de preços iniciada em background".to_string())
}

// === REFRESH MANUAL FORÇADO ===

/// Força refresh de reviews de um jogo específico
///
/// Útil quando usuário quer atualizar manualmente
#[tauri::command]
pub async fn force_refresh_game_reviews(
    app: AppHandle,
    state: State<'_, AppState>,
    game_id: String,
) -> Result<String, String> {
    info!("Forçando refresh de reviews para game_id: {}", game_id);

    // 1. Busca Steam ID do jogo
    let (steam_id, name): (String, String) = {
        let conn = state.library_db.lock().unwrap();
        conn.query_row(
            "SELECT gd.steam_app_id, g.name
             FROM game_details gd
             JOIN games g ON g.id = gd.game_id
             WHERE gd.game_id = ?1 AND gd.steam_app_id IS NOT NULL",
            params![game_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|e| format!("Jogo não encontrado ou sem Steam ID: {}", e))?
    };

    // 2. Busca reviews atualizados
    let reviews = {
        let cache_conn = state.metadata_db.lock().unwrap();
        tokio::task::block_in_place(|| {
            let rt = tokio::runtime::Handle::current();
            rt.block_on(async { fetch_fresh_steam_reviews(&steam_id, &cache_conn).await })
        })
    }
    .ok_or_else(|| "Falha ao buscar reviews da Steam".to_string())?;

    // 3. Atualiza no banco
    let total_reviews = reviews.total_positive + reviews.total_negative;
    let score = if total_reviews > 0 {
        Some((reviews.total_positive as f32 / total_reviews as f32) * 100.0)
    } else {
        None
    };

    let conn = state.library_db.lock().unwrap();
    conn.execute(
        "UPDATE game_details SET
            steam_review_label = ?1,
            steam_review_count = ?2,
            steam_review_score = ?3,
            steam_review_updated_at = ?4
         WHERE game_id = ?5",
        params![
            reviews.review_score_desc,
            reviews.total_reviews as i32,
            score,
            chrono::Utc::now().to_rfc3339(),
            game_id
        ],
    )
    .map_err(|e| format!("Erro ao salvar reviews: {}", e))?;

    let summary = format!(
        "Reviews atualizados: {} - {} ({:.1}%)",
        name,
        reviews.review_score_desc,
        score.unwrap_or(0.0)
    );

    info!("{}", summary);
    let _ = app.emit("game_reviews_updated", game_id);

    Ok(summary)
}

/// Força refresh de preço de um jogo específico da wishlist
#[tauri::command]
pub async fn force_refresh_wishlist_price(
    app: AppHandle,
    state: State<'_, AppState>,
    wishlist_id: String,
) -> Result<String, String> {
    info!(
        "Forçando refresh de preço para wishlist_id: {}",
        wishlist_id
    );

    // 1. Busca ITAD ID do jogo
    let (itad_id, name): (String, String) = {
        let conn = state.library_db.lock().unwrap();
        conn.query_row(
            "SELECT itad_id, name FROM wishlist WHERE id = ?1 AND itad_id IS NOT NULL",
            params![wishlist_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|e| format!("Jogo não encontrado na wishlist ou sem ITAD ID: {}", e))?
    };

    // 2. Busca preço atualizado
    let overviews = itad::get_prices(vec![itad_id.clone()]).await?;

    let game_data = overviews
        .first()
        .ok_or_else(|| "Nenhum dado de preço retornado pela ITAD".to_string())?;

    let deal = game_data
        .current
        .as_ref()
        .ok_or_else(|| "Nenhuma oferta atual disponível".to_string())?;

    // 3. Atualiza no banco
    let lowest = game_data
        .lowest
        .as_ref()
        .map(|l| l.price)
        .unwrap_or(deal.price);
    let cut = deal.cut.unwrap_or(0) as f64;
    let normal_price = if cut > 0.0 {
        deal.price / (1.0 - (cut / 100.0))
    } else {
        deal.price
    };

    let conn = state.library_db.lock().unwrap();
    conn.execute(
        "UPDATE wishlist SET
            current_price = ?1,
            currency = ?2,
            lowest_price = ?3,
            store_platform = ?4,
            store_url = ?5,
            on_sale = ?6,
            normal_price = ?7,
            voucher = ?8,
            added_at = CURRENT_TIMESTAMP
         WHERE id = ?9",
        params![
            deal.price,
            deal.currency,
            lowest,
            deal.shop.name,
            deal.url,
            deal.cut > Some(0),
            normal_price,
            deal.voucher,
            wishlist_id
        ],
    )
    .map_err(|e| format!("Erro ao salvar preço: {}", e))?;

    let summary = format!(
        "Preço atualizado: {} - {} {} {}",
        name,
        deal.currency,
        deal.price,
        if deal.cut > Some(0) {
            format!("(-{}%)", deal.cut.unwrap())
        } else {
            String::new()
        }
    );

    info!("{}", summary);
    let _ = app.emit("wishlist_price_updated", wishlist_id);

    Ok(summary)
}
