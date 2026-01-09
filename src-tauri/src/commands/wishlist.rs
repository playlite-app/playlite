//! Módulo de gerenciamento de lista de desejos (wishlist).
//!
//! Implementa funcionalidades para rastreamento de jogos desejados,
//! incluindo busca, adição, remoção e monitoramento de preços.

use crate::database::{self, AppState};
use crate::models::WishlistGame;
use crate::services::rawg;
use rusqlite::params;
use tauri::{AppHandle, State};
use tracing::{error, info};

// Adaptador local para retorno de busca (compatível com frontend)
#[derive(serde::Serialize)]
pub struct SearchResult {
    pub id: String, // RAWG ID como string
    pub name: String,
    pub cover_url: Option<String>,
}

/// Busca jogos na RAWG para adicionar à Wishlist.
///
/// Realiza uma busca na API RAWG usando a chave configurada.
/// Retorna uma lista de resultados com ID, nome e URL da capa.
#[tauri::command]
pub async fn search_wishlist_game(
    app: AppHandle,
    query: String,
) -> Result<Vec<SearchResult>, String> {
    let api_key = database::get_secret(&app, "rawg_api_key")?;
    if api_key.is_empty() {
        return Err("Configure a chave da RAWG nas configurações.".to_string());
    }

    let results = rawg::search_games(&api_key, &query).await?;

    Ok(results
        .into_iter()
        .map(|g| SearchResult {
            id: g.id.to_string(),
            name: g.name,
            cover_url: g.background_image,
        })
        .collect())
}

/// Adiciona um jogo à lista de desejos.
///
/// Insere ou atualiza um jogo na wishlist com informações básicas.
/// Usa `INSERT OR REPLACE` para permitir re-adicionar jogos removidos.
#[tauri::command]
pub fn add_to_wishlist(
    state: State<AppState>,
    id: String,
    name: String,
    cover_url: Option<String>,
    store_url: Option<String>,
    current_price: Option<f64>,
) -> Result<String, String> {
    let conn = state.library_db.lock().map_err(|_| "Mutex error")?;

    match conn.execute(
        "INSERT OR REPLACE INTO wishlist (
            id, name, cover_url, store_url, current_price, added_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, CURRENT_TIMESTAMP)",
        params![id, name, cover_url, store_url, current_price],
    ) {
        Ok(_) => Ok("Adicionado à Wishlist!".to_string()),
        Err(e) => {
            error!("Erro SQL Wishlist: {}", e);
            Err(e.to_string())
        }
    }
}

/// Remove um jogo da lista de desejos.
///
/// Remove o jogo identificado pelo ID fornecido da wishlist.
#[tauri::command]
pub fn remove_from_wishlist(state: State<AppState>, id: String) -> Result<String, String> {
    let conn = state
        .library_db
        .lock()
        .map_err(|_| "Falha ao bloquear mutex")?;

    conn.execute("DELETE FROM wishlist WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok("Jogo removido da lista de desejos.".to_string())
}

/// Recupera todos os jogos da lista de desejos.
///
/// Retorna a wishlist completa ordenada por data de adição (mais recentes primeiro).
#[tauri::command]
pub fn get_wishlist(state: State<AppState>) -> Result<Vec<WishlistGame>, String> {
    let conn = state.library_db.lock().map_err(|_| "Mutex error")?;

    let mut stmt = conn
        .prepare("SELECT id, name, cover_url, store_url, store_platform, current_price, normal_price, lowest_price, currency, on_sale, added_at FROM wishlist ORDER BY added_at DESC")
        .map_err(|e| e.to_string())?;

    let games = stmt
        .query_map([], |row| {
            Ok(WishlistGame {
                id: row.get(0)?,
                name: row.get(1)?,
                cover_url: row.get(2)?,
                store_url: row.get(3)?,
                store_platform: row.get(4)?,
                current_price: row.get(5)?,
                normal_price: row.get(6)?,
                lowest_price: row.get(7)?,
                currency: row.get(8)?,
                on_sale: row.get(9)?,
                added_at: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(games)
}

/// Verifica se um jogo está na lista de desejos.
///
/// Consulta rápida para verificar presença na wishlist, útil para
/// atualizar UI (ex: mudar ícone de "adicionar" para "remover").
#[tauri::command]
pub fn check_wishlist_status(state: State<AppState>, id: String) -> Result<bool, String> {
    let conn = state
        .library_db
        .lock()
        .map_err(|_| "Falha ao bloquear mutex")?;

    let count: i32 = conn
        .query_row(
            "SELECT COUNT(1) FROM wishlist WHERE id = ?1",
            params![id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    Ok(count > 0)
}

/// Placeholder para integração futura com IsThereAnyDeal.
/// Atualmente não faz nada para evitar erros de compilação.
#[tauri::command]
pub async fn refresh_prices(_state: State<'_, AppState>) -> Result<String, String> {
    // TODO: Implementar integração com ITAD
    Ok("Atualização de preços desativada temporariamente (Aguardando ITAD)".to_string())
}
