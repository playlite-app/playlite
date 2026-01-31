//! Cálculo de Perfil de Usuário
//!
//! Este módulo é responsável por calcular o vetor de preferências do usuário
//! baseado em sua biblioteca de jogos.

use super::core::*;
use crate::utils::tag_utils::{combined_multiplier, TagKey, TagRole};
use std::collections::{HashMap, HashSet};

/// Calcula o perfil de preferências do usuário baseado em sua biblioteca
pub fn calculate_user_profile(
    games: &[GameWithDetails],
    ignored_ids: &HashSet<String>,
) -> UserPreferenceVector {
    let mut genres: HashMap<String, f32> = HashMap::new();
    let mut tags: HashMap<TagKey, f32> = HashMap::new();
    let mut series: HashMap<String, f32> = HashMap::new();
    let mut total_playtime = 0;
    let total_games = games.len() as i32;

    for game_data in games {
        if ignored_ids.contains(&game_data.game.id) {
            continue;
        }

        let game = &game_data.game;
        let weight = calculate_game_weight(game);
        total_playtime += game.playtime.unwrap_or(0);

        // Acumular pesos para gêneros
        accumulate_genres(&mut genres, &game_data.genres, weight);

        // Acumular pesos para tags
        accumulate_tags(&mut tags, &game_data.tags, weight);

        // Acumular pesos para séries
        accumulate_series(&mut series, &game_data.series, weight);
    }

    UserPreferenceVector {
        genres,
        tags,
        series,
        total_playtime,
        total_games,
    }
}

// === FUNÇÕES AUXILIARES ===

fn accumulate_genres(genres: &mut HashMap<String, f32>, game_genres: &[String], weight: f32) {
    for genre in game_genres {
        *genres.entry(genre.clone()).or_insert(0.0) += weight * WEIGHT_GENRE;
    }
}

fn accumulate_tags(
    tags: &mut HashMap<TagKey, f32>,
    game_tags: &[crate::models::GameTag],
    weight: f32,
) {
    for tag in game_tags {
        let key = TagKey::new(tag.category.clone(), tag.slug.clone());

        // Tags de filtro não contribuem para o perfil
        if tag.role == TagRole::Filter {
            continue;
        }

        let tag_weight = weight * tag.relevance * combined_multiplier(&tag.category, &tag.role);

        *tags.entry(key).or_insert(0.0) += tag_weight;
    }
}

fn accumulate_series(series: &mut HashMap<String, f32>, game_series: &Option<String>, weight: f32) {
    if let Some(series_name) = game_series {
        *series.entry(series_name.clone()).or_insert(0.0) += weight * WEIGHT_SERIES;
    }
}
