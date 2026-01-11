//! Módulo de ‘backup’ e restauração de dados.
//!
//! Fornece funcionalidades para exportar e importar a base de dados completa
//! em formato JSON, incluindo biblioteca de jogos e lista de desejos.
//!
//! **Nota:**
//! Todas as operações usam transações ACID para garantir consistência dos dados.

use crate::database::AppState;
use crate::models::{Game, WishlistGame};
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
    let (games, wishlist_game) = {
        let conn = state.library_db.lock().map_err(|_| "Falha no Mutex")?;

        // Inicia transação READ para consistência
        conn.execute("BEGIN TRANSACTION", [])
            .map_err(|e| e.to_string())?;

        let games = fetch_games(&conn)?;
        let wishlist_game = fetch_wishlist(&conn)?;

        conn.execute("COMMIT", []).map_err(|e| e.to_string())?;

        (games, wishlist_game)
    }; // Lock liberado aqui

    let backup = BackupData {
        version: 1,
        date: chrono::Local::now().to_rfc3339(),
        games,
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
    if backup.version != 1 {
        return Err(format!("Versão de backup incompatível: {}", backup.version));
    }

    let conn = state.library_db.lock().map_err(|_| "Falha no Mutex")?;

    // Transação única para todas as operações
    conn.execute("BEGIN IMMEDIATE TRANSACTION", [])
        .map_err(|e| e.to_string())?;

    // Usa prepared statements para melhor desempenho
    let mut game_stmt = conn.prepare(
        "INSERT OR REPLACE INTO games (id, name, genre, platform, cover_url, playtime, rating, favorite)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
    ).map_err(|e| e.to_string())?;

    let mut wishlist_stmt = conn.prepare(
        "INSERT OR REPLACE INTO wishlist (id, name, cover_url, store_url, current_price, lowest_price, on_sale, localized_price, localized_currency, steam_app_id, added_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)"
    ).map_err(|e| e.to_string())?;

    for game in &backup.games {
        game_stmt
            .execute(rusqlite::params![
                game.id,
                game.name,
                //game.genre,
                game.platform,
                game.cover_url,
                game.playtime,
                game.user_rating,
                game.favorite
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
                item.current_price,
                item.lowest_price,
                item.on_sale,
                //item.localized_price,
                //item.localized_currency,
                //item.steam_app_id,
                item.added_at
            ])
            .map_err(|e| e.to_string())?;
    }

    conn.execute("COMMIT", []).map_err(|e| e.to_string())?;

    Ok(format!(
        "Backup restaurado! {} jogos e {} itens da lista de desejos.",
        backup.games.len(),
        backup.wishlist_game.len()
    ))
}

fn fetch_games(conn: &rusqlite::Connection) -> Result<Vec<Game>, String> {
    let mut stmt = conn
        .prepare("SELECT * FROM games")
        .map_err(|e| e.to_string())?;
    let game_iter = stmt
        .query_map([], |row| {
            Ok(Game {
                id: row.get("id")?,
                name: row.get("name")?,
                //genre: row.get("genre")?,
                platform: row.get("platform")?,
                platform_id: None,
                install_path: None,
                executable_path: None,
                launch_args: None,
                cover_url: row.get("cover_url")?,
                genres: None,
                playtime: row.get("playtime")?,
                last_played: None,
                //rating: row.get("rating").unwrap_or(None),
                favorite: row.get("favorite").unwrap_or(false),
                user_rating: None,
                status: None,
                added_at: "".to_string(),
                developer: None,
            })
        })
        .map_err(|e| e.to_string())?;

    game_iter
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

fn fetch_wishlist(conn: &rusqlite::Connection) -> Result<Vec<WishlistGame>, String> {
    let mut stmt = conn
        .prepare("SELECT * FROM wishlist")
        .map_err(|e| e.to_string())?;
    let wishlist_iter = stmt
        .query_map([], |row| {
            Ok(WishlistGame {
                id: row.get("id")?,
                name: row.get("name")?,
                cover_url: row.get("cover_url")?,
                store_url: row.get("store_url")?,
                store_platform: row.get("store_platform")?,
                itad_id: row.get("itad_id")?,
                current_price: row.get("current_price")?,
                normal_price: row.get("normal_price")?,
                lowest_price: row.get("lowest_price")?,
                currency: row.get("currency")?,
                on_sale: row.get("on_sale")?,
                added_at: row.get("added_at")?,
            })
        })
        .map_err(|e| e.to_string())?;

    wishlist_iter
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}
