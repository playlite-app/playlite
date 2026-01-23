//! Módulo de ‘backup’ e restauração de dados.
//!
//! Fornece funcionalidades para exportar e importar a base de dados completa
//! em formato JSON, incluindo biblioteca de jogos e lista de desejos.
//!
//! **Nota:**
//! Todas as operações usam transações ACID para garantir consistência dos dados.

use crate::database::AppState;
use crate::errors::AppError;
use crate::models::{Game, GameDetails, WishlistGame};
use rusqlite::params;
use std::fs;
use tauri::{AppHandle, State};

/// Estrutura do arquivo de ‘backup’.
///
/// Contém metadados e todos os dados exportados da aplicação.
#[derive(serde::Serialize, serde::Deserialize)]
pub struct BackupData {
    pub version: u32,
    pub date: String,
    pub games: Vec<Game>,
    pub game_details: Vec<GameDetails>,
    pub wishlist_game: Vec<WishlistGame>,
}

/// Exporta toda a base de dados para um arquivo JSON.
///
/// Cria um snapshot completo e consistente de todos os dados da aplicação,
/// incluindo jogos e wishlist, num único arquivo JSON formatado.
#[tauri::command]
pub async fn export_database(
    _app: AppHandle,
    state: State<'_, AppState>,
    file_path: String,
) -> Result<(), AppError> {
    // Buscar dados num único lock
    let (games, game_details, wishlist_game) = {
        let conn = state.library_db.lock()?;

        // Inicia transação READ para consistência
        conn.execute("BEGIN TRANSACTION", [])?;

        let games = fetch_games(&conn)?;
        let game_details = fetch_game_details(&conn)?;
        let wishlist_game = fetch_wishlist(&conn)?;

        conn.execute("COMMIT", [])?;

        (games, game_details, wishlist_game)
    }; // Lock liberado aqui

    let backup = BackupData {
        version: 2,
        date: chrono::Local::now().to_rfc3339(),
        games,
        game_details,
        wishlist_game,
    };

    let json = serde_json::to_string_pretty(&backup)?;
    fs::write(file_path, json)?;

    Ok(())
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
    state: State<'_, AppState>,
    file_path: String,
) -> Result<String, AppError> {
    let content = fs::read_to_string(file_path)?;
    let backup: BackupData = serde_json::from_str(&content)
        .map_err(|_| AppError::ValidationError("Arquivo de backup inválido".to_string()))?;

    // Validação de versão
    if backup.version != 2 {
        return Err(AppError::ValidationError(format!(
            "Versão de backup incompatível: {}",
            backup.version
        )));
    }

    let conn = state.library_db.lock()?;

    // Transação única para todas as operações
    conn.execute("BEGIN IMMEDIATE TRANSACTION", [])?;

    // Usa prepared statements para melhor desempenho
    let mut game_stmt = conn.prepare(
        "INSERT OR REPLACE INTO games (id, name, cover_url, platform, platform_id, install_path, executable_path, launch_args, user_rating, favorite, status, playtime, last_played, added_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)"
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
            game.platform,
            game.platform_id,
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
        "SELECT id, name, cover_url, platform, platform_id, install_path, executable_path, launch_args, user_rating, favorite, status, playtime, last_played, added_at FROM games"
    )?;

    let game_iter = stmt.query_map([], |row| {
        Ok(Game {
            id: row.get(0)?,
            name: row.get(1)?,
            cover_url: row.get(2)?,
            genres: None,
            developer: None,
            platform: row.get(3)?,
            platform_id: row.get(4)?,
            install_path: row.get(5)?,
            executable_path: row.get(6)?,
            launch_args: row.get(7)?,
            user_rating: row.get(8)?,
            favorite: row.get(9)?,
            status: row.get(10)?,
            playtime: row.get(11)?,
            last_played: row.get(12)?,
            added_at: row.get(13)?,
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
