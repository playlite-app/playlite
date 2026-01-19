//! Tipos de dados principais da aplicação.
//!
//! Define structs para jogos, wishlist, perfil do usuário e sistema de erros.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

/// Jogo na biblioteca do usuário.
///
/// Representa um jogo adicionado à biblioteca pessoal, com metadados
/// importados da plataforma e dados de progresso do usuário.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Game {
    pub id: String,
    pub name: String,
    #[serde(rename = "coverUrl")]
    pub cover_url: Option<String>,
    pub genres: Option<String>,
    pub developer: Option<String>,

    // Identificação
    pub platform: String,
    #[serde(rename = "platformId")]
    pub platform_id: Option<String>,

    // Execução
    #[serde(rename = "installPath")]
    pub install_path: Option<String>,
    #[serde(rename = "executablePath")]
    pub executable_path: Option<String>,
    #[serde(rename = "launchArgs")]
    pub launch_args: Option<String>,

    // Dados do Usuário
    #[serde(rename = "userRating")]
    pub user_rating: Option<i32>,
    pub favorite: bool,
    pub status: Option<String>,

    // Metadados de Tempo
    pub playtime: Option<i32>,
    #[serde(rename = "lastPlayed")]
    pub last_played: Option<String>,
    #[serde(rename = "addedAt")]
    pub added_at: String,
}

/// Detalhes adicionais do jogo (Schema v3).
///
/// **Campos removidos:**
/// - HLTB (hltb_main_story, hltb_main_extra, hltb_completionist)
/// - URLs legadas (website_url, igdb_url, rawg_url, pcgamingwiki_url)
/// - users_score (substituído por steam_review_*)
/// - age_rating (substituído por esrb_rating, is_adult, adult_tags)
///
/// **Campos mantidos/novos:**
/// - external_links: HashMap JSON com todos os links externos
/// - steam_review_*: Dados completos de reviews da Steam
/// - is_adult + adult_tags: Sistema de filtragem de conteúdo
/// - median_playtime: Tempo médio via SteamSpy
#[derive(Debug, Serialize, Deserialize)]
pub struct GameDetails {
    #[serde(rename = "gameId")]
    pub game_id: String,

    #[serde(rename = "steamAppId")]
    pub steam_app_id: Option<String>,

    // === Metadados Básicos ===
    pub developer: Option<String>,
    pub publisher: Option<String>,

    #[serde(rename = "releaseDate")]
    pub release_date: Option<String>,

    // === Categorização ===
    pub genres: Option<String>,
    pub tags: Option<String>,
    pub series: Option<String>,

    // === Descrição ===
    #[serde(rename = "descriptionRaw")]
    pub description_raw: Option<String>,

    #[serde(rename = "descriptionPtbr")]
    pub description_ptbr: Option<String>,

    // === Mídia ===
    #[serde(rename = "backgroundImage")]
    pub background_image: Option<String>,

    // === Scores ===
    #[serde(rename = "criticScore")]
    pub critic_score: Option<i32>, // Metacritic

    // === Steam Reviews (substitui users_score) ===
    #[serde(rename = "steamReviewLabel")]
    pub steam_review_label: Option<String>, // "Very Positive", "Mixed", etc.

    #[serde(rename = "steamReviewCount")]
    pub steam_review_count: Option<i32>,

    #[serde(rename = "steamReviewScore")]
    pub steam_review_score: Option<f32>, // Porcentagem de positivos (0-100)

    #[serde(rename = "steamReviewUpdatedAt")]
    pub steam_review_updated_at: Option<String>,

    // === Conteúdo Adulto (substitui age_rating) ===
    #[serde(rename = "esrbRating")]
    pub esrb_rating: Option<String>, // "E", "T", "M", etc.

    #[serde(rename = "isAdult")]
    pub is_adult: bool,

    #[serde(rename = "adultTags")]
    pub adult_tags: Option<String>, // Nudity, Gore, Sexual Content, etc.

    // === Links Externos (substitui URLs individuais) ===
    #[serde(rename = "externalLinks")]
    pub external_links: Option<HashMap<String, String>>,
    // Exemplo: {"website": "...", "steam": "...", "rawg": "...", "reddit": "..."}

    // === Tempo de Jogo (substitui HLTB) ===
    #[serde(rename = "medianPlaytime")]
    pub median_playtime: Option<i32>, // Mediana do SteamSpy em horas
}

/// Jogo na lista de desejos (wishlist) com tracking de preços.
#[derive(Debug, Serialize, Deserialize)]
pub struct WishlistGame {
    pub id: String,
    pub name: String,

    #[serde(rename = "coverUrl")]
    pub cover_url: Option<String>,

    #[serde(rename = "storeUrl")]
    pub store_url: Option<String>,

    #[serde(rename = "storePlatform")]
    pub store_platform: Option<String>,

    #[serde(rename = "itadId")]
    pub itad_id: Option<String>,

    #[serde(rename = "currentPrice")]
    pub current_price: Option<f64>,

    #[serde(rename = "normalPrice")]
    pub normal_price: Option<f64>,

    #[serde(rename = "lowestPrice")]
    pub lowest_price: Option<f64>,

    #[serde(rename = "currency")]
    pub currency: Option<String>,

    #[serde(rename = "onSale")]
    pub on_sale: bool,

    pub voucher: Option<String>,

    #[serde(rename = "addedAt")]
    pub added_at: Option<String>,
}

/// Erros tipados da aplicação para tratamento granular.
#[allow(dead_code)]
#[derive(Debug, Serialize)]
#[serde(tag = "type", content = "message")]
pub enum AppError {
    DatabaseError(String),
    ValidationError(String),
    NetworkError(String),
    NotFound(String),
    MutexError,
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AppError::DatabaseError(msg) => write!(f, "Erro de banco de dados: {}", msg),
            AppError::ValidationError(msg) => write!(f, "Erro de validação: {}", msg),
            AppError::NetworkError(msg) => write!(f, "Erro de rede: {}", msg),
            AppError::NotFound(msg) => write!(f, "Não encontrado: {}", msg),
            AppError::MutexError => {
                write!(f, "Erro interno: falha ao acessar recurso compartilhado")
            }
        }
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(err: rusqlite::Error) -> Self {
        AppError::DatabaseError(err.to_string())
    }
}

/// Pontuação de gênero no perfil do usuário.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GenreScore {
    pub name: String,
    pub score: f32,
    #[serde(rename = "gameCount")]
    pub game_count: i32,
}

/// Perfil agregado do usuário com estatísticas da biblioteca.
#[derive(Debug, Serialize, Deserialize)]
pub struct UserProfile {
    #[serde(rename = "topGenres")]
    pub top_genres: Vec<GenreScore>,

    #[serde(rename = "totalPlaytime")]
    pub total_playtime: i32,

    #[serde(rename = "totalGames")]
    pub total_games: i32,
}

/// Token OAuth com informações de expiração.
#[derive(Debug, Serialize, Deserialize)]
pub struct OAuthToken {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: u64,
}

/// Verifica se o token OAuth expirou.
impl OAuthToken {
    pub fn is_expired(&self) -> bool {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        now >= self.expires_at
    }
}
