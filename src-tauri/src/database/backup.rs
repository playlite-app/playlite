//! Módulo de ‘backup’ e restauração de dados.
//!
//! Fornece funcionalidades para exportar e importar a base de dados completa
//! em formato JSON, incluindo biblioteca de jogos e lista de desejos.
//!
//! **Nota:**
//! Todas as operações usam transações ACID para garantir consistência dos dados.

use crate::database;
use crate::database::{current_schema_version, AppState, SCHEMA_VERSION};
use crate::errors::AppError;
use crate::models::{Game, GameDetails, Platform, WishlistGame};
use chrono::Utc;
use rusqlite::params;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, State};

/// Estrutura do arquivo de ‘backup’.
///
/// Contém metadados e todos os dados exportados da aplicação.
#[derive(serde::Serialize, serde::Deserialize)]
pub struct BackupData {
    pub version: u32, // schema == backup
    pub app_version: String,
    pub date: String,
    pub games: Vec<Game>,
    pub game_details: Vec<GameDetails>,
    pub wishlist_game: Vec<WishlistGame>,
}

/// Função auxiliar interna para buscar dados do backup com transação ACID
///
/// Retorna tupla com (games, game_details, wishlist_game, schema_version)
fn fetch_backup_data(
    state: &State<AppState>,
) -> Result<(Vec<Game>, Vec<GameDetails>, Vec<WishlistGame>, u32), AppError> {
    let conn = state.library_db.lock()?;

    // Inicia transação READ para consistência
    conn.execute("BEGIN TRANSACTION", [])?;

    let games = fetch_games(&conn)?;
    let game_details = fetch_game_details(&conn)?;
    let wishlist_game = fetch_wishlist(&conn)?;
    let schema_version = current_schema_version(&conn)?;

    conn.execute("COMMIT", [])?;

    Ok((games, game_details, wishlist_game, schema_version))
}

/// Exporta toda a base de dados para um arquivo JSON.
///
/// Cria um snapshot completo e consistente de todos os dados da aplicação,
/// incluindo jogos e wishlist, num único arquivo JSON formatado.
#[tauri::command]
pub async fn export_database(
    app: AppHandle,
    state: State<'_, AppState>,
    file_path: String,
) -> Result<(), AppError> {
    // Buscar dados com transação ACID
    let (games, game_details, wishlist_game, schema_version) = fetch_backup_data(&state)?;

    let backup = BackupData {
        version: schema_version,
        app_version: app.package_info().version.to_string(),
        date: chrono::Local::now().to_rfc3339(),
        games,
        game_details,
        wishlist_game,
    };

    let json = serde_json::to_string_pretty(&backup)?;
    fs::write(file_path, json)?;

    // Atualiza timestamp do último backup manual
    let metadata_conn = state.metadata_db.lock().map_err(|_| AppError::MutexError)?;
    let now = Utc::now().to_rfc3339();
    database::configs::set_config(&metadata_conn, "last_backup_at", &now)?;

    Ok(())
}

pub fn backup_if_major_update(
    app: &AppHandle,
    previous_version: &str,
    current_version: &str,
) -> Result<Option<PathBuf>, AppError> {
    // Parse das versões
    let parse_version = |v: &str| -> (u32, u32, u32) {
        let parts: Vec<&str> = v.split('.').collect();
        let major = parts.first().and_then(|s| s.parse().ok()).unwrap_or(0);
        let minor = parts.get(1).and_then(|s| s.parse().ok()).unwrap_or(0);
        let patch = parts.get(2).and_then(|s| s.parse().ok()).unwrap_or(0);
        (major, minor, patch)
    };

    let (prev_major, _, _) = parse_version(previous_version);
    let (curr_major, _, _) = parse_version(current_version);

    // Se versão major mudou, faz backup
    if prev_major != curr_major && prev_major > 0 {
        tracing::info!(
            "Mudança de versão major detectada: v{} -> v{}",
            previous_version,
            current_version
        );
        let backup_path = backup_before_update(app, previous_version)?;
        Ok(Some(backup_path))
    } else {
        Ok(None)
    }
}

/// Cria backup automático antes de atualização de versão
///
/// Chamado automaticamente quando detecta mudança de versão major
pub fn backup_before_update(app: &AppHandle, previous_version: &str) -> Result<PathBuf, AppError> {
    tracing::info!("Criando backup automático antes da atualização...");

    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::IoError(format!("Falha ao obter app_data_dir: {}", e)))?;

    let backups_dir = app_data_dir.join("backups");
    std::fs::create_dir_all(&backups_dir)?;

    // Nome do backup com timestamp e versão anterior
    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
    let backup_filename = format!("auto_backup_v{}_{}.json", previous_version, timestamp);
    let backup_path = backups_dir.join(backup_filename);

    // Reutiliza a função auxiliar de fetch
    let state: tauri::State<AppState> = app.state();
    let (games, game_details, wishlist_game, schema_version) = fetch_backup_data(&state)?;

    let backup = BackupData {
        version: schema_version,
        app_version: previous_version.to_string(),
        date: chrono::Local::now().to_rfc3339(),
        games,
        game_details,
        wishlist_game,
    };

    let json = serde_json::to_string_pretty(&backup)?;
    fs::write(&backup_path, json)?;

    // Atualiza timestamp do último backup automático
    let metadata_conn = state.metadata_db.lock().map_err(|_| AppError::MutexError)?;
    let now = Utc::now().to_rfc3339();
    database::configs::set_config(&metadata_conn, "last_auto_backup_at", &now)?;

    tracing::info!("Backup automático criado: {:?}", backup_path);
    Ok(backup_path)
}

/// Importa e restaura dados de um arquivo de 'backup'.
///
/// Lê um arquivo JSON de 'backup' restaura todos os dados no banco,
/// substituindo registros existentes (INSERT OR REPLACE).
///
/// **Nota:**
/// Esta operação pode sobrescrever dados existentes. Considere criar um 'backup' antes de importar.
#[tauri::command]
pub async fn import_database(
    _app: AppHandle,
    state: State<'_, AppState>,
    file_path: String,
) -> Result<String, AppError> {
    let content = fs::read_to_string(file_path)?;
    let backup: BackupData = serde_json::from_str(&content)
        .map_err(|_| AppError::ValidationError("Arquivo de backup inválido".to_string()))?;

    // Validação de versão
    if backup.version != SCHEMA_VERSION {
        return Err(AppError::ValidationError(format!(
            "Backup incompatível. Backup v{}, app espera v{}",
            backup.version, SCHEMA_VERSION
        )));
    }

    let conn = state.library_db.lock()?;

    // Transação única para todas as operações
    conn.execute("BEGIN IMMEDIATE TRANSACTION", [])?;

    // Usa prepared statements para melhor desempenho
    let mut game_stmt = conn.prepare(
        "INSERT OR REPLACE INTO games (id, name, cover_url, platform, platform_game_id, installed, import_confidence, install_path, executable_path, launch_args, user_rating, favorite, status, playtime, last_played, added_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)"
    )?;

    // Prepared Statement para Details (ATUALIZADO COM NOVOS CAMPOS)
    let mut details_stmt = conn.prepare(
        "INSERT OR REPLACE INTO game_details (
        game_id, steam_app_id, developer, publisher, release_date, genres, tags, series,
        description_raw, description_ptbr, background_image, critic_score, steam_review_label,
        steam_review_count, steam_review_score, steam_review_updated_at, esrb_rating, is_adult,
        adult_tags, external_links, median_playtime
    )
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21)"
    )?;

    let mut wishlist_stmt = conn.prepare(
        "INSERT OR REPLACE INTO wishlist (id, name, cover_url, store_url, store_platform, current_price, normal_price, lowest_price, currency, on_sale, voucher, added_at, itad_id)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)"
    )?;

    for game in &backup.games {
        game_stmt.execute(rusqlite::params![
            game.id,
            game.name,
            game.cover_url,
            game.platform.to_string(),
            game.platform_game_id,
            game.installed,
            game.import_confidence.as_ref().map(|ic| ic.to_string()),
            game.install_path,
            game.executable_path,
            game.launch_args,
            game.user_rating,
            game.favorite,
            game.status,
            game.playtime,
            game.last_played,
            game.added_at
        ])?;
    }

    // Loop Details
    for detail in &backup.game_details {
        // Serializa o HashMap de links e as tags para JSON String antes de salvar
        let links_json = detail
            .external_links
            .as_ref()
            .and_then(|links| serde_json::to_string(links).ok());

        let tags_json = detail
            .tags
            .as_ref()
            .and_then(|tags| crate::database::serialize_tags(tags).ok());

        details_stmt.execute(params![
            detail.game_id,
            detail.steam_app_id,
            detail.developer,
            detail.publisher,
            detail.release_date,
            detail.genres,
            tags_json,
            detail.series,
            detail.description_raw,
            detail.description_ptbr,
            detail.background_image,
            detail.critic_score,
            detail.steam_review_label,
            detail.steam_review_count,
            detail.steam_review_score,
            detail.steam_review_updated_at,
            detail.esrb_rating,
            detail.is_adult,
            detail.adult_tags,
            links_json, // JSON String
            detail.median_playtime
        ])?;
    }

    for item in &backup.wishlist_game {
        wishlist_stmt.execute(rusqlite::params![
            item.id,
            item.name,
            item.cover_url,
            item.store_url,
            item.store_platform,
            item.current_price,
            item.normal_price,
            item.lowest_price,
            item.currency,
            item.on_sale,
            item.voucher,
            item.added_at,
            item.itad_id
        ])?;
    }

    conn.execute("COMMIT", [])?;

    Ok(format!(
        "Backup restaurado! {} jogos, {} detalhes de jogos e {} itens da lista de desejos.",
        backup.games.len(),
        backup.game_details.len(),
        backup.wishlist_game.len()
    ))
}

/// Busca todos os jogos na biblioteca
///
/// Retorna um vetor de `Game` ou um erro AppError.
fn fetch_games(conn: &rusqlite::Connection) -> Result<Vec<Game>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, name, cover_url, platform, platform_game_id, installed, import_confidence, install_path, executable_path, launch_args, user_rating, favorite, status, playtime, last_played, added_at FROM games"
    )?;

    let game_iter = stmt.query_map([], |row| {
        Ok(Game {
            id: row.get(0)?,
            name: row.get(1)?,
            cover_url: row.get(2)?,
            genres: None,
            developer: None,
            platform: row.get::<_, String>(3)?.parse().unwrap_or(Platform::Outra),
            platform_game_id: row.get(4)?,
            installed: row.get(5)?,
            import_confidence: row
                .get::<_, Option<String>>(6)?
                .and_then(|s| s.parse().ok()),
            install_path: row.get(7)?,
            executable_path: row.get(8)?,
            launch_args: row.get(9)?,
            user_rating: row.get(10)?,
            favorite: row.get(11)?,
            status: row.get(12)?,
            playtime: row.get(13)?,
            last_played: row.get(14)?,
            added_at: row.get(15)?,
            is_adult: false,
        })
    })?;

    Ok(game_iter.collect::<Result<Vec<_>, _>>()?)
}

/// Busca todos os detalhes dos jogos na biblioteca
///
/// Retorna um vetor de `GameDetails` ou um erro AppError.
fn fetch_game_details(conn: &rusqlite::Connection) -> Result<Vec<GameDetails>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT
        game_id, steam_app_id, developer, publisher, release_date, genres, tags, series,
        description_raw, description_ptbr, background_image, critic_score,
        steam_review_label, steam_review_count, steam_review_score, steam_review_updated_at,
        esrb_rating, is_adult, adult_tags, external_links, median_playtime,
        estimated_playtime
     FROM game_details",
    )?;

    let details_iter = stmt.query_map([], |row| {
        // Deserializa JSON strings
        let links_json: Option<String> = row.get(19)?;
        let external_links = links_json.and_then(|s| serde_json::from_str(&s).ok());

        let tags_json: Option<String> = row.get(6)?;
        let tags = tags_json.map(|s| crate::database::deserialize_tags(&s));

        Ok(GameDetails {
            game_id: row.get(0)?,
            steam_app_id: row.get(1)?,
            developer: row.get(2)?,
            publisher: row.get(3)?,
            release_date: row.get(4)?,
            genres: row.get(5)?,
            tags,
            series: row.get(7)?,
            description_raw: row.get(8)?,
            description_ptbr: row.get(9)?,
            background_image: row.get(10)?,
            critic_score: row.get(11)?,
            steam_review_label: row.get(12)?,
            steam_review_count: row.get(13)?,
            steam_review_score: row.get(14)?,
            steam_review_updated_at: row.get(15)?,
            esrb_rating: row.get(16)?,
            is_adult: row.get(17).unwrap_or(false),
            adult_tags: row.get(18)?,
            external_links,
            median_playtime: row.get(20)?,
            estimated_playtime: row.get(21)?,
        })
    })?;

    Ok(details_iter.collect::<Result<Vec<_>, _>>()?)
}

/// Busca todos os jogos da wishlist
///
/// Retorna um vetor de `WishlistGame` ou um erro AppError.
fn fetch_wishlist(conn: &rusqlite::Connection) -> Result<Vec<WishlistGame>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, name, cover_url, store_url, store_platform, itad_id, current_price, normal_price, lowest_price, currency, on_sale, voucher, added_at FROM wishlist"
    )?;

    let wishlist_iter = stmt.query_map([], |row| {
        Ok(WishlistGame {
            id: row.get(0)?,
            name: row.get(1)?,
            cover_url: row.get(2)?,
            store_url: row.get(3)?,
            store_platform: row.get(4)?,
            itad_id: row.get(5)?,
            current_price: row.get(6)?,
            normal_price: row.get(7)?,
            lowest_price: row.get(8)?,
            currency: row.get(9)?,
            on_sale: row.get(10)?,
            voucher: row.get(11)?,
            added_at: row.get(12)?,
        })
    })?;

    Ok(wishlist_iter.collect::<Result<Vec<_>, _>>()?)
}
