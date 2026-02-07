//! Modelos de dados do banco de dados.
//!
//! Define as structs que representam as tabelas do banco:
//! - Game: tabela `games`
//! - GameDetails: tabela `game_details`
//! - WishlistGame: tabela `wishlist`

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::str::FromStr;

// Reexportar GameTag do utils para consistência
pub use crate::utils::tag_utils::GameTag;

// === ENUMS ===

/// Nível de confiança da importação do jogo
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ImportConfidence {
    High,
    Medium,
    Low,
}

impl FromStr for ImportConfidence {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "High" => Ok(ImportConfidence::High),
            "Medium" => Ok(ImportConfidence::Medium),
            "Low" => Ok(ImportConfidence::Low),
            _ => Err(()),
        }
    }
}

impl std::fmt::Display for ImportConfidence {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            ImportConfidence::High => "High",
            ImportConfidence::Medium => "Medium",
            ImportConfidence::Low => "Low",
        };
        write!(f, "{}", s)
    }
}

/// Plataformas suportadas
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum Platform {
    Steam,
    Epic,
    GOG,
    EA,
    Ubisoft,
    #[serde(rename = "Battle.net")]
    BattleNet,
    Amazon,
    Indie, // Para jogos sem plataforma específica ou de desenvolvedores independentes
    Outra, // Para jogos de plataformas não listadas ou desconhecidas
}

impl FromStr for Platform {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "Steam" => Ok(Platform::Steam),
            "Epic" => Ok(Platform::Epic),
            "GOG" => Ok(Platform::GOG),
            "EA" => Ok(Platform::EA),
            "Ubisoft" => Ok(Platform::Ubisoft),
            "Battle.net" => Ok(Platform::BattleNet),
            "Amazon" => Ok(Platform::Amazon),
            "Outra" => Ok(Platform::Outra),
            _ => Err(()),
        }
    }
}

impl std::fmt::Display for Platform {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            Platform::Steam => "Steam",
            Platform::Epic => "Epic",
            Platform::GOG => "GOG",
            Platform::EA => "EA",
            Platform::Ubisoft => "Ubisoft",
            Platform::BattleNet => "Battle.net",
            Platform::Amazon => "Amazon",
            Platform::Indie => "Indie",
            Platform::Outra => "Outra",
        };
        write!(f, "{}", s)
    }
}

// === Modelos de Dados ===

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
    pub platform: Platform,
    #[serde(rename = "platformGameId")]
    pub platform_game_id: String,

    // Execução
    pub installed: bool,
    #[serde(rename = "installPath")]
    pub install_path: Option<String>,
    #[serde(rename = "executablePath")]
    pub executable_path: Option<String>,
    #[serde(rename = "launchArgs")]
    pub launch_args: Option<String>,
    #[serde(rename = "importConfidence")]
    pub import_confidence: Option<ImportConfidence>,

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

    // Conteúdo Adulto
    #[serde(default, rename = "isAdult")]
    pub is_adult: bool,
}

/// Detalhes adicionais do jogo (Schema v3).
///
/// Contém metadados enriquecidos obtidos de APIs externas como RAWG,
/// substituindo e expandindo os dados anteriores.
#[derive(Debug, Serialize, Deserialize)]
pub struct GameDetails {
    #[serde(rename = "gameId")]
    pub game_id: String,

    #[serde(rename = "steamAppId")]
    pub steam_app_id: Option<String>,

    // Metadados Básicos
    pub developer: Option<String>,
    pub publisher: Option<String>,

    #[serde(rename = "releaseDate")]
    pub release_date: Option<String>,

    // Categorização
    pub genres: Option<String>,
    pub tags: Option<Vec<GameTag>>, // Array de tags categorizadas
    pub series: Option<String>,

    // Descrição
    #[serde(rename = "descriptionRaw")]
    pub description_raw: Option<String>,

    #[serde(rename = "descriptionPtbr")]
    pub description_ptbr: Option<String>,

    // Mídia
    #[serde(rename = "backgroundImage")]
    pub background_image: Option<String>,

    // Scores
    #[serde(rename = "criticScore")]
    pub critic_score: Option<i32>, // Metacritic

    // Steam Reviews
    #[serde(rename = "steamReviewLabel")]
    pub steam_review_label: Option<String>, // "Very Positive", "Mixed", etc.

    #[serde(rename = "steamReviewCount")]
    pub steam_review_count: Option<i32>,

    #[serde(rename = "steamReviewScore")]
    pub steam_review_score: Option<f32>, // Porcentagem de positivos (0-100)

    #[serde(rename = "steamReviewUpdatedAt")]
    pub steam_review_updated_at: Option<String>,

    // Conteúdo Adulto
    #[serde(rename = "esrbRating")]
    pub esrb_rating: Option<String>, // "E", "T", "M", etc.

    #[serde(rename = "isAdult")]
    pub is_adult: bool,

    #[serde(rename = "adultTags")]
    pub adult_tags: Option<String>, // Nudity, Gore, Sexual Content, etc.

    // Links Externos
    #[serde(rename = "externalLinks")]
    pub external_links: Option<HashMap<String, String>>,
    // Exemplo: {"website": "...", "steam": "...", "rawg": "...", "reddit": "..."}

    // Tempo de Jogo (Alternativa a HLTB)
    #[serde(rename = "medianPlaytime")]
    pub median_playtime: Option<i32>, // Mediana do SteamSpy em horas

    // Estimativa de Tempo de Jogo
    #[serde(rename = "estimatedPlaytime")]
    pub estimated_playtime: Option<f32>, // Tempo estimado em horas (história principal)
}

/// Jogo na lista de desejos (wishlist) com tracking de preços.
///
/// Representa um jogo adicionado à wishlist do usuário,
/// incluindo informações de preço, disponibilidade e vouchers.
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
