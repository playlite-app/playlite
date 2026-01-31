//! Estruturas e tipos fundamentais do sistema de recomendação
//!
//! Este módulo define as estruturas de dados e configurações centrais
//! usadas em todo o sistema de recomendação.

use crate::models::{Game, GameTag};
use crate::utils::tag_utils::TagKey;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// === CONSTANTES ===

pub const MAX_TAG_CONTRIBUTION: f32 = 300.0; // Cap por tag affinity
pub const WEIGHT_GENRE: f32 = 3.0;
pub const WEIGHT_PLAYTIME_HOUR: f32 = 1.2;
pub const WEIGHT_FAVORITE: f32 = 30.0;
pub const WEIGHT_USER_RATING: f32 = 8.0;
pub const WEIGHT_SERIES: f32 = 1.0;

// === ESTRUTURAS ===

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct RecommendationConfig {
    pub content_weight: f32,
    pub collaborative_weight: f32,
    pub age_decay: f32,
    pub favor_series: bool,
}

impl Default for RecommendationConfig {
    fn default() -> Self {
        Self {
            content_weight: 0.65,
            collaborative_weight: 0.35,
            age_decay: 0.98,
            favor_series: true,
        }
    }
}

#[derive(Debug, Clone)]
pub struct UserSettings {
    pub filter_adult_content: bool,
    pub series_limit: SeriesLimit,
}

impl Default for UserSettings {
    fn default() -> Self {
        Self {
            filter_adult_content: false,
            series_limit: SeriesLimit::Moderate,
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub enum SeriesLimit {
    None,
    Moderate,   // Max 2 em 10
    Aggressive, // Max 1 em 10
}

#[derive(Debug, Serialize, Clone)]
pub struct RecommendationReason {
    pub label: String,
    pub type_id: String,
}

#[derive(Debug, Clone)]
pub struct GameWithDetails {
    pub game: Game,
    pub genres: Vec<String>,
    pub tags: Vec<GameTag>,
    pub series: Option<String>,
    pub release_year: Option<i32>,
    pub steam_app_id: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserPreferenceVector {
    pub genres: HashMap<String, f32>,
    #[serde(
        serialize_with = "serialize_tags",
        deserialize_with = "deserialize_tags"
    )]
    pub tags: HashMap<TagKey, f32>,
    pub series: HashMap<String, f32>,
    #[serde(rename = "totalPlaytime")]
    pub total_playtime: i32,
    #[serde(rename = "totalGames")]
    pub total_games: i32,
}

// Serialização customizada para tags
fn serialize_tags<S>(tags: &HashMap<TagKey, f32>, serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    use serde::ser::SerializeMap;
    let mut map = serializer.serialize_map(Some(tags.len()))?;
    for (key, value) in tags {
        let key_string = format!("{:?}:{}", key.category, key.slug);
        map.serialize_entry(&key_string, value)?;
    }
    map.end()
}

// Deserialização customizada para tags
fn deserialize_tags<'de, D>(deserializer: D) -> Result<HashMap<TagKey, f32>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let map: HashMap<String, f32> = HashMap::deserialize(deserializer)?;
    let mut result = HashMap::new();

    for (key_string, value) in map {
        let parts: Vec<&str> = key_string.split(':').collect();
        if parts.len() == 2 {
            if let Ok(category) = serde_json::from_str(&format!("\"{}\"", parts[0])) {
                let key = TagKey::new(category, parts[1].to_string());
                result.insert(key, value);
            }
        }
    }

    Ok(result)
}

// === UTILITÁRIOS ===

/// Parseia o ano de lançamento de uma string de data
pub fn parse_release_year(date_str: &str) -> Option<i32> {
    date_str.split('-').next()?.parse().ok()
}

/// Calcula o peso de um jogo baseado no tempo jogado, favoritos e avaliação do usuário.
pub fn calculate_game_weight(game: &Game) -> f32 {
    let playtime_hours = (game.playtime.unwrap_or(0) / 60).min(100);
    let mut weight = 1.0 + (playtime_hours as f32 * WEIGHT_PLAYTIME_HOUR);

    if game.favorite {
        weight += WEIGHT_FAVORITE;
    }

    if let Some(rating) = game.user_rating {
        weight += (rating as f32) * WEIGHT_USER_RATING;
    }

    weight
}
