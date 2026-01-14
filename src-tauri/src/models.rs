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
    pub cover_url: Option<String>, // Caminho local
    pub genres: Option<String>,    // Para o subtítulo do Card
    pub developer: Option<String>, // Para o Card

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
    pub status: Option<String>, // "completed", "playing", "backlog", etc.

    // Metadados de Tempo
    pub playtime: Option<i32>,
    #[serde(rename = "lastPlayed")]
    pub last_played: Option<String>, // ISO 8601 UTC
    #[serde(rename = "addedAt")]
    pub added_at: String, // ISO 8601 UTC
}

/// Detalhes adicionais do jogo.
///
/// Armazena metadados importados de APIs externas
/// (IGDB, RAWG, HLTB) para exibição na interface do usuário.
///
/// **Nota:** os campos são opcionais, pois nem todos os jogos terão metadados completos disponíveis.
#[derive(Debug, Serialize, Deserialize)]
pub struct GameDetails {
    pub game_id: String,
    pub steam_app_id: Option<String>,

    // === Metadados Básicos ===
    pub description: Option<String>,
    pub developer: Option<String>,
    pub publisher: Option<String>,
    #[serde(rename = "releaseDate")]
    pub release_date: Option<String>,

    // === Categorização ===
    pub genres: Option<String>,
    pub tags: Option<String>,
    pub series: Option<String>,

    // === NOVO: Classificação e Conteúdo Adulto ===
    // Substitui o antigo age_rating simples por flags detalhadas
    #[serde(rename = "ageRating")]
    pub age_rating: Option<String>, // Mantido para retrocompatibilidade
    #[serde(rename = "isAdult")]
    pub is_adult: bool, // Novo: Flag direta para filtro
    #[serde(rename = "adultTags")]
    pub adult_tags: Option<String>, // JSON ou CSV: "Nudity, Gore"

    // === Mídia ===
    #[serde(rename = "backgroundImage")]
    pub background_image: Option<String>,

    // === Scores e Reviews ===
    #[serde(rename = "criticScore")]
    pub critic_score: Option<i32>, // Metacritic

    // Score legado de usuários (mantido para compatibilidade)
    #[serde(rename = "usersScore")]
    pub users_score: Option<f32>,

    // NOVO: Steam Reviews (muito mais detalhado que users_score simples)
    #[serde(rename = "steamReviewLabel")]
    pub steam_review_label: Option<String>, // "Very Positive"
    #[serde(rename = "steamReviewCount")]
    pub steam_review_count: Option<i32>, // 12450
    #[serde(rename = "steamReviewScore")]
    pub steam_review_score: Option<f32>, // % de positivos (0-100)
    #[serde(rename = "steamReviewUpdatedAt")]
    pub steam_review_updated_at: Option<String>, // Timestamp da última atualização

    // === NOVO: Links Centralizados ===
    // A UI deve preferir iterar sobre isso ao invés de buscar campos fixos
    #[serde(rename = "externalLinks")]
    pub external_links: Option<HashMap<String, String>>,

    // Campos legados de URL (Mantidos para não quebrar frontend IMEDIATAMENTE)
    // No futuro, o frontend deve ler apenas de external_links
    #[serde(rename = "websiteUrl")]
    pub website_url: Option<String>,
    #[serde(rename = "igdbUrl")]
    pub igdb_url: Option<String>,
    #[serde(rename = "rawgUrl")]
    pub rawg_url: Option<String>,
    #[serde(rename = "pcgamingwikiUrl")]
    pub pcgamingwiki_url: Option<String>,

    // === Tempo de Jogo (HLTB + SteamSpy) ===
    #[serde(rename = "hltbMainStory")]
    pub hltb_main_story: Option<i32>,
    #[serde(rename = "hltbMainExtra")]
    pub hltb_main_extra: Option<i32>,
    #[serde(rename = "hltbCompletionist")]
    pub hltb_completionist: Option<i32>,

    // NOVO: Mediana do SteamSpy (backup para quando HLTB falhar)
    #[serde(rename = "medianPlaytime")]
    pub median_playtime: Option<i32>,
}

/// Jogo na lista de desejos (wishlist) com tracking de preços.
///
/// Armazena jogos que o usuário deseja comprar.
/// Preços são atualizados sob demanda com `refresh_prices()`.
/// Busca de preços são feitas por meio de consultas a ITAD API (IsThereAnyDeal).
#[derive(Debug, Serialize, Deserialize)]
pub struct WishlistGame {
    pub id: String,
    pub name: String,
    #[serde(rename = "coverUrl")]
    pub cover_url: Option<String>,

    // Controle de Loja
    #[serde(rename = "storeUrl")]
    pub store_url: Option<String>,
    #[serde(rename = "storePlatform")]
    pub store_platform: Option<String>, // steam, epic, etc.
    #[serde(rename = "itadId")]
    pub itad_id: Option<String>, // ID do jogo na ITAD para buscar preços

    // Preços
    #[serde(rename = "currentPrice")]
    pub current_price: Option<f64>, // Preço atual
    #[serde(rename = "normalPrice")]
    pub normal_price: Option<f64>, // Preço base
    #[serde(rename = "lowestPrice")]
    pub lowest_price: Option<f64>, // Menor preço histórico (ITAD)
    #[serde(rename = "currency")]
    pub currency: Option<String>,
    #[serde(rename = "onSale")]
    pub on_sale: bool,
    pub voucher: Option<String>,

    #[serde(rename = "addedAt")]
    pub added_at: Option<String>,
}

/// Erros tipados da aplicação para tratamento granular.
///
/// Usado internamente no Rust. É serializado para JSON quando enviado ao frontend.
/// O atributo `#[serde(tag = "type")]` gera `{"type": "DatabaseError", "message": "..."}`.
///
/// **Nota:** implementa `From<rusqlite::Error>` para conversão automática de erros.
#[allow(dead_code)]
#[derive(Debug, Serialize)]
#[serde(tag = "type", content = "message")]
pub enum AppError {
    /// Erro em operações SQLite (leitura, escrita, constraints)
    DatabaseError(String),
    /// Dados inválidos fornecidos pelo usuário (ex: API key vazia)
    ValidationError(String),
    /// Falha em chamadas HTTP (Steam/RAWG API timeout, 401, 500, etc.)
    NetworkError(String),
    /// Recurso solicitado não existe (jogo, secret, etc.)
    NotFound(String),
    /// Falha ao adquirir lock em recurso compartilhado (raro)
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
///
/// Usado para calcular gênero favorito baseado em tempo jogado e quantidade
/// de jogos. O algoritmo de score considera tanto variedade quanto dedicação.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GenreScore {
    pub name: String,
    pub score: f32,
    #[serde(rename = "gameCount")]
    pub game_count: i32,
}

/// Perfil agregado do usuário com estatísticas da biblioteca.
///
/// Gerado sob demanda analisando todos os jogos na biblioteca.
/// Usado para exibir dashboard e recomendações personalizadas.
#[derive(Debug, Serialize, Deserialize)]
pub struct UserProfile {
    #[serde(rename = "topGenres")]
    pub top_genres: Vec<GenreScore>,
    #[serde(rename = "totalPlaytime")]
    pub total_playtime: i32,
    #[serde(rename = "totalGames")]
    pub total_games: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OAuthToken {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: u64,
}

impl OAuthToken {
    pub fn is_expired(&self) -> bool {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        now >= self.expires_at
    }
}
