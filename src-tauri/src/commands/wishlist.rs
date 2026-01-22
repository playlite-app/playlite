//! Módulo de gerenciamento de lista de desejos (wishlist).
//!
//! Adaptado para v2.0 com integração IsThereAnyDeal.

use crate::database::{self, AppState};
use crate::models::WishlistGame;
use crate::services::{itad, rawg, steam};
use rusqlite::params;
use tauri::{AppHandle, State};
use tracing::{error, info};

// Adaptador local para retorno de busca (compatível com frontend)
#[derive(serde::Serialize)]
pub struct SearchResult {
    pub id: String,
    pub name: String,
    pub cover_url: Option<String>,
}

/// Busca jogos na RAWG para adicionar à Wishlist.
#[tauri::command]
pub async fn search_wishlist_game(
    app: AppHandle,
    query: String,
) -> Result<Vec<SearchResult>, String> {
    // Usa RAWG para buscar o jogo e a capa
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
#[tauri::command]
pub fn add_to_wishlist(
    state: State<AppState>,
    id: String,
    name: String,
    cover_url: Option<String>,
    store_url: Option<String>,
    current_price: Option<f64>,
    itad_id: Option<String>,
) -> Result<String, String> {
    let conn = state.library_db.lock().map_err(|_| "Mutex error")?;

    match conn.execute(
        "INSERT OR REPLACE INTO wishlist (
            id, name, cover_url, store_url, current_price, itad_id, added_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, CURRENT_TIMESTAMP)",
        params![id, name, cover_url, store_url, current_price, itad_id],
    ) {
        Ok(_) => Ok("Adicionado à Wishlist!".to_string()),
        Err(e) => {
            error!("Erro SQL Wishlist: {}", e);
            Err(e.to_string())
        }
    }
}

/// Remove um jogo da lista de desejos.
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
#[tauri::command]
pub fn get_wishlist(state: State<AppState>) -> Result<Vec<WishlistGame>, String> {
    let conn = state.library_db.lock().map_err(|_| "Mutex error")?;

    let mut stmt = conn
        .prepare("SELECT id, name, cover_url, store_url, store_platform, current_price, normal_price, lowest_price, currency, on_sale, voucher, added_at, itad_id FROM wishlist ORDER BY added_at DESC")
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
                voucher: row.get(10)?,
                added_at: row.get(11)?,
                itad_id: row.get(12)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(games)
}

/// Verifica se um jogo está na lista de desejos.
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

/// Importa a lista de desejos da Steam e salva no banco de dados.
/// Retorna a quantidade de jogos importados/atualizados.
#[tauri::command]
pub async fn import_steam_wishlist(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<usize, String> {
    // 1. Recuperar o Steam ID configurado
    let steam_id = database::get_secret(&app, "steam_id")?;
    if steam_id.is_empty() {
        return Err("Steam ID não configurado. Vá em Configurações > Integrações.".to_string());
    }

    // 2. Buscar dados da API da Steam
    // (Esta função deve estar pública em src/services/steam.rs)
    let games = steam::fetch_wishlist(&steam_id).await?;
    let total = games.len();

    if total == 0 {
        return Ok(0);
    }

    // 3. Salvar no Banco de Dados (usando block_on para async dentro de sync se necessário,
    // mas aqui estamos num comando async, então usamos o mutex direto)
    let count = {
        let mut conn = state
            .library_db
            .lock()
            .map_err(|_| "Falha ao acessar banco de dados")?;

        // Iniciamos uma transação para ser MUITO mais rápido
        let tx = conn.transaction().map_err(|e| e.to_string())?;

        for game in games {
            tx.execute(
                "INSERT OR REPLACE INTO wishlist (
                    id, name, cover_url, store_url, store_platform,
                    current_price, normal_price, lowest_price,
                    currency, on_sale, added_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
                params![
                    game.id,
                    game.name,
                    game.cover_url,
                    game.store_url,
                    "Steam", // Forçamos a plataforma como Steam
                    game.current_price,
                    game.normal_price,
                    // Se já tivermos um lowest_price menor no banco, idealmente manteríamos,
                    // mas para simplificar o import, vamos assumir o atual.
                    // Numa v2 podemos fazer um SELECT antes para comparar.
                    game.current_price,
                    game.currency,
                    game.on_sale,
                    game.added_at
                ],
            )
            .map_err(|e| e.to_string())?;
        }

        tx.commit().map_err(|e| e.to_string())?;
        total
    };

    Ok(count)
}

/// Atualiza os preços de todos os jogos na Wishlist usando a API da ITAD.
#[tauri::command]
pub async fn refresh_prices(_app: AppHandle, state: State<'_, AppState>) -> Result<String, String> {
    // 1. Busca todos os jogos da Wishlist local
    let games_to_check: Vec<(String, String, Option<String>)> = {
        let conn = state.library_db.lock().unwrap();
        let mut stmt = conn
            .prepare("SELECT id, name, itad_id FROM wishlist")
            .unwrap();
        stmt.query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<String>>(2)?,
            ))
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect()
    };

    if games_to_check.is_empty() {
        return Ok("Lista de desejos vazia.".to_string());
    }

    // 2. Resolve IDs da ITAD (Se faltar, busca na API e salva no banco)
    let mut itad_ids_to_fetch = Vec::new();
    let mut game_map = std::collections::HashMap::new(); // Mapa itad_id -> local_id

    for (local_id, name, current_itad_id) in games_to_check {
        let final_itad_id = match current_itad_id {
            Some(id) if !id.is_empty() => {
                id // Já tem ID, usa direto
            }
            _ => {
                // Se não tem ID, busca na API (Lookup)
                info!("Buscando ID ITAD para: {}", name);
                match itad::find_game_id(&name).await {
                    Ok(found_id) => {
                        // Salva no banco para cachear e não buscar na próxima vez
                        let conn = state.library_db.lock().unwrap();
                        match conn.execute(
                            "UPDATE wishlist SET itad_id = ?1 WHERE id = ?2",
                            params![&found_id, &local_id],
                        ) {
                            Ok(_) => info!("ITAD ID salvo no banco para '{}'", name),
                            Err(e) => error!("Erro ao salvar ITAD ID: {}", e),
                        }
                        found_id
                    }
                    Err(e) => {
                        error!("Jogo '{}' não encontrado na ITAD: {}", name, e);
                        continue; // Jogo não achado na ITAD, pula
                    }
                }
            }
        };
        itad_ids_to_fetch.push(final_itad_id.clone());
        game_map.insert(final_itad_id, (local_id, name));
    }

    // 3. Busca preços em lote
    if itad_ids_to_fetch.is_empty() {
        return Ok("Nenhum jogo correspondente encontrado na ITAD.".to_string());
    }

    info!(
        "Buscando preços para {} jogos na ITAD",
        itad_ids_to_fetch.len()
    );
    let overviews = itad::get_prices(itad_ids_to_fetch).await?;
    info!("Recebidos {} resultados de preços da ITAD", overviews.len());

    let mut updated_count = 0;

    // 4. Atualiza o banco com os preços novos
    let conn = state.library_db.lock().unwrap();

    for game_data in overviews {
        if let Some((local_id, game_name)) = game_map.get(&game_data.id) {
            info!(
                "Processando preços para jogo: {} | ITAD ID: {}",
                game_name, game_data.id
            );

            // Pega a melhor oferta atual
            if let Some(deal) = game_data.current {
                let lowest = game_data.lowest.map(|l| l.price).unwrap_or(deal.price);

                info!(
                    "Atualizando preços - Jogo: {} | Preço: {} {} | Loja: {}",
                    game_name, deal.currency, deal.price, deal.shop.name
                );

                let cut = deal.cut.unwrap_or(0) as f64;
                let normal_price = if cut > 0.0 {
                    deal.price / (1.0 - (cut / 100.0))
                } else {
                    deal.price
                };
                match conn.execute(
                    "UPDATE wishlist SET
                        current_price = ?1,
                        currency = ?2,
                        lowest_price = ?3,
                        store_platform = ?4,
                        store_url = ?5,
                        on_sale = ?6,
                        normal_price = ?7,
                        voucher = ?8
                     WHERE id = ?9",
                    params![
                        deal.price,
                        deal.currency,
                        lowest,
                        deal.shop.name,
                        deal.url,
                        deal.cut > Some(0),
                        normal_price,
                        deal.voucher,
                        local_id
                    ],
                ) {
                    Ok(_) => {
                        updated_count += 1;
                    }
                    Err(e) => error!("Erro ao salvar '{}': {}", game_name, e),
                }
            } else {
                info!("Nenhuma oferta atual disponível para: {}", game_name);
            }
        } else {
            error!("ITAD ID {} não encontrado no mapa local", game_data.id);
        }
    }

    Ok(format!("Preços atualizados para {} jogos.", updated_count))
}
