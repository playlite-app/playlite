//! Módulo de integrações com APIs externas.
//!
//! Coordena a comunicação com serviços de terceiros (IGBD, Steam, RAWG) e
//! orquestra operações complexas como importação em lote, enriquecimento
//! automático de metadados busca e exibição de jogos em tendência.
//!
//! **Nota:** implementa delays entre requisições para respeitar limites das APIs.

use crate::constants::{self, RAWG_RATE_LIMIT_MS, RAWG_REQUISITIONS_PER_BATCH};
use crate::database::{self, AppState};
use crate::services::{rawg, steam};
use crate::utils::game_logic;
use chrono::{TimeZone, Utc};
use rusqlite::params;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::time::sleep;
use tracing::{error, info, warn};
use uuid::Uuid;

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

/// Importa toda a biblioteca de jogos Steam do usuário.
///
/// Conecta-se à API Steam para buscar a lista completa de jogos possuídos
/// e adiciona todos ao banco de dados local com informações básicas.
///
/// **Processo:**
/// 1. Busca jogos via Steam WEB API ('IPlayerService/GetOwnedGames')
/// 2. Monta URLs de capas usando CDN da Steam
/// 3. Converte playtime de minutos para horas
/// 4. Insere em lote usando transação SQL
/// 5. Usa 'INSERT OR IGNORE' para evitar duplicatas
///
/// **Nota:**
/// - Biblioteca privada retorna erro de autenticação
/// - Jogos gratuitos jogados são incluídos automaticamente
/// - Jogos gratuitos não jogados ou que foram desinstalados podem não são serem retornados pela API
/// - Tempo de jogo é arredondado para horas inteiras
/// - Esta operação não aplica rate limit por usar apenas uma chamada de API.
#[tauri::command]
pub async fn import_steam_library(
    state: State<'_, AppState>,
    api_key: String,
    steam_id: String,
) -> Result<String, String> {
    info!("Iniciando importação da Steam ID: {}", steam_id);

    let steam_games = steam::list_steam_games(&api_key, &steam_id).await?;
    if steam_games.is_empty() {
        return Ok("Nenhum jogo encontrado.".to_string());
    }

    let mut inserted = 0;
    let mut updated = 0;
    let now = Utc::now().to_rfc3339();

    let conn = state.library_db.lock().map_err(|_| "Mutex error")?;

    for game in steam_games {
        let exists: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM games WHERE platform = 'Steam' AND platform_id = ?1)",
                params![game.appid],
                |row| row.get(0),
            )
            .unwrap_or(false);

        let status = game_logic::calculate_status(game.playtime_forever);

        // Converte Unix Timestamp (Steam) para ISO 8601 (Banco)
        let last_played_iso = if game.rtime_last_played > 0 {
            Some(
                Utc.timestamp_opt(game.rtime_last_played, 0)
                    .unwrap()
                    .to_rfc3339(),
            )
        } else {
            None
        };

        if !exists {
            let new_id = Uuid::new_v4().to_string();
            let cover = format!(
                "{}/steam/apps/{}/library_600x900.jpg",
                constants::STEAM_CDN_URL,
                game.appid
            );

            conn.execute(
                "INSERT INTO games (
                    id, name, cover_url, platform, platform_id,
                    status, playtime, last_played, added_at, favorite, user_rating
                ) VALUES (?1, ?2, ?3, 'Steam', ?4, ?5, ?6, ?7, ?8, 0, NULL)",
                params![
                    new_id,
                    game.name,
                    cover,
                    game.appid,
                    status,
                    game.playtime_forever,
                    last_played_iso,
                    now
                ],
            )
            .ok();
            inserted += 1;
        } else {
            conn.execute(
                "UPDATE games SET
                    playtime = ?1,
                    status = ?2,
                    last_played = COALESCE(?3, last_played)
                 WHERE platform = 'Steam' AND platform_id = ?4",
                params![game.playtime_forever, status, last_played_iso, game.appid],
            )
            .ok();
            updated += 1;
        }
    }

    Ok(format!(
        "Sincronização concluída: {} novos, {} atualizados.",
        inserted, updated
    ))
}

fn get_api_key(app_handle: &tauri::AppHandle) -> Result<String, String> {
    database::get_secret(app_handle, "rawg_api_key")
}

// Struct para o evento de progresso
#[derive(serde::Serialize, Clone)]
struct EnrichProgress {
    current: i32,
    total_found: i32, // Total neste lote ou total pendente
    last_game: String,
    status: String, // "running", "completed", "error"
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
    // Clona o handle para usar dentro da thread
    let app_handle = app.clone();

    // Obtém API Key antes de spawnar a thread (falha rápido se não tiver)
    let api_key = database::get_secret(&app, "rawg_api_key")?;
    if api_key.is_empty() {
        return Err("API Key da RAWG não configurada.".to_string());
    }

    // Spawna a tarefa assíncrona que vai rodar "para sempre" até acabar os jogos
    tauri::async_runtime::spawn(async move {
        info!("Task de enriquecimento iniciada em background...");

        loop {
            // 1. Obter estado do banco dentro do loop (pois o lock deve ser breve)
            let state: State<AppState> = app_handle.state();

            // Busca próximo lote de jogos sem detalhes
            let games_to_update = {
                let conn = match state.library_db.lock() {
                    Ok(c) => c,
                    Err(_) => break, // Sai se houver erro grave no mutex
                };

                let mut stmt = conn
                    .prepare(
                        "SELECT g.id, g.name
                     FROM games g
                     LEFT JOIN game_details gd ON g.id = gd.game_id
                     WHERE gd.game_id IS NULL
                     LIMIT ?",
                    )
                    .unwrap();

                let rows = stmt
                    .query_map(params![RAWG_REQUISITIONS_PER_BATCH], |row| {
                        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
                    })
                    .unwrap();

                let mut list = Vec::new();
                for r in rows {
                    if let Ok(item) = r {
                        list.push(item);
                    }
                }
                list
            };

            if games_to_update.is_empty() {
                info!("Nenhum jogo pendente. Finalizando task.");
                let _ = app_handle.emit("enrich_complete", "Todos os jogos atualizados!");
                break;
            }

            let total_in_batch = games_to_update.len();

            // 2. Processar o lote
            for (index, (game_id, name)) in games_to_update.into_iter().enumerate() {
                // Notifica Frontend do progresso
                let _ = app_handle.emit(
                    "enrich_progress",
                    EnrichProgress {
                        current: (index + 1) as i32,
                        total_found: total_in_batch as i32,
                        last_game: name.clone(),
                        status: "running".to_string(),
                    },
                );

                // Lógica de Busca Inteligente (RAWG)
                let search_result = rawg::search_games(&api_key, &name).await;

                // Variável para guardar sucesso/falha do banco
                let mut db_success = false;

                if let Ok(results) = search_result {
                    if let Some(best_match) = results.first() {
                        if let Ok(details) =
                            rawg::fetch_game_details(&api_key, best_match.id.to_string()).await
                        {
                            let conn = state.library_db.lock().unwrap();
                            // ... Prepara dados ...
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

                            let _ = conn.execute(
                                "INSERT INTO game_details (
                                    game_id, description, release_date, genres,
                                    developer, publisher, critic_score, website_url, background_image
                                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                                params![game_id, desc, details.released, genres, dev, publ, details.metacritic, website, bg],
                            );
                            db_success = true;
                        }
                    }
                }

                // Se falhou tudo (não achou na RAWG), insere registro vazio para não tentar de novo no próximo loop
                if !db_success {
                    let conn = state.library_db.lock().unwrap();
                    let _ = conn.execute(
                        "INSERT INTO game_details (game_id, description) VALUES (?1, 'Metadados não encontrados')",
                        params![game_id],
                    );
                    warn!("Marcando '{}' como não encontrado para evitar loop.", name);
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
/// Esses dados podem ser usados como alternativa à IGBD.
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
