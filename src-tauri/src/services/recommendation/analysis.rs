//! Sistema de Análise e Debug de Recomendações
//!
//! Este módulo fornece ferramentas para análise detalhada do sistema de recomendação,
//! incluindo breakdowns de score, relatórios estatísticos e métricas de influência.
//!
//! **Uso:** Destinado principalmente para desenvolvimento, debugging e análise de performance.

use super::core::{
    GameWithDetails, RecommendationConfig, RecommendationReason, SeriesLimit, UserPreferenceVector,
    UserSettings,
};
use super::scoring::{normalize_score, score_game_cb_detailed, DetailedScoreComponents};
use serde::Serialize;
use std::collections::{HashMap, HashSet};

// === ESTRUTURAS DE ANÁLISE ===

/// Breakdown detalhado de score por componentes e roles
#[derive(Debug, Serialize, Clone)]
pub struct DetailedScoreBreakdown {
    pub game_id: String,
    pub game_title: String,
    pub steam_app_id: Option<u32>,

    // Scores por role
    pub affinity_score: f32,
    pub context_score: f32,
    pub diversity_score: f32,

    // Scores por componente
    pub genre_score: f32,
    pub tag_score: f32,
    pub series_score: f32,

    // Totais
    pub total_cb: f32,
    pub total_cf: f32,

    // Normalizados
    pub normalized_cb: f32,
    pub normalized_cf: f32,

    // Ponderados
    pub weighted_cb: f32,
    pub weighted_cf: f32,

    // Penalizações/multiplicadores
    pub age_penalty: f32,

    // Final
    pub final_score: f32,
    pub final_rank: usize,

    // Explicação
    pub reason_label: String,
    pub reason_type: String,

    // Top contribuições
    pub top_genres: Vec<(String, f32)>,
    pub top_affinity_tags: Vec<(String, f32)>,
    pub top_context_tags: Vec<(String, f32)>,
}

/// Relatório completo de análise
#[derive(Debug, Serialize, Clone)]
pub struct RecommendationAnalysisReport {
    pub timestamp: String,
    pub total_games: usize,
    pub config: RecommendationConfig,
    pub user_settings: UserSettingsReport,

    // Debug: Estatísticas do perfil
    pub profile_stats: ProfileStats,

    // Estatísticas gerais
    pub stats: AnalysisStats,

    // Breakdown individual de cada jogo
    pub games: Vec<DetailedScoreBreakdown>,

    // Análise agregada
    pub tag_influence: Vec<(String, TagInfluence)>,
    pub genre_influence: Vec<(String, GenreInfluence)>,
    pub reason_distribution: HashMap<String, usize>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ProfileStats {
    pub total_genres: usize,
    pub total_tags: usize,
    pub total_series: usize,
    pub top_genres: Vec<(String, f32)>,
    pub top_tags: Vec<(String, String, f32)>, // (slug, name, weight)
}

#[derive(Debug, Serialize, Clone)]
pub struct UserSettingsReport {
    pub filter_adult_content: bool,
    pub series_limit: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct AnalysisStats {
    pub avg_final_score: f32,
    pub median_final_score: f32,
    pub max_final_score: f32,
    pub min_final_score: f32,

    pub avg_cb_score: f32,
    pub avg_cf_score: f32,

    pub avg_affinity_score: f32,
    pub avg_context_score: f32,
    pub avg_diversity_score: f32,

    pub avg_genre_score: f32,
    pub avg_tag_score: f32,
    pub avg_series_score: f32,

    pub avg_age_penalty: f32,

    // Proporções
    pub affinity_proportion: f32,
    pub context_proportion: f32,
    pub diversity_proportion: f32,
    pub genre_proportion: f32,
}

#[derive(Debug, Serialize, Clone)]
pub struct TagInfluence {
    pub tag_name: String,
    pub category: String,
    pub role: String,
    pub games_count: usize,
    pub avg_contribution: f32,
    pub max_contribution: f32,
    pub times_as_reason: usize,
}

#[derive(Debug, Serialize, Clone)]
pub struct GenreInfluence {
    pub games_count: usize,
    pub avg_contribution: f32,
    pub max_contribution: f32,
    pub times_as_reason: usize,
}

// === FUNÇÃO PRINCIPAL DE ANÁLISE ===

/// Gera relatório completo de análise de recomendações
///
/// Esta função executa todo o pipeline de recomendação e coleta
/// informações detalhadas sobre scores, contribuições e razões.
pub fn generate_analysis_report(
    profile: &UserPreferenceVector,
    candidates: &[GameWithDetails],
    cf_scores: &HashMap<u32, f32>,
    ignored_ids: &HashSet<String>,
    config: RecommendationConfig,
    user_settings: UserSettings,
) -> RecommendationAnalysisReport {
    use super::filtering::apply_hard_filters;
    use chrono::Local;

    // Estágio 1: Filtros
    let filtered = apply_hard_filters(candidates, &user_settings);

    // Calcular scores detalhados
    let raw_results: Vec<_> = filtered
        .iter()
        .filter(|g| !ignored_ids.contains(&g.game.id))
        .map(|g| {
            let (cb_score, cb_reason, components) = score_game_cb_detailed(profile, g, &config);

            let cf_score = g
                .steam_app_id
                .and_then(|id| cf_scores.get(&id))
                .cloned()
                .unwrap_or(0.0);

            (g.clone(), cb_score, cf_score, cb_reason, components)
        })
        .collect();

    // Normalização
    let max_cb = raw_results
        .iter()
        .map(|(_, c, _, _, _)| *c)
        .fold(0.0, f32::max);
    let max_cf = raw_results
        .iter()
        .map(|(_, _, c, _, _)| *c)
        .fold(0.0, f32::max);

    // Processar e criar breakdowns
    let mut games_breakdowns = create_score_breakdowns(raw_results, max_cb, max_cf, &config);

    // Ordenar por score final
    games_breakdowns.sort_by(|a, b| b.final_score.partial_cmp(&a.final_score).unwrap());

    // Atualizar ranks
    for (idx, game) in games_breakdowns.iter_mut().enumerate() {
        game.final_rank = idx + 1;
    }

    // Calcular estatísticas
    let stats = calculate_stats(&games_breakdowns);

    // Analisar influência de tags
    let tag_influence = analyze_tag_influence(&games_breakdowns, candidates);

    // Analisar influência de gêneros
    let genre_influence = analyze_genre_influence(&games_breakdowns);

    // Distribuição de razões
    let reason_distribution = calculate_reason_distribution(&games_breakdowns);

    // Estatísticas do perfil
    let profile_stats = calculate_profile_stats(profile);

    RecommendationAnalysisReport {
        timestamp: Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
        total_games: games_breakdowns.len(),
        config: config.clone(),
        user_settings: UserSettingsReport {
            filter_adult_content: user_settings.filter_adult_content,
            series_limit: match user_settings.series_limit {
                SeriesLimit::None => "none".to_string(),
                SeriesLimit::Moderate => "moderate".to_string(),
                SeriesLimit::Aggressive => "aggressive".to_string(),
            },
        },
        profile_stats,
        stats,
        games: games_breakdowns,
        tag_influence,
        genre_influence,
        reason_distribution,
    }
}

// === FUNÇÕES AUXILIARES ===

fn create_score_breakdowns(
    raw_results: Vec<(
        GameWithDetails,
        f32,
        f32,
        Option<RecommendationReason>,
        DetailedScoreComponents,
    )>,
    max_cb: f32,
    max_cf: f32,
    config: &RecommendationConfig,
) -> Vec<DetailedScoreBreakdown> {
    raw_results
        .into_iter()
        .enumerate()
        .filter_map(|(idx, (g, cb, cf, cb_reason, components))| {
            if cb == 0.0 && cf == 0.0 {
                return None;
            }

            let cb_n = normalize_score(cb, max_cb);
            let cf_n = normalize_score(cf, max_cf);

            let weighted_cb = cb_n * config.content_weight;
            let weighted_cf = cf_n * config.collaborative_weight;

            let final_score = weighted_cb + weighted_cf;

            // Determinar razão final
            let (reason_label, reason_type) = determine_reason(weighted_cb, weighted_cf, cb_reason);

            Some(DetailedScoreBreakdown {
                game_id: g.game.id.clone(),
                game_title: g.game.name.clone(),
                steam_app_id: g.steam_app_id,

                affinity_score: components.affinity_score,
                context_score: components.context_score,
                diversity_score: components.diversity_score,

                genre_score: components.genre_score,
                tag_score: components.tag_score,
                series_score: components.series_score,

                total_cb: cb,
                total_cf: cf,

                normalized_cb: cb_n,
                normalized_cf: cf_n,

                weighted_cb,
                weighted_cf,

                age_penalty: components.age_penalty,

                final_score,
                final_rank: idx + 1,

                reason_label,
                reason_type,

                top_genres: components.top_genres,
                top_affinity_tags: components.top_affinity_tags,
                top_context_tags: components.top_context_tags,
            })
        })
        .collect()
}

fn determine_reason(
    weighted_cb: f32,
    weighted_cf: f32,
    cb_reason: Option<RecommendationReason>,
) -> (String, String) {
    match (weighted_cb > 0.0, weighted_cf > 0.0) {
        (true, true) => (
            "Afinidade + Popular na comunidade".to_string(),
            "hybrid".to_string(),
        ),
        (false, true) => ("Popular na comunidade".to_string(), "community".to_string()),
        _ => {
            if let Some(reason) = cb_reason {
                (reason.label, reason.type_id)
            } else {
                ("Baseado no seu perfil".to_string(), "general".to_string())
            }
        }
    }
}

fn calculate_stats(games: &[DetailedScoreBreakdown]) -> AnalysisStats {
    if games.is_empty() {
        return AnalysisStats {
            avg_final_score: 0.0,
            median_final_score: 0.0,
            max_final_score: 0.0,
            min_final_score: 0.0,
            avg_cb_score: 0.0,
            avg_cf_score: 0.0,
            avg_affinity_score: 0.0,
            avg_context_score: 0.0,
            avg_diversity_score: 0.0,
            avg_genre_score: 0.0,
            avg_tag_score: 0.0,
            avg_series_score: 0.0,
            avg_age_penalty: 1.0,
            affinity_proportion: 0.0,
            context_proportion: 0.0,
            diversity_proportion: 0.0,
            genre_proportion: 0.0,
        };
    }

    let n = games.len() as f32;
    let sum_final: f32 = games.iter().map(|g| g.final_score).sum();
    let sum_cb: f32 = games.iter().map(|g| g.total_cb).sum();
    let sum_cf: f32 = games.iter().map(|g| g.total_cf).sum();
    let sum_affinity: f32 = games.iter().map(|g| g.affinity_score).sum();
    let sum_context: f32 = games.iter().map(|g| g.context_score).sum();
    let sum_diversity: f32 = games.iter().map(|g| g.diversity_score).sum();
    let sum_genre: f32 = games.iter().map(|g| g.genre_score).sum();
    let sum_tag: f32 = games.iter().map(|g| g.tag_score).sum();
    let sum_series: f32 = games.iter().map(|g| g.series_score).sum();
    let sum_age_penalty: f32 = games.iter().map(|g| g.age_penalty).sum();

    let total_cb = sum_affinity + sum_context + sum_diversity;
    let (affinity_prop, context_prop, diversity_prop, genre_prop) = if total_cb > 0.0 {
        (
            (sum_affinity / total_cb) * 100.0,
            (sum_context / total_cb) * 100.0,
            (sum_diversity / total_cb) * 100.0,
            (sum_genre / total_cb) * 100.0,
        )
    } else {
        (0.0, 0.0, 0.0, 0.0)
    };

    let median_final_score = calculate_median(games);

    AnalysisStats {
        avg_final_score: sum_final / n,
        median_final_score,
        max_final_score: games.iter().map(|g| g.final_score).fold(0.0, f32::max),
        min_final_score: games.iter().map(|g| g.final_score).fold(f32::MAX, f32::min),
        avg_cb_score: sum_cb / n,
        avg_cf_score: sum_cf / n,
        avg_affinity_score: sum_affinity / n,
        avg_context_score: sum_context / n,
        avg_diversity_score: sum_diversity / n,
        avg_genre_score: sum_genre / n,
        avg_tag_score: sum_tag / n,
        avg_series_score: sum_series / n,
        avg_age_penalty: sum_age_penalty / n,
        affinity_proportion: affinity_prop,
        context_proportion: context_prop,
        diversity_proportion: diversity_prop,
        genre_proportion: genre_prop,
    }
}

fn calculate_median(games: &[DetailedScoreBreakdown]) -> f32 {
    let mut sorted_scores: Vec<f32> = games.iter().map(|g| g.final_score).collect();
    sorted_scores.sort_by(|a, b| a.partial_cmp(b).unwrap());

    if sorted_scores.len().is_multiple_of(2) {
        let mid = sorted_scores.len() / 2;
        (sorted_scores[mid - 1] + sorted_scores[mid]) / 2.0
    } else {
        sorted_scores[sorted_scores.len() / 2]
    }
}

fn analyze_tag_influence(
    games: &[DetailedScoreBreakdown],
    candidates: &[GameWithDetails],
) -> Vec<(String, TagInfluence)> {
    let mut tag_data: HashMap<String, (String, String, Vec<f32>, usize)> = HashMap::new();

    // Coletar dados de todas as tags
    for game in games {
        // Encontrar o jogo original para pegar as tags
        if let Some(original) = candidates.iter().find(|c| c.game.id == game.game_id) {
            // Processar affinity tags
            for (tag_name, contribution) in &game.top_affinity_tags {
                // Encontrar a tag original para pegar category e role
                if let Some(tag) = original.tags.iter().find(|t| &t.name == tag_name) {
                    let entry = tag_data.entry(tag_name.clone()).or_insert((
                        format!("{:?}", tag.category),
                        "affinity".to_string(),
                        Vec::new(),
                        0,
                    ));
                    entry.2.push(*contribution);
                }
            }

            // Verificar se foi razão principal
            if game.reason_type == "tag" && game.reason_label.starts_with("Tag: ") {
                let tag_name = game.reason_label.strip_prefix("Tag: ").unwrap();
                if let Some(entry) = tag_data.get_mut(tag_name) {
                    entry.3 += 1;
                }
            }
        }
    }

    // Converter para vetor e calcular médias
    let mut result: Vec<(String, TagInfluence)> = tag_data
        .into_iter()
        .map(|(name, (category, role, contributions, times_as_reason))| {
            let avg = if !contributions.is_empty() {
                contributions.iter().sum::<f32>() / contributions.len() as f32
            } else {
                0.0
            };
            let max = contributions.iter().cloned().fold(0.0, f32::max);

            (
                name.clone(),
                TagInfluence {
                    tag_name: name,
                    category,
                    role,
                    games_count: contributions.len(),
                    avg_contribution: avg,
                    max_contribution: max,
                    times_as_reason,
                },
            )
        })
        .collect();

    // Ordenar por contribuição média (decrescente)
    result.sort_by(|a, b| {
        b.1.avg_contribution
            .partial_cmp(&a.1.avg_contribution)
            .unwrap()
    });

    result
}

fn analyze_genre_influence(games: &[DetailedScoreBreakdown]) -> Vec<(String, GenreInfluence)> {
    let mut genre_data: HashMap<String, (Vec<f32>, usize)> = HashMap::new();

    for game in games {
        for (genre_name, contribution) in &game.top_genres {
            let entry = genre_data
                .entry(genre_name.clone())
                .or_insert((Vec::new(), 0));
            entry.0.push(*contribution);
        }

        // Verificar se foi razão principal
        if game.reason_type == "genre" && game.reason_label.starts_with("Gênero: ") {
            if let Some(genre_name) = game.reason_label.strip_prefix("Gênero: ") {
                if let Some(entry) = genre_data.get_mut(genre_name) {
                    entry.1 += 1;
                }
            }
        }
    }

    let mut result: Vec<(String, GenreInfluence)> = genre_data
        .into_iter()
        .map(|(name, (contributions, times_as_reason))| {
            let avg = if !contributions.is_empty() {
                contributions.iter().sum::<f32>() / contributions.len() as f32
            } else {
                0.0
            };
            let max = contributions.iter().cloned().fold(0.0, f32::max);

            (
                name,
                GenreInfluence {
                    games_count: contributions.len(),
                    avg_contribution: avg,
                    max_contribution: max,
                    times_as_reason,
                },
            )
        })
        .collect();

    result.sort_by(|a, b| {
        b.1.avg_contribution
            .partial_cmp(&a.1.avg_contribution)
            .unwrap()
    });

    result
}

fn calculate_reason_distribution(games: &[DetailedScoreBreakdown]) -> HashMap<String, usize> {
    let mut distribution = HashMap::new();
    for game in games {
        *distribution.entry(game.reason_label.clone()).or_insert(0) += 1;
    }
    distribution
}

fn calculate_profile_stats(profile: &UserPreferenceVector) -> ProfileStats {
    let mut profile_genres: Vec<(String, f32)> = profile
        .genres
        .iter()
        .map(|(k, v)| (k.clone(), *v))
        .collect();
    profile_genres.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

    let mut profile_tags_temp: Vec<(String, f32)> = profile
        .tags
        .iter()
        .map(|(k, v)| (format!("{:?}:{}", k.category, k.slug), *v))
        .collect();
    profile_tags_temp.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

    let profile_tags: Vec<(String, String, f32)> = profile_tags_temp
        .into_iter()
        .take(20)
        .map(|(key, val)| {
            let parts: Vec<&str> = key.split(':').collect();
            (parts.get(1).unwrap_or(&"").to_string(), key.clone(), val)
        })
        .collect();

    ProfileStats {
        total_genres: profile.genres.len(),
        total_tags: profile.tags.len(),
        total_series: profile.series.len(),
        top_genres: profile_genres.into_iter().take(10).collect(),
        top_tags: profile_tags,
    }
}
