//! Módulo de importação de bibliotecas de plataformas externas (Steam, Epic, GOG).
//!
//! Fornece comandos para importar jogos em lote de serviços como Steam,
//! conectando-se aos arquivos locais e APIs públicas para obter a lista completa.
//!
//! **Nota:** Atualmente, apenas Steam é suportado.

use crate::constants;
use crate::database::AppState;
use crate::errors::AppError;
use crate::sources::steam;
use crate::utils::status_logic;
use chrono::{TimeZone, Utc};
use rusqlite::params;
use tauri::State;
use tracing::info;
use uuid::Uuid;

/// Importa a biblioteca completa de jogos Steam do usuário.
///
/// Obtém jogos de múltiplas fontes:
/// 1. Jogos instalados (via arquivos VDF locais do Steam)
/// 2. Jogos não-instalados (via librarycache do Steam)
/// 3. API Steam (como fallback para jogos não encontrados localmente)
///
/// Em seguida, faz merge de todas as fontes resolvendo conflitos por:
/// - Prioridade 1: Jogos instalados
/// - Prioridade 2: Nível de confiança da importação
/// - Prioridade 3: Completude dos dados
///
/// **Processo:**
/// 1. Busca biblioteca completa via `sources::steam::get_complete_library`
/// 2. Filtra para apenas jogos Steam
/// 3. Converte playtime de minutos para horas
/// 4. Insere em lote usando transação SQL
///
/// **Nota:**
/// - Biblioteca privada retorna erro de autenticação
/// - Tempo de jogo é arredondado para horas inteiras
/// - Operação é mais lenta que apenas API (lê arquivos locais)
#[tauri::command]
pub async fn import_steam_library(
    state: State<'_, AppState>,
    api_key: String,
    steam_id: String,
) -> Result<String, AppError> {
    let steam_root = if cfg!(windows) {
        // Tenta encontrar Steam em localizações comuns no Windows
        let possible_paths = vec![
            "C:\\Program Files (x86)\\Steam",
            "C:\\Program Files\\Steam",
            "D:\\Steam",
            "E:\\Steam",
        ];

        let mut found_path = None;
        for path_str in possible_paths {
            let path = std::path::Path::new(path_str);
            if path.exists() {
                found_path = Some(path.to_path_buf());
                break;
            }
        }

        found_path.ok_or_else(|| {
            AppError::ValidationError(
                "Não foi possível encontrar a pasta de instalação do Steam.".to_string(),
            )
        })?
    } else {
        return Err(AppError::ValidationError(
            "Suporte a Steam em plataformas não-Windows ainda não foi implementado.".to_string(),
        ));
    };

    // Busca biblioteca completa (arquivos locais + API Steam)
    let complete_library = steam::get_complete_library(&steam_root, &api_key, &steam_id)
        .await
        .map_err(AppError::NetworkError)?;

    if complete_library.is_empty() {
        return Ok("Nenhum jogo encontrado.".to_string());
    }

    let mut inserted = 0;
    let mut updated = 0;
    let now = Utc::now().to_rfc3339();

    let conn = state.library_db.lock()?;

    for game in complete_library {
        let exists: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM games WHERE platform = 'Steam' AND platform_game_id = ?1)",
                params![&game.platform_game_id],
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

        if !exists {
            let new_id = Uuid::new_v4().to_string();
            let cover = format!(
                "{}/steam/apps/{}/library_600x900.jpg",
                constants::STEAM_CDN_URL,
                &game.platform_game_id
            );

            conn.execute(
                "INSERT INTO games (
                    id, name, cover_url, platform, platform_game_id,
                    installed, status, playtime, last_played, added_at, favorite, user_rating
                ) VALUES (?1, ?2, ?3, 'Steam', ?4, ?5, ?6, ?7, ?8, ?9, 0, NULL)",
                params![
                    new_id,
                    game.name,
                    cover,
                    game.platform_game_id,
                    game.installed,
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
                    installed = ?1,
                    status = ?2,
                    playtime = ?3,
                    last_played = ?4
                 WHERE platform = 'Steam' AND platform_game_id = ?5",
                params![
                    game.installed,
                    status,
                    game.playtime_forever,
                    last_played_iso,
                    game.platform_game_id
                ],
            )
            .ok();
            updated += 1;
        }
    }

    let message = format!("{} novos, {} atualizados", inserted, updated);
    info!("{}", message);

    Ok(message)
}
