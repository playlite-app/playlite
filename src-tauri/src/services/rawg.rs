//! Módulo de integração com a API RAWG.
//!
//! Fornece funcionalidades para buscar informações sobre jogos, incluindo
//! tendências, detalhes específicos e lançamentos futuros.
//!
//! A RAWG é um banco de dados abrangente de jogos que fornece metadados,
//! ratings, gêneros e outras informações relevantes.

use crate::utils::http_client::HTTP_CLIENT;
use chrono::Datelike;
use serde::{Deserialize, Serialize};

// === Estruturas de Dados ===

#[derive(Debug, Serialize, Deserialize)]
pub struct RawgTag {
    pub id: i32,
    pub name: String,
    pub slug: String,
    pub language: Option<String>,
    pub games_count: i32,
    pub image_background: Option<String>,
}
#[derive(Debug, Serialize, Deserialize)]
pub struct RawgDeveloper {
    pub id: i32,
    pub name: String,
    pub slug: String,
}
#[derive(Debug, Serialize, Deserialize)]
pub struct RawgPublisher {
    pub id: i32,
    pub name: String,
    pub slug: String,
}
#[derive(Debug, Deserialize, Serialize)]
pub struct RawgGenre {
    pub name: String,
}

// === NOVAS STRUCTS PARA LOJAS ===
#[derive(Debug, Serialize, Deserialize)]
pub struct StoreInfo {
    pub id: i32,
    pub name: String,
    pub slug: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StoreWrapper {
    pub id: i32,
    pub url: String,
    pub store: StoreInfo,
}
// ===============================

/// Detalhes completos de um jogo na RAWG.
///
/// Inclui informações expandidas como descrição, metacritic score, desenvolvedoras e tags.
#[derive(Debug, Serialize, Deserialize)]
pub struct GameDetails {
    pub id: i32,
    pub name: String,
    #[serde(rename(deserialize = "description_raw", serialize = "descriptionRaw"))]
    pub description_raw: Option<String>,
    pub metacritic: Option<i32>,
    pub website: Option<String>,
    pub released: Option<String>,
    pub background_image: Option<String>,
    #[serde(default)]
    pub genres: Vec<RawgGenre>,
    #[serde(default)]
    pub tags: Vec<RawgTag>,
    #[serde(default)]
    pub developers: Vec<RawgDeveloper>,
    #[serde(default)]
    pub publishers: Vec<RawgPublisher>,
    #[serde(default)]
    pub reddit_url: Option<String>, // <--- ADICIONAR ESTE
    #[serde(default)]
    pub metacritic_url: Option<String>, // <--- ADICIONAR ESTE,

    // === CAMPO NOVO ===
    #[serde(default)]
    pub stores: Vec<StoreWrapper>, // Lista de lojas onde o jogo vende
}

/// Representação básica de um jogo na RAWG.
///
/// Contém informações essenciais para listagens e busca.
#[derive(Debug, Deserialize, Serialize)]
pub struct RawgGame {
    pub id: u32,
    pub name: String,
    #[serde(rename(deserialize = "background_image", serialize = "backgroundImage"))]
    pub background_image: Option<String>,
    pub rating: f32,
    pub released: Option<String>,
    pub genres: Vec<RawgGenre>,
    #[serde(default)]
    pub tags: Vec<RawgTag>,
    pub slug: String,
}

/// Resposta da API RAWG para listagens de jogos.
#[derive(Debug, Deserialize, Serialize)]
struct RawgResponse {
    results: Vec<RawgGame>,
}

// === Funções de API ===

/// Busca jogos por texto (Nome, Série, etc).
///
/// Substitui a busca da Steam Store na Wishlist e adição manual.
pub async fn search_games(api_key: &str, query: &str) -> Result<Vec<RawgGame>, String> {
    let url = format!(
        "https://api.rawg.io/api/games?key={}&search={}&page_size=10",
        api_key,
        urlencoding::encode(query)
    );

    let res = HTTP_CLIENT
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Erro RAWG Search: {}", res.status()));
    }

    let data: RawgResponse = res.json().await.map_err(|e| e.to_string())?;
    Ok(data.results)
}

/// Busca os jogos mais populares do momento ('trending games').
///
/// Retorna até 20 jogos lançados entre o ano passado e o ano atual,
/// ordenados por popularidade (adições recentes).
pub async fn fetch_trending_games(api_key: &str) -> Result<Vec<RawgGame>, String> {
    let current_year = chrono::Utc::now().year();
    let last_year = current_year - 1;

    let url = format!(
        "https://api.rawg.io/api/games?key={}&dates={}-01-01,{}-12-31&ordering=-added&page_size=20",
        api_key, last_year, current_year
    );

    let res = HTTP_CLIENT
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Erro RAWG Trending: {}", res.status()));
    }

    let data: RawgResponse = res.json().await.map_err(|e| e.to_string())?;
    Ok(data.results)
}

/// Busca detalhes completos de um jogo específico.
///
/// Converte o nome do jogo em slug (formato URL-friendly) e busca
/// informações detalhadas na API RAWG.
pub async fn fetch_game_details(api_key: &str, query: String) -> Result<GameDetails, String> {
    let identifier = if query.chars().all(char::is_numeric) {
        query
    } else {
        query
            .to_lowercase()
            .replace(" ", "-")
            .replace(":", "")
            .replace("'", "")
            .replace("&", "")
            .replace(".", "")
    };

    let url = format!(
        "https://api.rawg.io/api/games/{}?key={}",
        identifier, api_key
    );

    let res = HTTP_CLIENT
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if res.status().is_success() {
        let details: GameDetails = res.json().await.map_err(|e| e.to_string())?;
        Ok(details)
    } else if res.status().as_u16() == 404 {
        Err("Jogo não encontrado na RAWG".into())
    } else {
        Err(format!("Erro RAWG Details: {}", res.status()))
    }
}

/// Busca jogos com lançamento futuro.
///
/// Retorna até 10 jogos que ainda serão lançados, desde a data atual
/// até o final do próximo ano, ordenados por popularidade.
pub async fn fetch_upcoming_games(api_key: &str) -> Result<Vec<RawgGame>, String> {
    let current_date = chrono::Utc::now();
    let next_year = current_date.year() + 1;
    let date_start = current_date.format("%Y-%m-%d").to_string();
    let date_end = format!("{}-12-31", next_year);

    let url = format!(
        "https://api.rawg.io/api/games?key={}&dates={},{}&ordering=-added&page_size=10",
        api_key, date_start, date_end
    );

    let res = HTTP_CLIENT
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Erro RAWG Upcoming: {}", res.status()));
    }

    let data: RawgResponse = res.json().await.map_err(|e| e.to_string())?;
    Ok(data.results)
}
