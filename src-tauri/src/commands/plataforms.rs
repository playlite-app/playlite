//! Módulo de importação de bibliotecas de plataformas externas (Steam, Epic, GOG).
//!
//! Fornece comandos para importar jogos em lote de serviços como Steam,
//! conectando-se aos arquivos locais e APIs públicas para obter a lista completa.

use crate::constants;
use crate::database::AppState;
use crate::errors::AppError;
use crate::sources::scanner::{scan_folder, GameDiscovery};
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

// === Funções Genéricas de Persistência ===

/// Persiste uma lista de jogos de uma fonte externa (como Steam) no banco de dados.
///
/// Retorna o número de jogos inseridos e atualizados.
async fn persist_source_games(
    state: &AppState,
    games: Vec<crate::sources::providers::SourceGame>,
) -> Result<(u32, u32), AppError> {
    let mut conn = state.library_db.lock().map_err(|_| AppError::MutexError)?;

    // Inicia uma transação única para todo o lote
    let tx = conn
        .transaction()
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    let mut inserted = 0;
    let mut updated = 0;
    let now = Utc::now().to_rfc3339();

    for game in games {
        // Verifica existência usando a transação
        let exists: bool = tx
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM games WHERE platform = ?1 AND platform_game_id = ?2)",
                params![&game.platform, &game.platform_game_id],
                |row| row.get(0),
            )
            .unwrap_or(false);

        let status = status_logic::calculate_status(game.playtime_minutes.unwrap_or(0) as i32);

        let last_played_iso = game.last_played.and_then(|ts| {
            if ts > 0 {
                Some(Utc.timestamp_opt(ts, 0).single().map(|dt| dt.to_rfc3339()))
            } else {
                None
            }
        });

        if !exists {
            let new_id = Uuid::new_v4().to_string();
            // Define uma capa padrão da Steam se for essa a plataforma
            let cover_url = if game.platform == "Steam" {
                Some(format!(
                    "{}/steam/apps/{}/library_600x900.jpg",
                    constants::STEAM_CDN_URL,
                    &game.platform_game_id
                ))
            } else {
                None
            };

            tx.execute(
                "INSERT INTO games (
                    id, name, cover_url, platform, platform_game_id,
                    installed, status, playtime, last_played, added_at,
                    favorite, user_rating, install_path
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 0, NULL, ?11)",
                params![
                    new_id,
                    game.name.unwrap_or_else(|| "Unknown".to_string()),
                    cover_url,
                    game.platform,
                    game.platform_game_id,
                    game.installed,
                    status,
                    game.playtime_minutes.unwrap_or(0),
                    last_played_iso,
                    now,
                    game.install_path
                ],
            )
            .map_err(|e| AppError::DatabaseError(e.to_string()))?;

            inserted += 1;
        } else {
            tx.execute(
                "UPDATE games SET
                    installed = ?1,
                    status = ?2,
                    playtime = ?3,
                    last_played = ?4,
                    install_path = COALESCE(?5, install_path)
                 WHERE platform = ?6 AND platform_game_id = ?7",
                params![
                    game.installed,
                    status,
                    game.playtime_minutes.unwrap_or(0),
                    last_played_iso,
                    game.install_path,
                    game.platform,
                    game.platform_game_id
                ],
            )
            .map_err(|e| AppError::DatabaseError(e.to_string()))?;

            updated += 1;
        }
    }

    // Finaliza a transação
    tx.commit()
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok((inserted, updated))
}

// === Steam ===

/// Importa a biblioteca completa de jogos Steam do usuário.
///
/// Obtém jogos de múltiplas fontes: instalados via arquivos VDF locais do Steam, não instalados
/// via librarycache do Steam e usa como fallback a API para jogos não encontrados localmente.
#[tauri::command]
pub async fn import_steam_library(
    app: AppHandle,
    state: State<'_, AppState>,
    api_key: String,
    steam_id: String,
    steam_root: String,
) -> Result<String, AppError> {
    use crate::sources::providers::GameSource; // Importa o Trait

    // 1. Instancia o provedor baseado no novo modelo de Trait
    let source = steam::SteamSource {
        steam_root,
        api_key,
        steam_id,
    };

    // 2. Busca os jogos (VDF + Cache + API)
    let games = source.fetch_games().await?;

    if games.is_empty() {
        return Ok("Nenhum jogo encontrado na Steam.".to_string());
    }

    // 3. Persiste usando a função genérica otimizada
    let (inserted, updated) = persist_source_games(&state, games).await?;
    let message = format!("Steam: {} novos, {} atualizados", inserted, updated);
    info!("{}", message);

    // Notifica o frontend
    let _ = app.emit("library_updated", ());

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
) -> Result<String, AppError> {
    use crate::sources::providers::SourceGame;

    let game = SourceGame {
        platform: "Outra".to_string(),
        platform_game_id: executable_path.clone(),
        name: Some(name),
        installed: true,
        executable_path: Some(executable_path.clone()),
        install_path: Some(base_path),
        playtime_minutes: Some(0),
        last_played: None,
    };

    let (inserted, _) = persist_source_games(&state, vec![game]).await?;

    if inserted == 0 {
        return Err(AppError::ValidationError(
            "Este jogo já foi adicionado anteriormente.".to_string(),
        ));
    }

    let _ = app.emit("library_updated", ());

    Ok("Jogo adicionado com sucesso.".to_string())
}

/// Adiciona múltiplos jogos descobertos pelo scan ao banco de dados.
#[tauri::command]
pub async fn add_games_from_scan(
    app: AppHandle,
    state: State<'_, AppState>,
    games: Vec<ScanGameInput>,
) -> Result<String, AppError> {
    use crate::sources::providers::SourceGame;

    let source_games: Vec<SourceGame> = games
        .into_iter()
        .map(|g| SourceGame {
            platform: "Outra".to_string(),
            platform_game_id: g.executable_path.clone(),
            name: Some(g.name),
            installed: true,
            executable_path: Some(g.executable_path.clone()),
            install_path: Some(g.base_path),
            playtime_minutes: Some(0),
            last_played: None,
        })
        .collect();

    let (inserted, updated) = persist_source_games(&state, source_games).await?;
    let _ = app.emit("library_updated", ());

    Ok(format!("{} adicionados, {} atualizados", inserted, updated))
}
