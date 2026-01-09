//! Tipos de dados principais da aplicação.
//!
//! Define structs para jogos, wishlist, perfil do usuário e sistema de erros.

use serde::{Deserialize, Serialize};

/// Jogo na biblioteca do usuário.
///
/// Representa um jogo adicionado à biblioteca pessoal, com metadados
/// importados da plataforma e dados de progresso do usuário.
#[derive(Debug, Serialize, Deserialize)]
pub struct Game {
    pub id: String,
    pub name: String,
    #[serde(rename = "coverUrl")]
    pub cover_url: Option<String>, // Caminho local

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
    pub game_id: String, // FK -> Game.id

    // Conectores Extras
    pub steam_app_id: Option<String>, // Steam App ID (se disponível)

    // Dados Descritivos
    pub description: Option<String>,
    pub developer: Option<String>,
    pub publisher: Option<String>,
    #[serde(rename = "releaseDate")]
    pub release_date: Option<String>,
    pub genres: Option<String>,
    pub tags: Option<String>, // "Open World, Sci-fi"
    pub series: Option<String>,
    #[serde(rename = "ageRating")]
    pub age_rating: Option<String>, // "PEGI 18", "ESRB M"

    // Mídia Offline (Hero/Banner)
    #[serde(rename = "backgroundImage")]
    pub background_image: Option<String>, // Caminho local

    // Ratings
    #[serde(rename = "criticScore")]
    pub critic_score: Option<i32>, // Critca especializada
    #[serde(rename = "usersScore")]
    pub users_score: Option<f32>, // Steam reviews

    // Links
    #[serde(rename = "websiteUrl")]
    pub website_url: Option<String>,
    #[serde(rename = "igdbUrl")]
    pub igdb_url: Option<String>,
    #[serde(rename = "rawgUrl")]
    pub rawg_url: Option<String>,
    #[serde(rename = "pcgamingwikiUrl")]
    pub pcgamingwiki_url: Option<String>,

    // HLTB
    #[serde(rename = "hltbMainStory")]
    pub hltb_main_story: Option<i32>, // Duração da história principal
    #[serde(rename = "hltbMainExtra")]
    pub hltb_main_extra: Option<i32>, // História + extras
    #[serde(rename = "hltbCompletionist")]
    pub hltb_completionist: Option<i32>, // 100% conclusão
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
