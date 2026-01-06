//! Módulo de integração com as APIs Steam.
//!
//! Fornece acesso a múltiplas APIs da Steam:
//! - **Player Service API**: Biblioteca de jogos do usuário
//! - **Store API**: Detalhes, preços e busca de jogos na loja
//!
//! # Autenticação
//! Requer Steam Web API Key obtida em: https://steamcommunity.com/dev/apikey

use crate::utils::http_client::HTTP_CLIENT;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// === Estruturas da Player Service API ===

/// Jogo da biblioteca Steam de um usuário.
///
/// Contém informações básicas e tempo de jogo acumulado.
#[derive(Debug, Deserialize, Serialize)]
pub struct SteamGame {
    /// ID único do aplicativo na Steam
    pub appid: u32,
    /// Nome do jogo
    pub name: String,
    /// Tempo total jogado em minutos
    pub playtime_forever: i32,
    /// URL do ícone (hash) - requer construção completa da URL
    pub img_icon_url: Option<String>,
}

/// Envelope de dados da resposta da Player Service API.
#[derive(Debug, Deserialize, Serialize)]
struct SteamResponseData {
    game_count: u32,
    games: Vec<SteamGame>,
}

/// Resposta completa da API GetOwnedGames.
#[derive(Debug, Deserialize, Serialize)]
struct SteamApiResponse {
    response: SteamResponseData,
}

// === Estruturas da Store API ===

/// Gênero de um jogo na Steam Store.
#[derive(Debug, Deserialize)]
pub struct StoreGenre {
    pub description: String,
}

/// Data de lançamento de um jogo.
#[derive(Debug, Deserialize)]
pub struct StoreReleaseDate {
    pub date: String,
}

/// Informações de preço e descontos.
///
/// Preços são retornados em centavos (ex: 5999 = R$ 59,99).
#[derive(Debug, Deserialize)]
pub struct StorePriceOverview {
    pub currency: String,
    #[allow(dead_code)]
    pub initial: i64,
    /// Preço final após desconto (em centavos)
    #[serde(rename = "final")]
    pub final_price: i64,
    /// Percentual de desconto (0-100)
    #[serde(rename = "discount_percent")]
    pub discount_percent: i32,
}

/// Detalhes completos de um jogo na Store API.
#[derive(Debug, Deserialize)]
pub struct StoreGameDetails {
    pub short_description: Option<String>,
    pub genres: Option<Vec<StoreGenre>>,
    pub release_date: Option<StoreReleaseDate>,
    pub price_overview: Option<StorePriceOverview>,
}

/// Envelope de resposta da Store API.
#[derive(Debug, Deserialize)]
pub struct StoreAppResponse {
    pub success: bool,
    pub data: Option<StoreGameDetails>,
}

/// Dados processados de um jogo (uso interno).
#[allow(dead_code)]
pub struct ProcessedGameData {
    pub genre: String,
    pub description: String,
    pub release_date: String,
}

/// Preço processado de um jogo (formato amigável).
#[derive(Debug)]
pub struct SteamPrice {
    pub currency: String,
    /// Preço em formato decimal (ex: 59.99)
    pub final_price: f64,
    pub discount_percent: i32,
}

/// Item de resultado de busca na loja.
#[derive(Debug, Deserialize, Serialize)]
pub struct StoreSearchItem {
    pub id: u32,
    pub name: String,
    pub tiny_image: Option<String>,
}

/// Resposta da API de busca da Store.
#[derive(Debug, Deserialize)]
struct StoreSearchResponse {
    #[allow(dead_code)]
    total: u32,
    /// Pode ser null se nenhum resultado for encontrado
    items: Option<Vec<StoreSearchItem>>,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct SteamSearchItem {
    pub id: String,
    pub name: String,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct SteamSearchResult {
    pub items: Vec<SteamSearchItem>,
}

/// Lista todos os jogos da biblioteca de um usuário Steam.
///
/// Utiliza a API `IPlayerService/GetOwnedGames` para obter a lista completa
/// de jogos possuídos, incluindo jogos gratuitos jogados.
///
/// # Parâmetros
/// * `api_key` - Steam Web API Key
/// * `steam_id` - Steam ID do usuário (formato SteamID64)
///
/// # Privacidade
/// O perfil do usuário deve estar público ou o API key deve ter permissões
/// adequadas para acessar a biblioteca.
///
/// # Retorna
/// * `Ok(Vec<SteamGame>)` - Lista de jogos com tempo de jogo
/// * `Err(String)` - Erro de rede, autenticação ou perfil privado
///
/// # Exemplo
/// ```rust
/// let games = list_steam_games("API_KEY", "76561198012345678").await?;
/// for game in games {
///     println!("{} - {}h jogadas", game.name, game.playtime_forever / 60);
/// }
/// ```
pub async fn list_steam_games(api_key: &str, steam_id: &str) -> Result<Vec<SteamGame>, String> {
    let url = format!(
        "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key={}&steamid={}&format=json&include_appinfo=true&include_played_free_games=true",
        api_key, steam_id
    );

    println!("Buscando jogos na Steam..."); // Log para debug

    let res = HTTP_CLIENT
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Erro na requisição: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("Erro na API Steam: Código {}", res.status()));
    }

    let api_data: SteamApiResponse = res
        .json()
        .await
        .map_err(|e| format!("Erro ao ler JSON da Steam: {}", e))?;

    println!(
        "Sucesso! Encontrados {} jogos.",
        api_data.response.game_count
    );

    Ok(api_data.response.games)
}

/// Busca metadados detalhados de um jogo específico.
///
/// Utiliza a Store API para obter gênero, descrição e data de lançamento.
/// A API retorna dados em português brasileiro quando disponível.
///
/// # Parâmetros
/// * `app_id` - Steam App ID do jogo
///
/// # Retorna
/// * `Ok(ProcessedGameData)` - Dados processados do jogo
/// * `Err(String)` - Jogo não encontrado ou dados indisponíveis
///
/// # Observações
/// - Retorna apenas o primeiro gênero se múltiplos existirem
/// - Usa "Desconhecido" como fallback para gênero
/// - Strings vazias são retornadas se dados opcionais não existirem
pub async fn fetch_game_metadata(app_id: u32) -> Result<ProcessedGameData, String> {
    let url = format!(
        "https://store.steampowered.com/api/appdetails?appids={}&l=brazilian",
        app_id
    );

    let res: HashMap<String, StoreAppResponse> = HTTP_CLIENT
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    if let Some(entry) = res.get(&app_id.to_string()) {
        if entry.success {
            if let Some(data) = &entry.data {
                // Pega o primeiro gênero da lista ou "Desconhecido"
                let genre = data
                    .genres
                    .as_ref()
                    .and_then(|g| g.first())
                    .map(|g| g.description.clone())
                    .unwrap_or("Desconhecido".to_string());

                let description = data.short_description.clone().unwrap_or_default();
                let release = data
                    .release_date
                    .as_ref()
                    .map(|r| r.date.clone())
                    .unwrap_or_default();

                return Ok(ProcessedGameData {
                    genre,
                    description,
                    release_date: release,
                });
            }
        }
    }

    Err("Dados não encontrados".to_string())
}

/// Busca o Steam App ID de um jogo pelo nome (não implementado ativamente).
///
/// **Nota**: Esta função existe mas não é usada ativamente. Use `search_store()`
/// para funcionalidade completa de busca.
///
/// # Parâmetros
/// * `game_name` - Nome do jogo para buscar
///
/// # Retorna
/// * `Ok(Some(u32))` - App ID encontrado
/// * `Ok(None)` - Nenhum resultado encontrado
/// * `Err(String)` - Erro na requisição
#[allow(dead_code)]
pub async fn search_steam_app_id(game_name: &str) -> Result<Option<u32>, String> {
    // API oficial de busca da loja Steam
    let url = format!(
        "https://store.steampowered.com/api/storesearch/?term={}&l=english&cc=BR",
        urlencoding::encode(game_name)
    );

    let res = HTTP_CLIENT
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Ok(None);
    }

    let data: StoreSearchResponse = res
        .json()
        .await
        .map_err(|e| format!("Erro ao decodificar JSON da busca: {}", e))?;

    if let Some(items) = data.items {
        if let Some(first) = items.first() {
            return Ok(Some(first.id));
        }
    }

    Ok(None)
}

/// Busca informações de preço de um jogo.
///
/// Retorna preço atual, moeda e percentual de desconto (se houver).
/// Preços são retornados em reais (BRL) para região brasileira.
///
/// # Parâmetros
/// * `app_id` - Steam App ID do jogo
///
/// # Retorna
/// * `Ok(Some(SteamPrice))` - Preço encontrado e convertido
/// * `Ok(None)` - Jogo gratuito ou sem preço disponível
/// * `Err(String)` - Erro na requisição
///
/// # Conversão
/// O preço é automaticamente convertido de centavos para formato decimal:
/// - API retorna: 5999 (centavos)
/// - Função retorna: 59.99 (reais)
///
/// # Exemplo
/// ```rust
/// if let Some(price) = fetch_price(730).await? {
///     println!("Preço: {} {}", price.currency, price.final_price);
///     if price.discount_percent > 0 {
///         println!("Desconto de {}%!", price.discount_percent);
///     }
/// }
/// ```
pub async fn fetch_price(app_id: u32) -> Result<Option<SteamPrice>, String> {
    let url = format!(
        "https://store.steampowered.com/api/appdetails?appids={}&cc=br&l=brazilian&filters=price_overview",
        app_id
    );

    let res: HashMap<String, StoreAppResponse> = HTTP_CLIENT
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    if let Some(entry) = res.get(&app_id.to_string()) {
        if entry.success {
            if let Some(data) = &entry.data {
                if let Some(overview) = &data.price_overview {
                    return Ok(Some(SteamPrice {
                        currency: overview.currency.clone(),
                        final_price: overview.final_price as f64 / 100.0,
                        discount_percent: overview.discount_percent,
                    }));
                }
            }
        }
    }

    Ok(None)
}

/// Busca jogos na loja Steam por termo de pesquisa.
///
/// Retorna lista de resultados para exibição em interface de seleção.
/// Útil para implementar modais de busca e adição manual de jogos.
///
/// # Parâmetros
/// * `query` - Termo de busca (nome do jogo, palavra-chave, etc.)
///
/// # Retorna
/// * `Ok(Vec<StoreSearchItem>)` - Lista de resultados (vazia se nada encontrado)
/// * `Err(String)` - Erro na requisição ou decodificação JSON
///
/// # Uso
/// Ideal para implementar funcionalidade de "Adicionar Jogo Manualmente"
/// onde o usuário busca e seleciona de uma lista de resultados.
///
/// # Exemplo
/// ```rust
/// let results = search_store("cyberpunk").await?;
/// for item in results {
///     println!("[{}] {}", item.id, item.name);
/// }
/// ```
pub async fn search_store(query: &str) -> Result<Vec<StoreSearchItem>, String> {
    let url = format!(
        "https://store.steampowered.com/api/storesearch/?term={}&l=english&cc=BR",
        urlencoding::encode(query)
    );

    let res = HTTP_CLIENT
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Ok(Vec::new());
    }

    let data: StoreSearchResponse = res.json().await.map_err(|e| format!("Erro JSON: {}", e))?;

    Ok(data.items.unwrap_or_default())
}
