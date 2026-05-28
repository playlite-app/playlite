//! Estruturas internas (raw JSON) para respostas da API.

use serde::Deserialize;
use serde_json::Value;

/// Resposta principal da API.
///
/// A estrutura real da API pode mudar. Mantemos apenas os campos necessários.
#[derive(Debug, Deserialize)]
pub(super) struct RawSearchResponse {
    #[serde(default)]
    pub(super) results: Vec<RawGame>,
}

/// Estrutura bruta do jogo retornado pela API.
#[derive(Debug, Deserialize)]
pub(super) struct RawGame {
    /// ID da API (pode ser número ou string).
    pub(super) id: Value,
    #[serde(default)]
    pub(super) name: String,
    #[serde(default)]
    pub(super) image: Option<String>,
    #[serde(default)]
    pub(super) genre: Option<String>,
    #[serde(default)]
    pub(super) year: Option<f64>,
    #[serde(default)]
    pub(super) rating: Option<RawRating>,
    #[serde(default)]
    pub(super) platforms: Vec<RawPlatform>,
    #[serde(default)]
    pub(super) link: Option<String>,
    // Campos alternativos de imagem que alguns endpoints podem retornar.
    #[serde(default)]
    pub(super) cover: Option<RawCover>,
}

/// Estrutura de rating - Score normalizado entre 0.0 e 1.0.
#[derive(Debug, Deserialize)]
pub(super) struct RawRating {
    #[serde(default)]
    pub(super) mean: f64,
}

/// Estrutura de plataforma (ex: "PC", "Xbox Series X|S").
#[derive(Debug, Deserialize)]
pub(super) struct RawPlatform {
    #[serde(default)]
    pub(super) name: String,
}

/// Estrutura de capa (fallback para endpoints legados).
#[derive(Debug, Deserialize)]
pub(super) struct RawCover {
    #[serde(default)]
    pub(super) url: String,
}

/// Resposta bruta do endpoint /suggestions.
#[derive(Debug, Deserialize)]
pub(super) struct RawSuggestionsResponse {
    #[serde(default)]
    pub(super) results: Vec<RawSuggestion>,
}

/// Um item de sugestão — Estrutura mínima (id e nome).
#[derive(Debug, Deserialize)]
pub(super) struct RawSuggestion {
    pub(super) id: Value,
    #[serde(default)]
    pub(super) name: String,
}

/// Resposta bruta do endpoint /similar.
#[derive(Debug, Deserialize)]
pub(super) struct RawSimilarResponse {
    #[serde(default)]
    pub(super) results: Vec<RawSimilarGame>,
}

/// Estrutura bruta de um jogo similar.
#[derive(Debug, Deserialize)]
pub(super) struct RawSimilarGame {
    pub(super) id: Value,
    #[serde(default)]
    pub(super) name: String,
    #[serde(default)]
    pub(super) image: Option<String>,
    #[serde(default)]
    pub(super) genre: Option<String>,
    #[serde(default)]
    pub(super) year: Option<f64>,
    #[serde(default)]
    pub(super) rating: Option<RawRating>,
    #[serde(default)]
    pub(super) link: Option<String>,
    #[serde(default)]
    pub(super) screenshots: Vec<String>,
    #[serde(default)]
    pub(super) micro_trailer: Option<String>,
    #[serde(default)]
    pub(super) adult_only: bool,
}

/// Subset do endpoint GET /v1/games/{id} — apenas campos de mídia.
///
/// O endpoint retorna mais dados (descrição, preços, plataformas, etc.)
/// Campos listados aqui são apenas os necessários para a aba Mídia.
#[derive(Debug, Deserialize)]
pub(super) struct RawGameDetail {
    #[serde(default)]
    pub(super) image: Option<String>,
    #[serde(default)]
    pub(super) screenshots: Vec<String>,
    /// Array misto: `.webm` do Steam CDN e embeds `youtube-nocookie.com`.
    #[serde(default)]
    pub(super) videos: Vec<String>,
    #[serde(default)]
    pub(super) micro_trailer: Option<String>,
}
