//! Módulo de integrações com APIs externas.
//!
//! Coordena a comunicação com serviços de terceiros (Steam, RAWG) e
//! orquestra operações complexas como importação em lote, enriquecimento
//! automático de metadados busca e exibição de jogos em tendência.
//!
//! # Rate Limiting
//! Implementa delays entre requisições para respeitar limites das APIs.

use crate::constants;
use crate::constants::STEAM_RATE_LIMIT_MS;
use crate::database;
use crate::database::AppState;
use crate::services::{rawg, steam};
use rusqlite::params;
use std::time::Duration;
use tauri::{AppHandle, State};
use tokio::time::sleep;
use tracing::{error, info};

/// Resumo de uma operação de importação/processamento em lote.
///
/// Fornece estatísticas detalhadas e lista de erros para feedback ao usuário.
#[derive(serde::Serialize)]
pub struct ImportSummary {
    pub success_count: i32,
    pub error_count: i32,
    pub total_processed: i32,
    pub message: String,
    pub errors: Vec<String>,
}

/// Importa toda a biblioteca de jogos Steam do usuário.
///
/// Conecta-se à API Steam para buscar a lista completa de jogos possuídos
/// e adiciona todos ao banco de dados local com informações básicas.
///
/// # Processo
/// 1. Busca jogos via Steam Web API (`IPlayerService/GetOwnedGames`)
/// 2. Monta URLs de capas usando CDN da Steam
/// 3. Converte playtime de minutos para horas
/// 4. Insere em lote usando transação SQL
/// 5. Usa `INSERT OR IGNORE` para evitar duplicatas
///
/// # Retorna
/// * `Ok(String)` - Mensagem de sucesso com contador de jogos adicionados
/// * `Err(String)` - Erro na API Steam, banco ou autenticação
///
/// # Comportamento
/// - **Duplicatas**: Jogos já existentes são ignorados silenciosamente
/// - **Gêneros**: Todos iniciam como "Desconhecido" (usar `enrich_library` depois)
/// - **Plataforma**: Definida como "Steam"
/// - **Transação**: Rollback automático em caso de erro
///
/// # Exemplo de Uso
/// ```typescript,ignore
/// // Chamado via Tauri invoke
/// let result = await invoke('import_steam_library', {
///     apiKey: 'XXXXXXXXXXXXXXXXXXXXXXX',
///     steamId: '765999999999999'
/// });
/// // Retorna: "Importação concluída! 150 novos jogos adicionados."
/// ```
///
/// # Nota
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
    let steam_games = steam::list_steam_games(&api_key, &steam_id).await?;

    if steam_games.is_empty() {
        return Ok("Nenhum jogo encontrado na sua biblioteca Steam.".to_string());
    }

    println!("{} jogos encontrados na Steam", steam_games.len());

    let mut games_to_insert = Vec::new();

    for game in steam_games {
        let cover_url = format!(
            "{}/steam/apps/{}/library_600x900.jpg",
            constants::STEAM_CDN_URL,
            game.appid
        );

        let playtime_hours = (game.playtime_forever as f32 / 60.0).round() as i32;

        games_to_insert.push((
            game.appid.to_string(),
            game.name.clone(),
            constants::DEFAULT_GENRE.to_string(),
            constants::DEFAULT_PLATFORM_STEAM.to_string(),
            cover_url,
            playtime_hours,
        ));
    }

    let count = {
        let conn = state
            .library_db
            .lock()
            .map_err(|_| "Falha ao bloquear mutex")?;

        // Inicia transação
        conn.execute("BEGIN TRANSACTION", [])
            .map_err(|e| format!("Erro ao iniciar transação: {}", e))?;

        let mut inserted = 0;
        let mut skipped = 0;

        for (id, name, genre, platform, cover_url, playtime) in games_to_insert {
            match conn.execute(
                "INSERT OR IGNORE INTO games (id, name, genre, platform, cover_url, playtime, rating)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![id, name, genre, platform, cover_url, playtime, None::<i32>],
            ) {
                Ok(rows) => {
                    if rows > 0 {
                        inserted += rows;
                    } else {
                        skipped += 1;
                    }
                }
                Err(e) => {
                    eprintln!("[WARN] Erro ao inserir jogo '{}': {}", name, e);
                }
            }
        }

        conn.execute("COMMIT", []).map_err(|e| {
            let _ = conn.execute("ROLLBACK", []);
            format!("Erro ao commitar transação: {}", e)
        })?;

        println!(
            "Import completado: {} inseridos, {} já existiam",
            inserted, skipped
        );

        inserted
    };

    Ok(format!(
        "Importação concluída! {} novos jogos adicionados.",
        count
    ))
}

/// Enriquece biblioteca com metadados detalhados da Steam Store API.
///
/// Busca e atualiza informações faltantes (principalmente gêneros) para
/// jogos importados da Steam que ainda têm dados padrão.
///
/// # Processo
/// 1. Identifica jogos com metadados pendentes (gênero "Desconhecido")
/// 2. Para cada jogo, consulta Steam Store API
/// 3. Extrai gênero e outros metadados
/// 4. Atualiza banco em lote ao final
/// 5. Aplica rate limiting entre requisições
///
/// # Retorna
/// * `Ok(ImportSummary)` - Estatísticas completas do processamento
/// * `Err(String)` - Erro crítico de banco ou sistema
///
/// # Exemplo de Uso
/// ```typescript,ignore
/// // Chamado via Tauri invoke (operação longa)
/// const summary = await invoke('enrich_library');
/// console.log(`${summary.success_count} jogos atualizados`);
/// console.log(`${summary.error_count} falhas`);
/// summary.errors.forEach(err => console.warn(err));
/// ```
///
/// # Nota
/// - Devido ao rate limiting (500ms) obrigatório, a operação é naturalmente lenta.
/// - Erros individuais não interrompem o processo. São coletados e reportados no resumo.
/// - Atualiza os dados numa única transação ao final para garantir atomicidade e melhor performance.
#[tauri::command]
pub async fn enrich_library(state: State<'_, AppState>) -> Result<ImportSummary, String> {
    info!("Iniciando processo de enriquecimento de biblioteca...");

    let games_to_update = {
        let conn = state.library_db.lock().map_err(|_| "Mutex error")?;
        let mut stmt = conn
            .prepare("SELECT id, name FROM games WHERE genre = ?1 AND platform = ?2")
            .map_err(|e| e.to_string())?;

        let mut rows = stmt
            .query([constants::DEFAULT_GENRE, constants::DEFAULT_PLATFORM_STEAM])
            .map_err(|e| e.to_string())?;

        let mut games = Vec::new();
        while let Some(row) = rows.next().map_err(|e| e.to_string())? {
            let id: String = row.get(0).map_err(|e| e.to_string())?;
            let name: String = row.get(1).map_err(|e| e.to_string())?;
            games.push((id, name));
        }
        games
    };

    let total = games_to_update.len();
    if total == 0 {
        return Ok(ImportSummary {
            success_count: 0,
            error_count: 0,
            total_processed: 0,
            message: "Todos os jogos já estão atualizados.".to_string(),
            errors: vec![],
        });
    }

    info!("Encontrados {} jogos com metadados pendentes.", total);

    let mut batch_updates: Vec<(String, String)> = Vec::new();
    let mut success_count = 0;
    let mut failed_games = Vec::new();

    // Loop de processamento
    for (i, (id_str, name)) in games_to_update.iter().enumerate() {
        if let Ok(app_id) = id_str.parse::<u32>() {
            match steam::fetch_game_metadata(app_id).await {
                Ok(metadata) => {
                    batch_updates.push((id_str.clone(), metadata.genre.clone()));
                    // Log menos verboso no console, detalhado no arquivo
                    info!(
                        "Metadata OK ({}/{}): {} -> {}",
                        i + 1,
                        total,
                        name,
                        metadata.genre
                    );
                    success_count += 1;
                }
                Err(e) => {
                    error!(
                        "Falha metadata ({}/{}): {} - Erro: {}",
                        i + 1,
                        total,
                        name,
                        e
                    );
                    failed_games.push(format!("{} ({})", name, e));
                }
            }

            sleep(Duration::from_millis(STEAM_RATE_LIMIT_MS)).await;
        }
    }

    // Salvar no Banco
    if !batch_updates.is_empty() {
        let conn = state
            .library_db
            .lock()
            .map_err(|_| "Mutex error ao salvar")?;
        conn.execute("BEGIN TRANSACTION", [])
            .map_err(|e| e.to_string())?;

        for (id, genre) in batch_updates {
            let _ = conn.execute(
                "UPDATE games SET genre = ?1 WHERE id = ?2",
                rusqlite::params![genre, id],
            );
        }

        conn.execute("COMMIT", []).map_err(|e| e.to_string())?;
        info!(
            "Processamento concluído: {} sucessos e {} falhas.",
            success_count,
            failed_games.len()
        );
    }

    let summary = ImportSummary {
        success_count,
        error_count: failed_games.len() as i32,
        total_processed: total as i32,
        message: format!(
            "Processamento concluído: {} sucessos e {} falhas.",
            success_count,
            failed_games.len()
        ),
        errors: failed_games,
    };

    Ok(summary)
}

fn get_api_key(app_handle: &tauri::AppHandle) -> Result<String, String> {
    database::get_secret(app_handle, "rawg_api_key")
}

/// Busca detalhes completos de um jogo específico na RAWG.
///
/// Retorna informações expandidas incluindo descrição, desenvolvedoras,
/// publicadoras, tags, metacritic score e mais, usados no modal de detalhes.
///
/// # Retorna
/// * `Ok(GameDetails)` - Detalhes completos do jogo
/// * `Err(String)` - API key não configurada ou jogo não encontrado
///
/// # Validação
/// Verifica se a API Key da RAWG está configurada antes de fazer requisição.
///
/// # Exemplo de Uso
/// ```typescript,ignore
/// const details = await invoke('fetch_game_details', {
///     query: 'The Witcher 3'
/// });
/// console.log(details.description_raw);
/// console.log(details.metacritic);
/// ```
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
///
/// # Retorna
/// * `Ok(Vec<RawgGame>)` - Lista de até 20 jogos populares
/// * `Err(String)` - API key não configurada ou erro na requisição
///
/// # Exemplo de Uso
/// ```typescript,ignore
/// const trending = await invoke('get_trending_games');
/// trending.forEach(game => {
///     console.log(`${game.name} - Rating: ${game.rating}`);
/// });
/// ```
#[tauri::command]
pub async fn get_trending_games(app_handle: AppHandle) -> Result<Vec<rawg::RawgGame>, String> {
    let api_key = get_api_key(&app_handle)?;
    rawg::fetch_trending_games(&api_key).await
}

/// Busca jogos com lançamento futuro.
///
/// Retorna lista de jogos que ainda mais aguardados que serão lançados até o final do próximo ano.
///
/// # Retorna
/// * `Ok(Vec<RawgGame>)` - Lista de até 10 jogos futuros
/// * `Err(String)` - API key inválida ou erro na requisição
///
/// # Exemplo de Uso
/// ```typescript,ignore
/// const upcoming = await invoke('get_upcoming_games', {
///     apiKey: 'your_key_here'
/// });
/// ```
#[tauri::command]
pub async fn get_upcoming_games(api_key: String) -> Result<Vec<rawg::RawgGame>, String> {
    rawg::fetch_upcoming_games(&api_key).await
}
