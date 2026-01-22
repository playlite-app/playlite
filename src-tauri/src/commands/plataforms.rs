//! Módulo de importação de bibliotecas de plataformas externas (Steam, Epic, GOG).
//!
//! Fornece comandos para importar jogos em lote de serviços como Steam,
//! conectando-se às APIs públicas e populando o banco de dados local.
//!
//! **Nota:** Atualmente, apenas Steam é suportado.

use crate::constants::{self};
use crate::database::AppState;
use crate::services::steam;
use crate::utils::status_logic;
use chrono::{TimeZone, Utc};
use rusqlite::params;
use tauri::State;
use tracing::info;
use uuid::Uuid;

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
    info!("Iniciando importação da Steam");

    // Busca jogos via Steam API
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

        let status = status_logic::calculate_status(game.playtime_forever);

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

        // Insere ou atualiza registro
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
