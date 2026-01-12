//! Módulo de integrações com APIs externas.
//!
//! Coordena a comunicação com serviços de terceiros (IGBD, RAWG, HLTB) e
//! orquestra operações complexas como importação em lote, enriquecimento
//! automático de metadados, busca e exibição de jogos em tendência.
//!
//! **Nota:** implementa delays entre requisições para respeitar limites das APIs.

use crate::constants::{RAWG_RATE_LIMIT_MS, RAWG_REQUISITIONS_PER_BATCH};
use crate::database::{self, AppState};
use crate::services::rawg;
use rusqlite::params;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::time::sleep;
use tracing::{info, warn};

/// Resumo de uma operação de importação/processamento em lote.
///
/// Fornece estatísticas detalhadas e lista de erros para ‘feedback’ ao usuário.
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

// Struct para o evento de progresso
#[derive(serde::Serialize, Clone)]
struct EnrichProgress {
    current: i32,
    total_found: i32, // Total neste lote ou total pendente
    last_game: String,
    status: String, // "running", "completed", "error"
}

fn get_api_key(app_handle: &AppHandle) -> Result<String, String> {
    database::get_secret(app_handle, "rawg_api_key")
}

/// Função auxiliar que executa uma query SQL e retorna uma lista de tuplas (id, name).
///
/// Usada para buscar jogos que precisam de metadados ou capas faltantes.
fn query_games_batch(
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

    let mut list = Vec::new();
    for r in rows {
        if let Ok(i) = r {
            list.push(i);
        }
    }
    list
}

/// Busca metadados para os jogos da biblioteca via RAWG.
///
/// Busca detalhes adicionais para jogos que ainda não possuem
/// entradas na tabela 'game_details', usando RAWG como fonte.
///
/// **Nota:**
/// - Limitado a 20 jogos por execução para evitar timeout do frontend.
/// - Inicia o processo de enriquecimento em SEGUNDO PLANO via Task.
/// - Retorna imediatamente para não travar a UI.
#[tauri::command]
pub async fn enrich_library(app: AppHandle) -> Result<(), String> {
    let app_handle = app.clone();
    let api_key = get_api_key(&app)?;
    if api_key.is_empty() {
        return Err("API Key da RAWG não configurada.".to_string());
    }

    tauri::async_runtime::spawn(async move {
        info!("Task de enriquecimento iniciada...");
        loop {
            let state: State<AppState> = app_handle.state();
            let games_to_update = {
                let conn = match state.library_db.lock() {
                    Ok(c) => c,
                    Err(_) => break,
                };
                query_games_batch(
                    &conn,
                    "SELECT g.id, g.name FROM games g LEFT JOIN game_details gd ON g.id = gd.game_id WHERE gd.game_id IS NULL LIMIT ?",
                    RAWG_REQUISITIONS_PER_BATCH,
                )
            };

            if games_to_update.is_empty() {
                let _ = app_handle.emit("enrich_complete", "Todos os jogos atualizados!");
                break;
            }

            let total_in_batch = games_to_update.len();

            for (index, (game_id, name)) in games_to_update.into_iter().enumerate() {
                let _ = app_handle.emit(
                    "enrich_progress",
                    EnrichProgress {
                        current: (index + 1) as i32,
                        total_found: total_in_batch as i32,
                        last_game: name.clone(),
                        status: "running".to_string(),
                    },
                );

                let search_result = rawg::search_games(&api_key, &name).await;
                let mut db_success = false;

                if let Ok(results) = search_result {
                    if let Some(best_match) = results.first() {
                        if let Ok(details) =
                            rawg::fetch_game_details(&api_key, best_match.id.to_string()).await
                        {
                            let conn = state.library_db.lock().unwrap();
                            let desc = details.description_raw.unwrap_or_default();
                            let website = details.website.unwrap_or_default();
                            let bg = details
                                .background_image
                                .or(best_match.background_image.clone());
                            let genres = details
                                .genres
                                .iter()
                                .map(|g| g.name.clone())
                                .collect::<Vec<_>>()
                                .join(", ");
                            let dev = details.developers.first().map(|d| d.name.clone());
                            let publ = details.publishers.first().map(|p| p.name.clone());
                            let tags = details
                                .tags
                                .iter()
                                .take(10)
                                .map(|t| t.name.clone())
                                .collect::<Vec<_>>()
                                .join(", ");

                            let _ = conn.execute(
                                "INSERT INTO game_details (
                                    game_id, description, release_date, genres, tags,
                                    developer, publisher, critic_score, website_url,
                                    background_image, rawg_url
                                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
                                params![
                                    game_id,
                                    desc,
                                    details.released,
                                    genres,
                                    tags,
                                    dev,
                                    publ,
                                    details.metacritic,
                                    website,
                                    bg,
                                    format!("https://rawg.io/games/{}", best_match.id)
                                ],
                            );

                            if let Some(img) = &bg {
                                let _ = conn.execute(
                                    "UPDATE games SET cover_url = ?1 WHERE id = ?2 AND (cover_url IS NULL OR cover_url = '')",
                                    params![img, game_id],
                                );
                            }

                            db_success = true;
                        }
                    }
                }

                if !db_success {
                    let conn = state.library_db.lock().unwrap();
                    let _ = conn.execute("INSERT INTO game_details (game_id, description) VALUES (?1, 'Metadados não encontrados')", params![game_id]);
                }
                sleep(Duration::from_millis(RAWG_RATE_LIMIT_MS)).await;
            }
        }
        info!("Task concluída.");
    });

    Ok(())
}

/// Busca capas faltantes para jogos na biblioteca.
///
/// Busca capas para jogos que não possuem capa (cover_url NULL ou vazia), usando RAWG como fonte.
#[tauri::command]
pub async fn fetch_missing_covers(app: AppHandle) -> Result<(), String> {
    let app_handle = app.clone();
    let api_key = get_api_key(&app)?;
    if api_key.is_empty() {
        return Err("API Key da RAWG não configurada.".to_string());
    }

    tauri::async_runtime::spawn(async move {
        info!("Iniciando busca de capas faltantes...");

        loop {
            let state: State<AppState> = app_handle.state();

            let games_without_cover = {
                let conn = match state.library_db.lock() {
                    Ok(c) => c,
                    Err(_) => break,
                };
                query_games_batch(
                    &conn,
                    "SELECT id, name FROM games WHERE cover_url IS NULL OR cover_url = '' LIMIT ?",
                    RAWG_REQUISITIONS_PER_BATCH,
                )
            };

            if games_without_cover.is_empty() {
                let _ = app_handle.emit("enrich_complete", "Busca de capas finalizada!");
                break;
            }

            let total = games_without_cover.len();

            for (index, (game_id, name)) in games_without_cover.into_iter().enumerate() {
                // Emite evento para atualizar a UI (reusa o mesmo evento de progresso)
                let _ = app_handle.emit(
                    "enrich_progress",
                    EnrichProgress {
                        current: (index + 1) as i32,
                        total_found: total as i32,
                        last_game: format!("Capa: {}", name),
                        status: "running".to_string(),
                    },
                );

                // Busca simples na RAWG para pegar a primeira imagem
                match rawg::search_games(&api_key, &name).await {
                    Ok(results) => {
                        if let Some(best_match) = results.first() {
                            if let Some(img) = &best_match.background_image {
                                let conn = state.library_db.lock().unwrap();
                                let _ = conn.execute(
                                    "UPDATE games SET cover_url = ?1 WHERE id = ?2",
                                    params![img, game_id],
                                );
                                info!("Capa encontrada para '{}'", name);
                            }
                        }
                    }
                    Err(e) => warn!("Erro buscando capa para {}: {}", name, e),
                }

                sleep(Duration::from_millis(RAWG_RATE_LIMIT_MS)).await;
            }
        }
    });

    Ok(())
}

/// Busca detalhes completos de um jogo específico na RAWG.
///
/// Retorna informações expandidas incluindo descrição, desenvolvedoras,
/// publicadoras, tags, metacritic score e mais, usados no modal de detalhes.
#[tauri::command]
pub async fn fetch_game_details(
    app_handle: AppHandle,
    query: String,
) -> Result<rawg::GameDetails, String> {
    let api_key = get_api_key(&app_handle)?;

    if api_key.is_empty() {
        return Err("API Key da RAWG não configurada.".to_string());
    }

    rawg::fetch_game_details(&api_key, query).await
}

/// Busca jogos em tendência/populares do momento.
///
/// Retorna lista de jogos mais adicionados recentemente à plataforma RAWG,
/// indicando popularidade atual exibidos nas páginas Início e Em Alta.
#[tauri::command]
pub async fn get_trending_games(app_handle: AppHandle) -> Result<Vec<rawg::RawgGame>, String> {
    let api_key = get_api_key(&app_handle)?;
    rawg::fetch_trending_games(&api_key).await
}

/// Busca jogos com lançamento futuro.
///
/// Retorna lista de jogos mais aguardados que serão lançados até o final do próximo ano.
#[tauri::command]
pub async fn get_upcoming_games(app_handle: AppHandle) -> Result<Vec<rawg::RawgGame>, String> {
    let api_key = get_api_key(&app_handle)?;
    rawg::fetch_upcoming_games(&api_key).await
}
