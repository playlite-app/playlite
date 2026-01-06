//! Módulo de gerenciamento de lista de desejos (wishlist).
//!
//! Implementa funcionalidades para rastreamento de jogos desejados,
//! incluindo busca, adição, remoção e monitoramento automático de preços.
//!
//! # Funcionalidades Principais
//! - Busca de jogos na loja Steam
//! - Adição/remoção de itens da wishlist
//! - Busca de preços
//! - Atualização de preços via Steam Store API
//! - Auto-healing de Steam App IDs faltantes
//!
//! # Monitoramento de Preços
//! A função `refresh_prices` atualiza:
//! - Preços atuais em BRL
//! - Status de promoção (on_sale)
//! - URLs diretas para loja

use crate::database::AppState;
use crate::models::WishlistGame;
use crate::services::steam::{self, StoreSearchItem};
use rusqlite::params;
use std::time::Duration;
use tauri::State;
use tokio::time::sleep;
use tracing::{error, info};

/// Busca jogos na loja Steam por termo de pesquisa.
///
/// Retorna lista de resultados da Steam Store para seleção pelo usuário.
/// Usado no modal de "Adicionar à Wishlist".
///
/// # Parâmetros
/// * `query` - Termo de busca (nome do jogo, palavra-chave, etc.)
///
/// # Retorna
/// * `Ok(Vec<StoreSearchItem>)` - Lista de jogos encontrados (vazia se nenhum)
/// * `Err(String)` - Erro na comunicação com Steam Store API
///
/// # Exemplo de Uso
/// ```rust
/// const results = await invoke('search_wishlist_game', {
///     query: 'cyberpunk'
/// });
///
/// // Mostrar resultados em modal de seleção
/// results.forEach(game => {
///     console.log(`${game.name} (ID: ${game.id})`);
/// });
/// ```
///
/// # Observação
/// Esta é uma busca direta na Store, não requer autenticação.
/// Retorna jogos de todas as regiões, mas priorizados para região BR.
#[tauri::command]
pub async fn search_wishlist_game(query: String) -> Result<Vec<StoreSearchItem>, String> {
    steam::search_store(&query).await
}

/// Adiciona um jogo à lista de desejos.
///
/// Insere ou atualiza um jogo na wishlist com informações básicas.
/// Usa `INSERT OR REPLACE` para permitir re-adicionar jogos removidos.
///
/// # Parâmetros
/// * `state` - Estado compartilhado com conexão do banco
/// * `id` - ID único do jogo (geralmente combinação de store+app_id)
/// * `name` - Nome do jogo
/// * `cover_url` - URL da imagem de capa (opcional)
/// * `store_url` - URL para página do jogo na loja (opcional)
/// * `current_price` - Preço atual em reais (opcional)
/// * `steam_app_id` - Steam App ID para rastreamento de preços (opcional)
///
/// # Retorna
/// * `Ok(String)` - Mensagem de sucesso
/// * `Err(String)` - Erro ao acessar banco ou inserir dados
///
/// # Comportamento
/// - **INSERT OR REPLACE**: Substitui se ID já existir
/// - **added_at**: Definido automaticamente como CURRENT_TIMESTAMP
/// - **Logging detalhado**: Info para sucessos, Error para falhas
///
/// # Exemplo de Uso
/// ```rust
/// await invoke('add_to_wishlist', {
///     id: 'steam_1091500',
///     name: 'Cyberpunk 2077',
///     coverUrl: 'https://...',
///     storeUrl: 'https://store.steampowered.com/app/1091500/',
///     currentPrice: 199.99,
///     steamAppId: 1091500
/// });
/// ```
///
/// # Rastreamento de Preços
/// Se `steam_app_id` for fornecido, o jogo pode ter preços atualizados via `refresh_prices()`.
///
/// # Logging
/// Registra tentativas e resultados para facilitar debugging de problemas de inserção ou conflitos de ID.
#[tauri::command]
pub fn add_to_wishlist(
    state: State<AppState>,
    id: String,
    name: String,
    cover_url: Option<String>,
    store_url: Option<String>,
    current_price: Option<f64>,
    steam_app_id: Option<i32>,
) -> Result<String, String> {
    info!(
        "Tentando adicionar à Wishlist: ID={}, Nome={}, SteamID={:?}",
        id, name, steam_app_id
    );

    let conn = state.db.lock().map_err(|e| {
        error!("Erro de Mutex na Wishlist: {}", e);
        "Falha interna ao acessar banco".to_string()
    })?;

    // Tenta inserir e loga o resultado exato
    match conn.execute(
        "INSERT OR REPLACE INTO wishlist (id, name, cover_url, store_url, current_price, steam_app_id, added_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, CURRENT_TIMESTAMP)",
        params![id, name, cover_url, store_url, current_price, steam_app_id],
    ) {
        Ok(_) => {
            info!("Sucesso: Jogo {} adicionado à wishlist.", name);
            Ok("Jogo adicionado à lista de desejos!".to_string())
        },
        Err(e) => {
            error!("Erro SQL ao adicionar {}: {:?}", name, e);
            Err(format!("Erro de banco de dados: {}", e))
        }
    }
}

/// Remove um jogo da lista de desejos.
///
/// # Parâmetros
/// * `state` - Estado compartilhado com conexão do banco
/// * `id` - ID do jogo a ser removido
///
/// # Retorna
/// * `Ok(String)` - Mensagem de confirmação
/// * `Err(String)` - Erro ao acessar banco
///
/// # Comportamento
/// - Não retorna erro se ID não existir (DELETE silencioso)
/// - Remove apenas da wishlist, não afeta biblioteca principal
///
/// # Exemplo de Uso
/// ```rust
/// await invoke('remove_from_wishlist', {
///     id: 'steam_1091500'
/// });
/// ```
#[tauri::command]
pub fn remove_from_wishlist(state: State<AppState>, id: String) -> Result<String, String> {
    let conn = state.db.lock().map_err(|_| "Falha ao bloquear mutex")?;

    conn.execute("DELETE FROM wishlist WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok("Jogo removido da lista de desejos.".to_string())
}

/// Recupera todos os jogos da lista de desejos.
///
/// Retorna a wishlist completa ordenada por data de adição (mais recentes primeiro).
///
/// # Parâmetros
/// * `state` - Estado compartilhado com conexão do banco
///
/// # Retorna
/// * `Ok(Vec<WishlistGame>)` - Lista completa da wishlist
/// * `Err(String)` - Erro ao acessar banco ou mapear dados
///
/// # Ordenação
/// Jogos são retornados em ordem decrescente de `added_at` (mais novos primeiro).
///
/// # Exemplo de Uso
/// ```rust
/// const wishlist = await invoke('get_wishlist');
/// wishlist.forEach(game => {
///     if (game.on_sale) {
///         console.log(`${game.name} está em promoção!`);
///     }
/// });
/// ```
///
/// # Campos Retornados
/// Cada item contém:
/// - Identificação: id, name, cover_url
/// - Loja: store_url, steam_app_id
/// - Preços: current_price, lowest_price, localized_price/currency
/// - Status: on_sale, added_at
#[tauri::command]
pub fn get_wishlist(state: State<AppState>) -> Result<Vec<WishlistGame>, String> {
    let conn = state.db.lock().map_err(|_| "Falha ao bloquear mutex")?;

    let mut stmt = conn
        .prepare("SELECT id, name, cover_url, store_url, current_price, lowest_price, on_sale, localized_price, localized_currency, steam_app_id, added_at FROM wishlist ORDER BY added_at DESC")
        .map_err(|e| e.to_string())?;

    let games_iter = stmt
        .query_map([], |row| {
            Ok(WishlistGame {
                id: row.get(0)?,
                name: row.get(1)?,
                cover_url: row.get(2)?,
                store_url: row.get(3)?,
                current_price: row.get(4)?,
                lowest_price: row.get(5)?,
                on_sale: row.get(6)?,
                localized_price: row.get(7)?,
                localized_currency: row.get(8)?,
                steam_app_id: row.get(9)?,
                added_at: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut games = Vec::new();
    for game in games_iter {
        games.push(game.map_err(|e| e.to_string())?);
    }

    Ok(games)
}

/// Verifica se um jogo está na lista de desejos.
///
/// Consulta rápida para verificar presença na wishlist, útil para
/// atualizar UI (ex: mudar ícone de "adicionar" para "remover").
///
/// # Parâmetros
/// * `state` - Estado compartilhado com conexão do banco
/// * `id` - ID do jogo a verificar
///
/// # Retorna
/// * `Ok(true)` - Jogo está na wishlist
/// * `Ok(false)` - Jogo não está na wishlist
/// * `Err(String)` - Erro ao acessar banco
///
/// # Exemplo de Uso
/// ```rust
/// const isInWishlist = await invoke('check_wishlist_status', {
///     id: 'steam_1091500'
/// });
///
/// // Atualizar botão
/// button.textContent = isInWishlist ? 'Na Wishlist' : 'Adicionar';
/// ```
#[tauri::command]
pub fn check_wishlist_status(state: State<AppState>, id: String) -> Result<bool, String> {
    let conn = state.db.lock().map_err(|_| "Falha ao bloquear mutex")?;

    let count: i32 = conn
        .query_row(
            "SELECT COUNT(1) FROM wishlist WHERE id = ?1",
            params![id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    Ok(count > 0)
}

/// Atualiza preços dos jogos da wishlist.
///
/// Operação em lote que consulta a Steam Store API para cada jogo
/// e atualiza informações de preço, desconto e URLs.
///
/// # Processo
/// 1. Busca todos os jogos da wishlist
/// 2. Para cada jogo:
///    - Verifica se tem Steam App ID
///    - Se não tem, tenta descobrir via busca (auto-healing)
///    - Consulta preço atual na Steam Store API
///    - Atualiza banco com novos dados
///    - Aguarda 500ms (rate limiting)
///
/// # Parâmetros
/// * `state` - Estado compartilhado com conexão do banco
///
/// # Retorna
/// * `Ok(String)` - Mensagem com contador de atualizações
/// * `Err(String)` - Erro crítico de banco ou sistema
///
/// # Rate Limiting
/// Aguarda 500ms entre cada requisição para respeitar limites da
/// Steam Store API e evitar bloqueio temporário.
///
/// # Auto-Healing
/// Se um jogo não tem `steam_app_id`, o sistema tenta descobrir
/// automaticamente fazendo busca pelo nome e associando o primeiro resultado.
///
/// # Campos Atualizados
/// - `localized_price`: Preço em BRL
/// - `localized_currency`: Moeda (BRL)
/// - `on_sale`: Boolean indicando se está em promoção
/// - `store_url`: URL atualizada da página do jogo
/// - `lowest_price`: Mantém o menor preço já registrado (usando MIN SQL)
/// - `steam_app_id`: Preenchido automaticamente se estava faltando
///
/// # Nota
/// - Operação naturalmente lenta devido ao rate limiting obrigatório.
///
/// # Exemplo de Uso
/// ```rust
/// // Iniciar atualização (operação longa)
/// const result = await invoke('refresh_prices');
/// console.log(result); // "Preços atualizados: 23/25"
///
/// // Recarregar wishlist para mostrar novos preços
/// const updated = await invoke('get_wishlist');
/// ```
///
/// # Tratamento de Erros
/// Erros individuais não interrompem o processo. Se um jogo falhar:
/// - Mantém dados existentes
/// - Imprime mensagem no console
/// - Continua para próximo jogo
///
/// # SQL Especial
/// Usa `MIN(IFNULL(lowest_price, 9999), preço_novo)` para garantir
/// que o menor preço histórico nunca aumenta, apenas diminui.
///
/// # Observações
/// - Jogos sem Steam App ID que não são encontrados na busca são ignorados
#[tauri::command]
pub async fn refresh_prices(state: State<'_, AppState>) -> Result<String, String> {
    // Busca dados básicos do banco
    let games: Vec<(String, Option<i32>, String)> = {
        let conn = state.db.lock().map_err(|_| "Falha ao bloquear mutex")?;
        let mut stmt = conn
            .prepare("SELECT id, steam_app_id, name FROM wishlist")
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)))
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;
        rows
    };

    let total = games.len();
    let mut updated_count = 0;

    for (id, steam_app_id, name) in games {
        let mut current_app_id = steam_app_id;

        // Se não tem AppID, tenta descobrir pelo nome (Auto-healing)
        if current_app_id.is_none() {
            // Nota: search_store retorna lista, pegamos o primeiro para auto-healing
            if let Ok(results) = steam::search_store(&name).await {
                if let Some(first) = results.first() {
                    current_app_id = Some(first.id as i32);
                    let conn = state.db.lock().map_err(|_| "Falha mutex")?;
                    let _ = conn.execute(
                        "UPDATE wishlist SET steam_app_id = ?1 WHERE id = ?2",
                        params![current_app_id, &id],
                    );
                }
            }
        }

        // Busca Preço na Steam
        if let Some(app_id_val) = current_app_id {
            match steam::fetch_price(app_id_val as u32).await {
                Ok(Some(price)) => {
                    let conn = state.db.lock().map_err(|_| "Falha mutex")?;
                    let on_sale = price.discount_percent > 0;

                    // URL da loja Steam para o botão "Ir para Loja"
                    let store_url = format!("https://store.steampowered.com/app/{}/", app_id_val);

                    // Atualiza BRL
                    let _ = conn.execute(
                        "UPDATE wishlist
                            SET localized_price = ?1, localized_currency = ?2,
                                on_sale = ?3, store_url = ?4,
                                lowest_price = MIN(IFNULL(lowest_price, 9999), ?1)
                            WHERE id = ?5",
                        params![price.final_price, price.currency, on_sale, store_url, id],
                    );
                    updated_count += 1;
                }
                Ok(None) => {
                    println!("Jogo indisponível na loja BR: {}", name);
                }
                Err(_) => {}
            }
        }

        sleep(Duration::from_millis(500)).await;
    }

    Ok(format!("Preços atualizados: {}/{}", updated_count, total))
}
