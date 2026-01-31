//! Filtros e Regras de Diversidade
//!
//! Este módulo contém os filtros duros (adult content, etc.) e as regras
//! de diversidade estrutural (séries, gêneros) aplicadas às recomendações.

use super::core::{GameWithDetails, RecommendationReason, SeriesLimit, UserSettings};
use crate::utils::tag_utils::TagRole;
use std::collections::HashMap;

/// Aplica filtros duros nos candidatos (ex: conteúdo adulto)
pub fn apply_hard_filters(
    candidates: &[GameWithDetails],
    user_settings: &UserSettings,
) -> Vec<GameWithDetails> {
    candidates
        .iter()
        .filter(|game| {
            // Filtro de conteúdo adulto
            if user_settings.filter_adult_content {
                let has_adult = game.tags.iter().any(|tag| {
                    tag.role == TagRole::Filter
                        && ["sexual-content", "nsfw", "hentai"].contains(&tag.slug.as_str())
                });
                if has_adult {
                    return false;
                }
            }

            true
        })
        .cloned()
        .collect()
}

/// Aplica regras estruturais de diversidade (limite de séries e gêneros)
pub fn apply_diversity_rules(
    scored: Vec<(GameWithDetails, f32, RecommendationReason)>,
    settings: &UserSettings,
) -> Vec<(GameWithDetails, f32, RecommendationReason)> {
    let mut result = Vec::new();
    let mut series_count: HashMap<String, usize> = HashMap::new();
    let mut genre_count: HashMap<String, usize> = HashMap::new();

    let series_max = match settings.series_limit {
        SeriesLimit::None => usize::MAX,
        SeriesLimit::Moderate => 2,
        SeriesLimit::Aggressive => 1,
    };

    for (game, score, reason) in scored {
        let mut should_include = true;

        // Regra 1: Limite de séries nos primeiros 10
        if let Some(series) = &game.series {
            let count = series_count.get(series).unwrap_or(&0);
            if *count >= series_max && result.len() < 10 {
                should_include = false;
            }
        }

        // Regra 2: Máximo 4 do mesmo gênero principal nos primeiros 10
        if should_include && !game.genres.is_empty() && result.len() < 10 {
            let main_genre = &game.genres[0];
            let count = genre_count.get(main_genre).unwrap_or(&0);
            if *count >= 4 {
                should_include = false;
            }
        }

        if should_include {
            // Atualizar contadores
            if let Some(series) = &game.series {
                *series_count.entry(series.clone()).or_insert(0) += 1;
            }
            if !game.genres.is_empty() {
                *genre_count.entry(game.genres[0].clone()).or_insert(0) += 1;
            }
            result.push((game, score, reason));
        }
    }

    result
}
