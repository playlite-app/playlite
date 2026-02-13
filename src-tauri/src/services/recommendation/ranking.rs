//! Sistema de Ranqueamento de Recomendações
//!
//! Este módulo implementa os diferentes algoritmos de ranqueamento:
//! - Híbrido (CB + CF)
//! - Content-Based puro
//! - Collaborative Filtering puro

use super::core::*;
use super::filtering::{apply_diversity_rules, apply_hard_filters};
use super::scoring::{normalize_score, score_game_cb};
use std::collections::{HashMap, HashSet};

/// Ranqueia jogos usando abordagem híbrida (CB + CF)
pub fn rank_games_hybrid(
    profile: &UserPreferenceVector,
    candidates: &[GameWithDetails],
    cf_scores: &HashMap<u32, f32>,
    ignored_ids: &HashSet<String>,
    config: RecommendationConfig,
    user_settings: UserSettings,
) -> Vec<(GameWithDetails, f32, RecommendationReason)> {
    // Estágio 1: Filtros duros
    let filtered = apply_hard_filters(candidates, &user_settings);

    // Estágio 2-3: Calcular scores CB e CF
    let raw_results: Vec<_> = filtered
        .iter()
        .filter(|g| !ignored_ids.contains(&g.game.id))
        .map(|g| {
            let (cb_score, cb_reason) = score_game_cb(profile, g, &config);

            let cf_score = g
                .steam_app_id
                .and_then(|id| cf_scores.get(&id))
                .cloned()
                .unwrap_or(0.0);

            (g.clone(), cb_score, cf_score, cb_reason)
        })
        .collect();

    // Estágio 4: Normalização
    let max_cb = raw_results
        .iter()
        .map(|(_, c, _, _)| *c)
        .fold(0.0, f32::max);
    let max_cf = raw_results
        .iter()
        .map(|(_, _, c, _)| *c)
        .fold(0.0, f32::max);

    // Estágio 5: Combinação ponderada
    let mut ranked: Vec<_> = raw_results
        .into_iter()
        .filter_map(|(g, cb, cf, cb_reason)| {
            if cb == 0.0 && cf == 0.0 {
                return None;
            }

            let cb_n = normalize_score(cb, max_cb);
            let cf_n = normalize_score(cf, max_cf);

            let weighted_cb = cb_n * config.content_weight;
            let weighted_cf = cf_n * config.collaborative_weight;

            let final_score = weighted_cb + weighted_cf;

            // Determinar razão final
            let reason = determine_hybrid_reason(weighted_cb, weighted_cf, cb_reason);

            Some((g, final_score, reason))
        })
        .collect();

    // Ordenar por score
    ranked.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

    // Estágio 6: Aplicar regras de diversidade
    apply_diversity_rules(ranked, &user_settings)
}

/// Ranqueia jogos usando apenas Content-Based
pub fn rank_games_content_based(
    profile: &UserPreferenceVector,
    candidates: &[GameWithDetails],
    config: &RecommendationConfig,
    user_settings: &UserSettings,
) -> Vec<(GameWithDetails, f32, RecommendationReason)> {
    // Estágio 1: Filtros
    let filtered = apply_hard_filters(candidates, user_settings);

    // Estágios 2-3: CB score
    let mut ranked: Vec<_> = filtered
        .iter()
        .map(|g| {
            let (score, reason) = score_game_cb(profile, g, config);

            let final_reason = reason.unwrap_or(RecommendationReason {
                label: "Baseado no seu perfil".to_string(),
                type_id: "general".to_string(),
            });

            (g.clone(), score, final_reason)
        })
        .filter(|(_, score, _)| *score > 0.0)
        .collect();

    // Ordenar
    ranked.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

    // Estágio 6: Diversidade
    apply_diversity_rules(ranked, user_settings)
}

/// Ranqueia jogos usando apenas Collaborative Filtering
pub fn rank_games_collaborative(
    candidates: &[GameWithDetails],
    cf_scores: &HashMap<u32, f32>,
    ignored_ids: &HashSet<String>,
    user_settings: &UserSettings,
) -> Vec<(GameWithDetails, f32, RecommendationReason)> {
    // Estágio 1: Filtros
    let filtered = apply_hard_filters(candidates, user_settings);

    // CF score puro (sem penalizações)
    let mut scored: Vec<_> = filtered
        .iter()
        .filter(|g| !ignored_ids.contains(&g.game.id))
        .filter_map(|g| {
            let steam_id = g.steam_app_id?;
            let score = cf_scores.get(&steam_id).cloned()?;

            if score <= 0.0 {
                return None;
            }

            Some((g.clone(), score))
        })
        .collect();

    // Ordenar
    scored.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

    // Converter para formato com razão
    let with_reason: Vec<_> = scored
        .into_iter()
        .map(|(g, score)| {
            (
                g,
                score,
                RecommendationReason {
                    label: "Tendência na Comunidade".to_string(),
                    type_id: "community".to_string(),
                },
            )
        })
        .collect();

    // Estágio 6: Diversidade
    apply_diversity_rules(with_reason, user_settings)
}

// === FUNÇÕES AUXILIARES ===

fn determine_hybrid_reason(
    weighted_cb: f32,
    weighted_cf: f32,
    cb_reason: Option<RecommendationReason>,
) -> RecommendationReason {
    match (weighted_cb > 0.0, weighted_cf > 0.0) {
        (true, true) => RecommendationReason {
            label: "Afinidade + Popular na comunidade".to_string(),
            type_id: "hybrid".to_string(),
        },
        (false, true) => RecommendationReason {
            label: "Popular na comunidade".to_string(),
            type_id: "community".to_string(),
        },
        _ => cb_reason.unwrap_or(RecommendationReason {
            label: "Baseado no seu perfil".to_string(),
            type_id: "general".to_string(),
        }),
    }
}
