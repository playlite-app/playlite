//! Sistema de Recomendação v2.1 - Content-Based Filtering com Tags Categorizadas
//!
//! Features:
//! - Usa dados de game_details (genres, tags categorizadas, series)
//! - Penaliza jogos antigos (decaimento temporal)
//! - Sistema de pesos por categoria de tag
//! - Tags com relevância individual

use crate::models::Game;
use crate::utils::tag_utils::{category_multiplier, TagKey};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// === CONFIGURAÇÃO DE PESOS DO ALGORITMO ===

/// Peso base por hora jogada (limitado a 100h para evitar outliers)
const WEIGHT_PLAYTIME_HOUR: f32 = 1.5;

/// Bônus para jogos marcados como favoritos
const WEIGHT_FAVORITE: f32 = 40.0;

/// Peso por estrela de avaliação do usuário (1-5 estrelas)
const WEIGHT_USER_RATING: f32 = 8.0;

/// Multiplicador para gêneros (peso padrão)
const WEIGHT_GENRE: f32 = 1.0;

/// Multiplicador para séries (peso moderado - evita viés excessivo)
const WEIGHT_SERIES: f32 = 1.2;

/// Decaimento por ano (0.95 = 5% de redução por ano de idade)
const AGE_DECAY_FACTOR: f32 = 0.95;

/// Idade máxima considerada para decaimento (anos)
const MAX_AGE_PENALTY: i32 = 15;

// === ESTRUTURAS DE DADOS ===

/// Detalhes completos de um jogo (união de Game + GameDetails)
#[derive(Debug, Clone)]
pub struct GameWithDetails {
    pub game: Game,
    pub genres: Vec<String>,
    pub tags: Vec<crate::models::GameTag>,
    pub series: Option<String>,
    pub release_year: Option<i32>,
}

/// Vetor de preferências do usuário com múltiplas dimensões
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserPreferenceVector {
    /// Scores acumulados por gênero
    pub genres: HashMap<String, f32>,

    /// Scores acumulados por tag (agora usa TagKey com categoria)
    pub tags: HashMap<TagKey, f32>,

    /// Scores acumulados por série de jogos
    pub series: HashMap<String, f32>,

    /// Metadados estatísticos
    #[serde(rename = "totalPlaytime")]
    pub total_playtime: i32,

    #[serde(rename = "totalGames")]
    pub total_games: i32,
}

// === FUNÇÃO PRINCIPAL - CÁLCULO DE PERFIL ===

/// Calcula o perfil completo do usuário baseado na sua biblioteca
///
/// Usa tags categorizadas com relevância individual e aplica multiplicadores
/// por categoria (Mode > Narrative > Theme > Gameplay > Meta).
pub fn calculate_user_profile(games: &[GameWithDetails]) -> UserPreferenceVector {
    let mut profile = UserPreferenceVector {
        genres: HashMap::new(),
        tags: HashMap::new(),
        series: HashMap::new(),
        total_playtime: 0,
        total_games: games.len() as i32,
    };

    for game_with_details in games {
        // Calcula o peso base do jogo
        let weight = calculate_game_weight(&game_with_details.game);

        profile.total_playtime += game_with_details.game.playtime.unwrap_or(0);

        // Processamento de gêneros
        for genre in &game_with_details.genres {
            if genre.is_empty() || genre == "Desconhecido" {
                continue;
            }
            *profile.genres.entry(genre.clone()).or_insert(0.0) += weight * WEIGHT_GENRE;
        }

        // Processamento de tags
        for tag in &game_with_details.tags {
            let key = TagKey::new(tag.category.clone(), tag.slug.clone());

            // Combina: peso base do jogo × relevância da tag × multiplicador da categoria
            let tag_weight = weight * tag.relevance * category_multiplier(&tag.category);

            *profile.tags.entry(key).or_insert(0.0) += tag_weight;
        }

        // Processamento de séries
        if let Some(series) = get_series_name(game_with_details) {
            *profile.series.entry(series).or_insert(0.0) += weight * WEIGHT_SERIES;
        }
    }

    profile
}

/// Calcula o peso/importância de um jogo individual
fn calculate_game_weight(game: &Game) -> f32 {
    let mut weight = 1.0;

    // Fator tempo de jogo (limitado a 100h)
    if let Some(playtime) = game.playtime {
        let hours = (playtime as f32 / 60.0).min(100.0);
        weight += hours * WEIGHT_PLAYTIME_HOUR;
    }

    // Bônus de favorito
    if game.favorite {
        weight += WEIGHT_FAVORITE;
    }

    // Fator avaliação do usuário
    if let Some(rating) = game.user_rating {
        weight += (rating as f32) * WEIGHT_USER_RATING;
    }

    weight
}

/// Obtém o nome da série de um jogo
fn get_series_name(game: &GameWithDetails) -> Option<String> {
    game.series.clone()
}

// === SISTEMA DE SCORING COM PENALIZAÇÃO POR IDADE ===

/// Calcula o score de afinidade entre o perfil do usuário e um jogo candidato.
/// Considera tags categorizadas, gêneros, séries e penaliza jogos antigos.
pub fn score_game(profile: &UserPreferenceVector, game: &GameWithDetails) -> f32 {
    let mut score = 0.0;

    // Score de gêneros
    for genre in &game.genres {
        if let Some(&genre_score) = profile.genres.get(genre) {
            score += genre_score;
        }
    }

    // Score de tags
    for tag in &game.tags {
        let key = TagKey::new(tag.category.clone(), tag.slug.clone());
        if let Some(&tag_score) = profile.tags.get(&key) {
            score += tag_score;
        }
    }

    // Bônus de série
    if let Some(series) = get_series_name(game) {
        if let Some(&series_score) = profile.series.get(&series) {
            score += series_score * 1.5;
        }
    }

    // Penalização por idade
    if let Some(release_year) = game.release_year {
        let current_year = 2025;
        let age = (current_year - release_year).clamp(0, MAX_AGE_PENALTY);

        if age > 0 {
            let age_multiplier = AGE_DECAY_FACTOR.powi(age);
            score *= age_multiplier;
        }
    }

    score
}

/// Ranqueia uma lista de jogos candidatos baseado no perfil do usuário
pub fn rank_games(
    profile: &UserPreferenceVector,
    candidates: &[GameWithDetails],
) -> Vec<(GameWithDetails, f32)> {
    let mut ranked: Vec<_> = candidates
        .iter()
        .map(|g| (g.clone(), score_game(profile, g)))
        .collect();

    ranked.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

    ranked
}

// === UTILITÁRIOS ===

/// Parse de ano a partir de data ISO 8601 (YYYY-MM-DD)
pub fn parse_release_year(date_str: &str) -> Option<i32> {
    date_str.split('-').next()?.parse().ok()
}
