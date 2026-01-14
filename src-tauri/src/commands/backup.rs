//! Módulo de ‘backup’ e restauração de dados.
//!
//! Fornece funcionalidades para exportar e importar a base de dados completa
//! em formato JSON, incluindo biblioteca de jogos e lista de desejos.
//!
//! **Nota:**
//! Todas as operações usam transações ACID para garantir consistência dos dados.

use crate::database::AppState;
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
) -> Result<(), String> {
    // Buscar dados num único lock
    let (games, game_details, wishlist_game) = {
        let conn = state.library_db.lock().map_err(|_| "Falha no Mutex")?;

        // Inicia transação READ para consistência
        conn.execute("BEGIN TRANSACTION", [])
            .map_err(|e| e.to_string())?;

        let games = fetch_games(&conn)?;
        let game_details = fetch_game_details(&conn)?;
        let wishlist_game = fetch_wishlist(&conn)?;

        conn.execute("COMMIT", []).map_err(|e| e.to_string())?;

        (games, game_details, wishlist_game)
    }; // Lock liberado aqui

    let backup = BackupData {
        version: 2,
        date: chrono::Local::now().to_rfc3339(),
        games,
        game_details,
        wishlist_game,
    };

    let json = serde_json::to_string_pretty(&backup).map_err(|e| e.to_string())?;
    fs::write(file_path, json).map_err(|e| format!("Erro ao salvar arquivo: {}", e))?;

    Ok(())
}

/// Importa e restaura dados de um arquivo de ‘backup’.
///
/// Lê um arquivo JSON de ‘backup’ restaura todos os dados no banco,
/// substituindo registros existentes (INSERT OR REPLACE).
///
/// **Nota:**
/// Esta operação pode sobrescrever dados existentes. Considere criar um ‘backup’ antes de importar.
#[tauri::command]
pub async fn import_database(
    state: State<'_, AppState>,
    file_path: String,
) -> Result<String, String> {
    let content = fs::read_to_string(file_path).map_err(|e| e.to_string())?;
    let backup: BackupData =
        serde_json::from_str(&content).map_err(|_| "Arquivo de backup inválido".to_string())?;

    // Validação de versão
    if backup.version != 2 {
        return Err(format!("Versão de backup incompatível: {}", backup.version));
    }

    let conn = state.library_db.lock().map_err(|_| "Falha no Mutex")?;

    // Transação única para todas as operações
    conn.execute("BEGIN IMMEDIATE TRANSACTION", [])
        .map_err(|e| e.to_string())?;

    // Usa prepared statements para melhor desempenho
    let mut game_stmt = conn.prepare(
        "INSERT OR REPLACE INTO games (id, name, cover_url, platform, platform_id, install_path, executable_path, launch_args, user_rating, favorite, status, playtime, last_played, added_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)"
    ).map_err(|e| e.to_string())?;

    // Prepared Statement para Details (ATUALIZADO COM NOVOS CAMPOS)
    let mut details_stmt = conn.prepare(
        "INSERT OR REPLACE INTO game_details (
            game_id, steam_app_id, description, developer, publisher, release_date,
            genres, tags, series, age_rating, background_image, critic_score, users_score,
            website_url, igdb_url, rawg_url, pcgamingwiki_url, hltb_main_story,
            hltb_main_extra, hltb_completionist,
            steam_review_label, steam_review_count, steam_review_score, steam_review_updated_at,
            is_adult, adult_tags, external_links, median_playtime
        )
         VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20,
            ?21, ?22, ?23, ?24, ?25, ?26, ?27, ?28
         )"
    ).map_err(|e| e.to_string())?;

    let mut wishlist_stmt = conn.prepare(
        "INSERT OR REPLACE INTO wishlist (id, name, cover_url, store_url, store_platform, current_price, normal_price, lowest_price, currency, on_sale, voucher, added_at, itad_id)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)"
    ).map_err(|e| e.to_string())?;

    for game in &backup.games {
        game_stmt
            .execute(rusqlite::params![
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
            ])
            .map_err(|e| e.to_string())?;
    }

    // Loop Details (ATUALIZADO)
    for detail in &backup.game_details {
        // Serializa o HashMap de links para JSON String antes de salvar
        let links_json = detail
            .external_links
            .as_ref()
            .and_then(|links| serde_json::to_string(links).ok());

        details_stmt
            .execute(params![
                detail.game_id,
                detail.steam_app_id,
                detail.description,
                detail.developer,
                detail.publisher,
                detail.release_date,
                detail.genres,
                detail.tags,
                detail.series,
                detail.age_rating,
                detail.background_image,
                detail.critic_score,
                detail.users_score,
                detail.website_url,
                detail.igdb_url,
                detail.rawg_url,
                detail.pcgamingwiki_url,
                detail.hltb_main_story,
                detail.hltb_main_extra,
                detail.hltb_completionist,
                // Novos Campos v2.0
                detail.steam_review_label,
                detail.steam_review_count,
                detail.steam_review_score,
                detail.steam_review_updated_at, // Adicionado conforme sua correção
                detail.is_adult,
                detail.adult_tags,
                links_json, // JSON String
                detail.median_playtime
            ])
            .map_err(|e| e.to_string())?;
    }

    for item in &backup.wishlist_game {
        wishlist_stmt
            .execute(rusqlite::params![
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
            ])
            .map_err(|e| e.to_string())?;
    }

    conn.execute("COMMIT", []).map_err(|e| e.to_string())?;

    Ok(format!(
        "Backup restaurado! {} jogos, {} detalhes de jogos e {} itens da lista de desejos.",
        backup.games.len(),
        backup.game_details.len(),
        backup.wishlist_game.len()
    ))
}

fn fetch_games(conn: &rusqlite::Connection) -> Result<Vec<Game>, String> {
    let mut stmt = conn
        .prepare("SELECT id, name, cover_url, platform, platform_id, install_path, executable_path, launch_args, user_rating, favorite, status, playtime, last_played, added_at FROM games")
        .map_err(|e| e.to_string())?;
    let game_iter = stmt
        .query_map([], |row| {
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
            })
        })
        .map_err(|e| e.to_string())?;

    game_iter
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

fn fetch_wishlist(conn: &rusqlite::Connection) -> Result<Vec<WishlistGame>, String> {
    let mut stmt = conn
        .prepare("SELECT id, name, cover_url, store_url, store_platform, itad_id, current_price, normal_price, lowest_price, currency, on_sale, voucher, added_at FROM wishlist")
        .map_err(|e| e.to_string())?;
    let wishlist_iter = stmt
        .query_map([], |row| {
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
        })
        .map_err(|e| e.to_string())?;

    wishlist_iter
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

// ATUALIZADO: fetch_game_details com novos campos
fn fetch_game_details(conn: &rusqlite::Connection) -> Result<Vec<GameDetails>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT
            game_id, steam_app_id, description, developer, publisher, release_date,
            genres, tags, series, age_rating, background_image, critic_score, users_score,
            website_url, igdb_url, rawg_url, pcgamingwiki_url, hltb_main_story,
            hltb_main_extra, hltb_completionist,
            steam_review_label, steam_review_count, steam_review_score, steam_review_updated_at,
            is_adult, adult_tags, external_links, median_playtime
         FROM game_details",
        )
        .map_err(|e| e.to_string())?;

    let details_iter = stmt
        .query_map([], |row| {
            // Deserializa JSON string para HashMap
            let links_json: Option<String> = row.get(26)?;
            let external_links = links_json.and_then(|s| serde_json::from_str(&s).ok());

            Ok(GameDetails {
                game_id: row.get(0)?,
                steam_app_id: row.get(1)?,
                description: row.get(2)?,
                developer: row.get(3)?,
                publisher: row.get(4)?,
                release_date: row.get(5)?,
                genres: row.get(6)?,
                tags: row.get(7)?,
                series: row.get(8)?,
                age_rating: row.get(9)?,
                background_image: row.get(10)?,
                critic_score: row.get(11)?,
                users_score: row.get(12)?,
                website_url: row.get(13)?,
                igdb_url: row.get(14)?,
                rawg_url: row.get(15)?,
                pcgamingwiki_url: row.get(16)?,
                hltb_main_story: row.get(17)?,
                hltb_main_extra: row.get(18)?,
                hltb_completionist: row.get(19)?,
                // Novos campos mapeados por índice
                steam_review_label: row.get(20)?,
                steam_review_count: row.get(21)?,
                steam_review_score: row.get(22)?,
                steam_review_updated_at: row.get(23)?,
                is_adult: row.get(24)?,
                adult_tags: row.get(25)?,
                external_links, // Mapeado acima
                median_playtime: row.get(27)?,
            })
        })
        .map_err(|e| e.to_string())?;

    details_iter
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}
