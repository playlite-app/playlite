//! Sistema de Scoring de Recomendações
//!
//! Este módulo contém toda a lógica de cálculo de scores para recomendações,
//! incluindo content-based e collaborative filtering.

use super::core::*;
use crate::utils::tag_utils::{combined_multiplier, TagKey, TagRole};
use chrono::Datelike;

// === ESTRUTURAS AUXILIARES ===

#[derive(Debug, Clone)]
pub struct DetailedScoreComponents {
    pub affinity_score: f32,
    pub context_score: f32,
    pub diversity_score: f32,
    pub genre_score: f32,
    pub tag_score: f32,
    pub series_score: f32,
    pub age_penalty: f32,
    pub top_genres: Vec<(String, f32)>,
    pub top_affinity_tags: Vec<(String, f32)>,
    pub top_context_tags: Vec<(String, f32)>,
}

/// Contexto mutável para processamento de tags
struct TagProcessingContext<'a> {
    affinity_score: &'a mut f32,
    context_score: &'a mut f32,
    diversity_score: &'a mut f32,
    tag_score: &'a mut f32,
    affinity_tag_contributions: &'a mut Vec<(String, f32)>,
    context_tag_contributions: &'a mut Vec<(String, f32)>,
    best_reason: &'a mut Option<RecommendationReason>,
    max_affinity_contribution: &'a mut f32,
}

// === FUNÇÕES DE SCORING ===

/// Calcula score content-based de um jogo
pub fn score_game_cb(
    profile: &UserPreferenceVector,
    game: &GameWithDetails,
    config: &RecommendationConfig,
) -> (f32, Option<RecommendationReason>) {
    let (total_cb, reason, _components) = score_game_cb_detailed(profile, game, config);

    (total_cb, reason)
}

/// Versão detalhada do score content-based com breakdown completo
pub fn score_game_cb_detailed(
    profile: &UserPreferenceVector,
    game: &GameWithDetails,
    config: &RecommendationConfig,
) -> (f32, Option<RecommendationReason>, DetailedScoreComponents) {
    let mut affinity_score = 0.0;
    let mut context_score = 0.0;
    let mut diversity_score = 0.0;

    let mut genre_score = 0.0;
    let mut tag_score = 0.0;
    let mut series_score = 0.0;

    let mut genre_contributions = Vec::new();
    let mut affinity_tag_contributions = Vec::new();
    let mut context_tag_contributions = Vec::new();

    let mut best_reason: Option<RecommendationReason> = None;
    let mut max_affinity_contribution = 0.0;

    // 1. Processar Gêneros
    process_genres(
        &game.genres,
        &profile.genres,
        &mut affinity_score,
        &mut genre_score,
        &mut genre_contributions,
        &mut best_reason,
        &mut max_affinity_contribution,
    );

    // 2. Processar Tags
    let mut tag_ctx = TagProcessingContext {
        affinity_score: &mut affinity_score,
        context_score: &mut context_score,
        diversity_score: &mut diversity_score,
        tag_score: &mut tag_score,
        affinity_tag_contributions: &mut affinity_tag_contributions,
        context_tag_contributions: &mut context_tag_contributions,
        best_reason: &mut best_reason,
        max_affinity_contribution: &mut max_affinity_contribution,
    };
    process_tags(&game.tags, &profile.tags, &mut tag_ctx);

    // 3. Processar Séries
    if config.favor_series {
        process_series(
            &game.series,
            &profile.series,
            &mut affinity_score,
            &mut series_score,
        );
    }

    // 4. Aplicar Penalização por Idade
    let age_penalty = apply_age_penalty(
        game.release_year,
        config.age_decay,
        &mut affinity_score,
        &mut context_score,
    );

    let total_cb = affinity_score + context_score + diversity_score;

    // Ordenar contribuições
    genre_contributions.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
    affinity_tag_contributions.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
    context_tag_contributions.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

    let components = DetailedScoreComponents {
        affinity_score,
        context_score,
        diversity_score,
        genre_score,
        tag_score,
        series_score,
        age_penalty,
        top_genres: genre_contributions.into_iter().take(5).collect(),
        top_affinity_tags: affinity_tag_contributions.into_iter().take(10).collect(),
        top_context_tags: context_tag_contributions.into_iter().take(5).collect(),
    };

    (total_cb, best_reason, components)
}

/// Normaliza um score baseado no valor máximo
pub fn normalize_score(score: f32, max: f32) -> f32 {
    if max > 0.0 {
        score / max
    } else {
        0.0
    }
}

// === FUNÇÕES AUXILIARES DE PROCESSAMENTO ===

fn process_genres(
    game_genres: &[String],
    profile_genres: &std::collections::HashMap<String, f32>,
    affinity_score: &mut f32,
    genre_score: &mut f32,
    genre_contributions: &mut Vec<(String, f32)>,
    best_reason: &mut Option<RecommendationReason>,
    max_affinity_contribution: &mut f32,
) {
    for genre in game_genres {
        if let Some(&val) = profile_genres.get(genre) {
            let contribution = val * WEIGHT_GENRE;
            *affinity_score += contribution;
            *genre_score += contribution;
            genre_contributions.push((genre.clone(), contribution));

            if contribution > *max_affinity_contribution {
                *max_affinity_contribution = contribution;
                *best_reason = Some(RecommendationReason {
                    label: format!("Gênero: {}", genre),
                    type_id: "genre".to_string(),
                });
            }
        }
    }
}

fn process_tags(
    game_tags: &[crate::models::GameTag],
    profile_tags: &std::collections::HashMap<TagKey, f32>,
    ctx: &mut TagProcessingContext,
) {
    for tag in game_tags {
        let key = TagKey::new(tag.category.clone(), tag.slug.clone());

        if let Some(&pref_val) = profile_tags.get(&key) {
            let multiplier = combined_multiplier(&tag.category, &tag.role);
            let base_contribution = pref_val * multiplier * WEIGHT_PLAYTIME_HOUR;
            let contribution = base_contribution.min(MAX_TAG_CONTRIBUTION);

            match tag.role {
                TagRole::Affinity => {
                    *ctx.affinity_score += contribution;
                    *ctx.tag_score += contribution;
                    ctx.affinity_tag_contributions
                        .push((tag.name.clone(), contribution));

                    if contribution > *ctx.max_affinity_contribution {
                        *ctx.max_affinity_contribution = contribution;
                        *ctx.best_reason = Some(RecommendationReason {
                            label: format!("Tag: {}", tag.name),
                            type_id: "tag".to_string(),
                        });
                    }
                }
                TagRole::Context => {
                    *ctx.context_score += contribution;
                    *ctx.tag_score += contribution;
                    ctx.context_tag_contributions
                        .push((tag.name.clone(), contribution));
                }
                TagRole::Diversity => {
                    *ctx.diversity_score += contribution;
                    *ctx.tag_score += contribution;
                }
                TagRole::Filter => {}
            }
        }
    }
}

fn process_series(
    game_series: &Option<String>,
    profile_series: &std::collections::HashMap<String, f32>,
    affinity_score: &mut f32,
    series_score: &mut f32,
) {
    if let Some(series_name) = game_series {
        if let Some(&val) = profile_series.get(series_name) {
            let series_contribution = val.sqrt();
            *affinity_score += series_contribution;
            *series_score = series_contribution;
        }
    }
}

fn apply_age_penalty(
    release_year: Option<i32>,
    age_decay: f32,
    affinity_score: &mut f32,
    context_score: &mut f32,
) -> f32 {
    let mut age_penalty = 1.0;

    if let Some(release_year) = release_year {
        let current_year = chrono::Local::now().year();
        let age = (current_year - release_year).clamp(0, 15);
        if age > 0 {
            age_penalty = age_decay.powi(age);
            *affinity_score *= age_penalty;
            *context_score *= age_penalty;
        }
    }

    age_penalty
}
