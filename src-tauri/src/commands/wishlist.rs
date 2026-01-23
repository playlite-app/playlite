//! Módulo de gerenciamento de lista de desejos (wishlist).
//!
//! Adaptado para v2.0 com integração IsThereAnyDeal.
//! Centraliza a importação via arquivos JSON (Steam e ITAD).

use crate::constants::RAWG_RATE_LIMIT_MS;
use crate::database::{self, AppState};
use crate::models::WishlistGame;
use crate::services::{itad, rawg, steam};
use chrono::NaiveDate;
use rusqlite::{params, Connection};
use serde::Deserialize;
use std::fs;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::time::sleep;
use tracing::{error, info};

// Adaptador local para retorno de busca (compatível com frontend)
#[derive(serde::Serialize)]
pub struct SearchResult {
    pub id: String,
    pub name: String,
    pub cover_url: Option<String>,
}

// === LÓGICA DE INSERÇÃO COMPARTILHADA ===

/// Função auxiliar privada que contém o SQL de inserção.
/// Aceita uma conexão (ou transação) já aberta.
fn insert_game_internal(conn: &Connection, game: &WishlistGame) -> Result<(), rusqlite::Error> {
    conn.execute(
        "INSERT OR REPLACE INTO wishlist (
            id, name, cover_url, store_url, store_platform,
            current_price, normal_price, lowest_price,
            currency, on_sale, voucher, itad_id, added_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![
            game.id,
            game.name,
            game.cover_url,
            game.store_url,
            game.store_platform,
            game.current_price,
            game.normal_price,
            game.lowest_price,
            game.currency,
            game.on_sale,
            game.voucher,
            game.itad_id,
            game.added_at
        ],
    )?;
    Ok(())
}

// === IMPORTAÇÃO POR ARQUIVOS EXTERNOS (Steam e ITAD) ===

#[derive(Deserialize)]
struct SteamExportRoot {
    data: Vec<SteamExportItem>,
}

#[derive(Deserialize)]
struct SteamExportItem {
    title: String,
    gameid: Vec<String>,        // ex: ["steam", "app/7520"]
    price: Option<String>,      // ex: "R$ 73,99"
    added_date: Option<String>, // ex: "26/12/2022"
    release_date: Option<String>,
}

#[derive(Deserialize)]
struct ItadExportRoot {
    data: ItadDataWrapper,
}

#[derive(Deserialize)]
struct ItadDataWrapper {
    data: Vec<ItadGroup>,
}

#[derive(Deserialize)]
struct ItadGroup {
    games: Vec<ItadGame>,
}

#[derive(Deserialize)]
struct ItadGame {
    id: String, // UUID do ITAD
    title: String,
    added: i64, // Timestamp Unix
}

// funções auxiliares de parsing

fn parse_steam_price(price_str: Option<&String>) -> Option<f64> {
    // Remove "R$", espaços e troca vírgula por ponto
    price_str.as_ref().and_then(|s| {
        let clean = s.replace("R$", "").replace(' ', "").replace(',', ".");
        clean.parse::<f64>().ok()
    })
}

fn parse_steam_date(date_str: Option<&String>) -> String {
    if let Some(s) = date_str {
        // Tenta DD/MM/YYYY
        if let Ok(date) = NaiveDate::parse_from_str(s, "%d/%m/%Y") {
            if let Some(datetime) = date.and_hms_opt(0, 0, 0) {
                return datetime.and_utc().to_rfc3339();
            }
        }
    }
    chrono::Utc::now().to_rfc3339()
}

/// Tenta processar o conteúdo como exportação da Steam
fn parse_steam_wishlist(content: &str) -> Option<Vec<WishlistGame>> {
    let export: SteamExportRoot = serde_json::from_str(content).ok()?;
    let mut games = Vec::new();

    for item in export.data {
        // Extrai ID da Steam ("app/7520" -> "7520")
        let app_id = item
            .gameid
            .get(1)
            .and_then(|s| s.strip_prefix("app/"))
            .unwrap_or("0")
            .to_string();

        let price = parse_steam_price(item.price.as_ref());

        // Steam Export não tem imagem direta, monta a URL padrão
        let cover_url = format!(
            "https://cdn.akamai.steamstatic.com/steam/apps/{}/header.jpg",
            app_id
        );

        games.push(WishlistGame {
            id: app_id.clone(),
            name: item.title,
            cover_url: Some(cover_url),
            store_url: Some(format!("https://store.steampowered.com/app/{}", app_id)),
            store_platform: Some("Steam".to_string()),
            itad_id: None,
            current_price: price,
            normal_price: price,
            lowest_price: price,
            currency: Some("BRL".to_string()),
            on_sale: false,
            voucher: None,
            added_at: Some(parse_steam_date(item.added_date.as_ref())),
        });
    }
    Some(games)
}

/// Tenta processar o conteúdo como exportação da ITAD (IsThereAnyDeal)
fn parse_itad_wishlist(content: &str) -> Option<Vec<WishlistGame>> {
    let export: ItadExportRoot = serde_json::from_str(content).ok()?;
    let mut games = Vec::new();

    for group in export.data.data {
        for item in group.games {
            // Conversão de data Unix
            let added_at = chrono::DateTime::from_timestamp(item.added, 0)
                .map(|dt| dt.to_rfc3339())
                .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());

            games.push(WishlistGame {
                id: item.id, // Usa o UUID da ITAD como ID
                name: item.title,
                cover_url: None, // ITAD export não tem capa, frontend deve mostrar placeholder
                store_url: None,
                store_platform: Some("ITAD".to_string()),
                itad_id: None,
                current_price: None,
                normal_price: None,
                lowest_price: None,
                currency: Some("BRL".to_string()),
                on_sale: false,
                voucher: None,
                added_at: Some(added_at),
            });
        }
    }
    Some(games)
}

/// Importa wishlist a partir de um arquivo JSON local (Steam ou ITAD)
#[tauri::command]
pub async fn import_wishlist(
    state: State<'_, AppState>,
    file_path: String,
) -> Result<usize, String> {
    // 1. Lê o arquivo
    let content =
        fs::read_to_string(&file_path).map_err(|e| format!("Erro ao ler arquivo: {}", e))?;

    // 2. Tenta detectar o formato usando os parsers do steam.rs e wishlist logic
    let games = if let Some(steam_games) = parse_steam_wishlist(&content) {
        steam_games
    } else if let Some(itad_games) = parse_itad_wishlist(&content) {
        itad_games
    } else {
        return Err("Formato de arquivo não reconhecido.".to_string());
    };

    let total = games.len();
    if total == 0 {
        return Ok(0);
    }

    // 3. Salva no banco
    {
        let mut conn = state.library_db.lock().map_err(|_| "Falha no DB")?;
        let tx = conn.transaction().map_err(|e| e.to_string())?;

        for game in games {
            insert_game_internal(&tx, &game).map_err(|e| e.to_string())?;
        }
        tx.commit().map_err(|e| e.to_string())?;
    }

    Ok(total)
}

/// Função para buscar capas faltantes na RAWG para jogos na Wishlist.
/// Executa em background para não travar a interface.
#[tauri::command]
pub async fn fetch_wishlist_covers(app: AppHandle) -> Result<(), String> {
    // 1. Pega a API Key
    let api_key = database::get_secret(&app, "rawg_api_key")?;
    if api_key.is_empty() {
        return Err("API Key da RAWG não configurada.".to_string());
    }

    // 2. Executa em background para não travar a interface
    tauri::async_runtime::spawn(async move {
        let state: State<AppState> = app.state();

        // A. Busca quais jogos estão sem capa
        let missing_covers: Vec<(String, String)> = {
            let conn = state.library_db.lock().unwrap();
            let mut stmt = conn
                .prepare("SELECT id, name FROM wishlist WHERE cover_url IS NULL OR cover_url = ''")
                .unwrap();

            stmt.query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
                .unwrap()
                .flatten()
                .collect()
        };

        if missing_covers.is_empty() {
            return;
        }

        let mut updated_count = 0;

        // B. Itera e busca na RAWG (Reaproveitando a lógica do search_wishlist_game)
        for (id, name) in missing_covers {
            // AQUI ESTÁ O REAPROVEITAMENTO: Chamamos o serviço rawg::search_games direto
            match rawg::search_games(&api_key, &name).await {
                Ok(results) => {
                    // Pega o primeiro resultado que tenha imagem
                    if let Some(first_match) = results.iter().find(|g| g.background_image.is_some())
                    {
                        if let Some(cover) = &first_match.background_image {
                            let conn = state.library_db.lock().unwrap();
                            if conn
                                .execute(
                                    "UPDATE wishlist SET cover_url = ?1 WHERE id = ?2",
                                    params![cover, id],
                                )
                                .is_ok()
                            {
                                updated_count += 1;
                            }
                        }
                    }
                }
                Err(e) => error!("Erro RAWG para '{}': {}", name, e),
            }

            // Respeita o limite da API (importante!)
            sleep(Duration::from_millis(RAWG_RATE_LIMIT_MS)).await;
        }

        // C. Log resumido e avisa o frontend
        if updated_count > 0 {
            info!("✓ {} capas atualizadas", updated_count);
        }
        let _ = app.emit("wishlist_updated", ());
    });

    Ok(())
}

// === GERENCIAMENTO DA WISHLIST (CRUD e Preços) ===

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
    let game = WishlistGame {
        id,
        name,
        cover_url,
        store_url,
        store_platform: None,
        itad_id,
        current_price,
        normal_price: current_price,
        lowest_price: current_price,
        currency: Some("BRL".to_string()),
        on_sale: false,
        voucher: None,
        added_at: Some(chrono::Utc::now().to_rfc3339()),
    };

    let conn = state.library_db.lock().map_err(|_| "Mutex error")?;

    match insert_game_internal(&conn, &game) {
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
                match itad::find_game_id(&name).await {
                    Ok(found_id) => {
                        // Salva no banco para cachear e não buscar na próxima vez
                        let conn = state.library_db.lock().unwrap();
                        let _ = conn.execute(
                            "UPDATE wishlist SET itad_id = ?1 WHERE id = ?2",
                            params![&found_id, &local_id],
                        );
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

    let overviews = itad::get_prices(itad_ids_to_fetch).await?;

    let mut updated_count = 0;

    // 4. Atualiza o banco com os preços novos
    let conn = state.library_db.lock().unwrap();

    for game_data in overviews {
        if let Some((local_id, _game_name)) = game_map.get(&game_data.id) {
            // Pega a melhor oferta atual
            if let Some(deal) = game_data.current {
                let lowest = game_data.lowest.map(|l| l.price).unwrap_or(deal.price);

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
                    Err(e) => error!("Erro ao salvar preço: {}", e),
                }
            }
        } else {
            error!("ITAD ID {} não encontrado no mapa local", game_data.id);
        }
    }

    if updated_count > 0 {
        info!("✓ {} preços atualizados", updated_count);
    }

    Ok(format!("✓ {} preços atualizados", updated_count))
}
