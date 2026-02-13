//! Módulo de importação de bibliotecas de plataformas externas (Steam, Epic, GOG).
//!
//! Fornece comandos para importar jogos em lote de serviços como Steam,
//! conectando-se aos arquivos locais e APIs públicas para obter a lista completa.

use crate::constants;
use crate::database::AppState;
use crate::errors::AppError;
use crate::sources::games_scanner::{scan_folder, GameDiscovery};
use crate::sources::steam;
use crate::utils::status_logic;
use chrono::{TimeZone, Utc};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::path::Path;
use tauri::{AppHandle, Emitter, State};
use tracing::info;
use uuid::Uuid;

// === Estruturas de Dados ===

#[derive(Serialize, Deserialize, Debug)]
pub struct ScanResult {
    pub success: bool,
    pub message: String,
    pub discoveries: Vec<GameDiscovery>,
}

#[derive(Deserialize)]
pub struct ScanGameInput {
    pub name: String,
    pub executable_path: String,
    pub base_path: String,
}

// === Steam ===

/// Importa a biblioteca completa de jogos Steam do usuário.
///
/// Obtém jogos de múltiplas fontes: instalados via arquivos VDF locais do Steam, não instalados
/// via librarycache do Steam e usa como fallback a API para jogos não encontrados localmente.
#[tauri::command]
pub async fn import_steam_library(
    state: State<'_, AppState>,
    api_key: String,
    steam_id: String,
    steam_root: String,
) -> Result<String, AppError> {
    let steam_root_path = std::path::Path::new(&steam_root);

    if !steam_root_path.exists() {
        return Err(AppError::ValidationError(
            "O diretório de instalação do Steam especificado não existe.".to_string(),
        ));
    }

    // Busca biblioteca completa (arquivos locais + API Steam)
    let complete_library = steam::get_complete_library(steam_root_path, &api_key, &steam_id)
        .await
        .map_err(AppError::NetworkError)?;

    if complete_library.is_empty() {
        return Ok("Nenhum jogo encontrado.".to_string());
    }

    let mut inserted = 0;
    let mut updated = 0;
    let now = Utc::now().to_rfc3339();

    // Preparar todos os dados antes de salvar (coleta em batch)
    let mut games_to_insert = Vec::new();
    let mut games_to_update = Vec::new();

    {
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

                games_to_insert.push((
                    new_id,
                    game.name,
                    cover,
                    game.platform_game_id,
                    game.installed,
                    status,
                    game.playtime_forever,
                    last_played_iso,
                    now.clone(),
                ));
            } else {
                games_to_update.push((
                    game.installed,
                    status,
                    game.playtime_forever,
                    last_played_iso,
                    game.platform_game_id,
                ));
            }
        }
    }

    // Salva tudo numa única transação
    {
        let mut conn = state.library_db.lock()?;
        let tx = conn.transaction()?;

        // Insere novos jogos
        for (
            id,
            name,
            cover,
            platform_game_id,
            installed,
            status,
            playtime,
            last_played,
            added_at,
        ) in games_to_insert
        {
            if let Ok(_) = tx.execute(
                "INSERT INTO games (
                    id, name, cover_url, platform, platform_game_id,
                    installed, status, playtime, last_played, added_at, favorite, user_rating
                ) VALUES (?1, ?2, ?3, 'Steam', ?4, ?5, ?6, ?7, ?8, ?9, 0, NULL)",
                params![
                    id,
                    name,
                    cover,
                    platform_game_id,
                    installed,
                    status,
                    playtime,
                    last_played,
                    added_at
                ],
            ) {
                inserted += 1;
            }
        }

        // Atualiza jogos existentes
        for (installed, status, playtime, last_played, platform_game_id) in games_to_update {
            if let Ok(_) = tx.execute(
                "UPDATE games SET
                    installed = ?1,
                    status = ?2,
                    playtime = ?3,
                    last_played = ?4
                 WHERE platform = 'Steam' AND platform_game_id = ?5",
                params![installed, status, playtime, last_played, platform_game_id],
            ) {
                updated += 1;
            }
        }

        // Commit único para todos os jogos
        tx.commit()?;

        info!(
            "Batch Steam salvo: {} novos, {} atualizados",
            inserted, updated
        );
    }

    let message = format!("{} novos, {} atualizados", inserted, updated);
    info!("{}", message);

    Ok(message)
}

// === SCAN FOLDERS ===

/// Escaneia uma pasta local em busca de possíveis jogos.
///
/// Retorna uma lista de descobertas encontradas.
#[tauri::command]
pub async fn scan_games_folder(folder_path: String) -> Result<ScanResult, String> {
    let path = Path::new(&folder_path);

    // Validações básicas
    if !path.exists() {
        return Ok(ScanResult {
            success: false,
            message: "Pasta não encontrada".to_string(),
            discoveries: vec![],
        });
    }

    if !path.is_dir() {
        return Ok(ScanResult {
            success: false,
            message: "Caminho não é uma pasta".to_string(),
            discoveries: vec![],
        });
    }

    // Executar scan
    let discoveries = scan_folder(path)?;

    let message = if discoveries.is_empty() {
        "Nenhum jogo encontrado nesta pasta".to_string()
    } else {
        format!("Encontrados {} possíveis jogos", discoveries.len())
    };

    Ok(ScanResult {
        success: true,
        message,
        discoveries,
    })
}

/// Adiciona um jogo descoberto pelo scan ao banco de dados.
#[tauri::command]
pub async fn add_game_from_scan(
    app: AppHandle,
    state: State<'_, AppState>,
    name: String,
    executable_path: String,
    base_path: String,
) -> Result<String, String> {
    let conn = state.library_db.lock().map_err(|e| e.to_string())?;

    // Verifica se já existe um jogo com mesmo executável
    let exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM games WHERE executable_path = ?1)",
            params![&executable_path],
            |row| row.get(0),
        )
        .map_err(|e| format!("Erro ao verificar jogo existente: {}", e))?;

    if exists {
        return Err("Este jogo já foi adicionado anteriormente".to_string());
    }

    let id = Uuid::new_v4().to_string();
    let platform_game_id = format!("scan-{}", Uuid::new_v4());
    let added_at = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO games (
            id, name, executable_path, install_path, platform, platform_game_id,
            added_at, installed, status, playtime, favorite, user_rating
        ) VALUES (?1, ?2, ?3, ?4, 'Outra', ?5, ?6, 1, 'Backlog', 0, 0, NULL)",
        params![
            id,
            name,
            executable_path,
            base_path,
            platform_game_id,
            added_at
        ],
    )
    .map_err(|e| format!("Erro ao adicionar jogo: {}", e))?;

    info!("Jogo adicionado via scan: {} ({})", name, id);

    let _ = app.emit("library_updated", ());

    Ok(id)
}

/// Adiciona múltiplos jogos descobertos pelo scan ao banco de dados.
#[tauri::command]
pub async fn add_games_from_scan(
    app: AppHandle,
    state: State<'_, AppState>,
    games: Vec<ScanGameInput>,
) -> Result<String, String> {
    let mut added = 0;
    let mut skipped = 0;
    let added_at = Utc::now().to_rfc3339();

    // Preparar dados para inserção em batch
    let mut games_to_insert = Vec::new();

    {
        let conn = state.library_db.lock().map_err(|e| e.to_string())?;

        for game in games {
            // Verifica se já existe um jogo com mesmo executável
            let exists: bool = conn
                .query_row(
                    "SELECT EXISTS(SELECT 1 FROM games WHERE executable_path = ?1)",
                    params![&game.executable_path],
                    |row| row.get(0),
                )
                .map_err(|e| format!("Erro ao verificar jogo existente: {}", e))?;

            if exists {
                skipped += 1;
                continue;
            }

            let id = Uuid::new_v4().to_string();
            let platform_game_id = format!("scan-{}", Uuid::new_v4());

            games_to_insert.push((
                id,
                game.name,
                game.executable_path,
                game.base_path,
                platform_game_id,
                added_at.clone(),
            ));
        }
    }

    // Salva todos numa única transação
    if !games_to_insert.is_empty() {
        let mut conn = state.library_db.lock().map_err(|e| e.to_string())?;
        let tx = conn
            .transaction()
            .map_err(|e| format!("Erro ao iniciar transação: {}", e))?;

        for (id, name, executable_path, base_path, platform_game_id, added_at) in games_to_insert {
            if let Ok(_) = tx.execute(
                "INSERT INTO games (
                    id, name, executable_path, install_path, platform, platform_game_id,
                    added_at, installed, status, playtime, favorite, user_rating
                ) VALUES (?1, ?2, ?3, ?4, 'Outra', ?5, ?6, 1, 'Backlog', 0, 0, NULL)",
                params![
                    id,
                    name,
                    executable_path,
                    base_path,
                    platform_game_id,
                    added_at
                ],
            ) {
                added += 1;
            }
        }

        // Commit único para todos os jogos
        tx.commit()
            .map_err(|e| format!("Erro ao commitar transação: {}", e))?;

        info!("Batch scan salvo: {} jogos adicionados", added);
    }

    let _ = app.emit("library_updated", ());

    Ok(format!(
        "{} adicionados, {} pulados (já existem)",
        added, skipped
    ))
}
