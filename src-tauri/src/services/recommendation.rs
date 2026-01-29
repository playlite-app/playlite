//! Sistema de Recomendação v3.0 - Content-Based Filtering com Tags Categorizadas
//!
//! Features:
//! - Usa dados de game_details (genres, tags categorizadas, series)
//! - Penaliza jogos antigos (decaimento temporal)
//! - Sistema de pesos por categoria de tag
//! - Tags com relevância individual
//! - Com suporte a feedback, explicações e configuração dinâmica
//! - Integração com Filtragem Colaborativa (CF)

use crate::models::Game;
use crate::utils::tag_utils::{category_multiplier, TagKey};
use chrono::Datelike;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

// === CONFIGURAÇÃO DE PESOS DO ALGORITMO ===

/// Peso base por hora jogada (limitado a 100h para evitar outliers)
const WEIGHT_PLAYTIME_HOUR: f32 = 1.2;

/// Bônus para jogos marcados como favoritos
const WEIGHT_FAVORITE: f32 = 30.0;

/// Peso por estrela de avaliação do usuário (1-5 estrelas)
const WEIGHT_USER_RATING: f32 = 8.0;

/// Multiplicador para gêneros (peso padrão)
const WEIGHT_GENRE: f32 = 1.0;

/// Multiplicador para séries (peso moderado - evita viés excessivo)
const WEIGHT_SERIES: f32 = 0.8;

// === ESTRUTURAS DE CONFIGURAÇÃO E RETORNO ===

/// Configuração dinâmica dos pesos de recomendação (vinda do Frontend)
#[derive(Debug, Deserialize, Clone)]
pub struct RecommendationConfig {
    pub content_weight: f32,       // Padrão: 0.65
    pub collaborative_weight: f32, // Padrão: 0.35
    pub age_decay: f32,            // Padrão: 0.95
    pub favor_series: bool,        // Padrão: true
}

impl Default for RecommendationConfig {
    fn default() -> Self {
        Self {
            content_weight: 0.65,
            collaborative_weight: 0.35,
            age_decay: 0.95,
            favor_series: true,
        }
    }
}

/// Motivo da recomendação (Explicabilidade)
#[derive(Debug, Serialize, Clone)]
pub struct RecommendationReason {
    pub label: String,   // ex: "Fãs de RPG", "Série Favorita", "Parecido com..."
    pub type_id: String, // "genre", "series", "community", "tag"
}

// === ESTRUTURAS DE DADOS - JOGOS E USUÁRIOS ===

/// Detalhes completos de um jogo (união de Game + GameDetails)
#[derive(Debug, Clone)]
pub struct GameWithDetails {
    pub game: Game,
    pub genres: Vec<String>,
    pub tags: Vec<crate::models::GameTag>,
    pub series: Option<String>,
    pub release_year: Option<i32>,
    pub steam_app_id: Option<u32>,
}

/// Vetor de preferências do usuário com múltiplas dimensões
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserPreferenceVector {
    pub genres: HashMap<String, f32>,
    pub tags: HashMap<TagKey, f32>,
    pub series: HashMap<String, f32>,
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
///
/// **Nota:**
/// Ignora jogs que estão na blacklist (feedback negativo).
pub fn calculate_user_profile(
    games: &[GameWithDetails],
    ignored_ids: &HashSet<String>,
) -> UserPreferenceVector {
    let mut profile = UserPreferenceVector {
        genres: HashMap::new(),
        tags: HashMap::new(),
        series: HashMap::new(),
        total_playtime: 0,
        total_games: 0,
    };

    for game_wrapper in games {
        // Pula jogos negativados pelo usuário
        if ignored_ids.contains(&game_wrapper.game.id) {
            continue;
        }

        profile.total_games += 1;
        profile.total_playtime += game_wrapper.game.playtime.unwrap_or(0);

        let mut weight = 1.0;

        // Penalização por tempo de jogo (limitado a 100h)
        if let Some(playtime) = game_wrapper.game.playtime {
            let hours = (playtime as f32 / 60.0).min(100.0);
            weight += hours * WEIGHT_PLAYTIME_HOUR;
        }

        // Fator Favorito
        if game_wrapper.game.favorite {
            weight += WEIGHT_FAVORITE;
        }

        // Fator Rating
        if let Some(rating) = game_wrapper.game.user_rating {
            weight += (rating as f32) * WEIGHT_USER_RATING;
        }

        // Processamento de gêneros
        for genre in &game_wrapper.genres {
            if !genre.is_empty() && genre != "Desconhecido" {
                *profile.genres.entry(genre.clone()).or_insert(0.0) += weight * WEIGHT_GENRE;
            }
        }

        // Processamento de tags
        for tag in &game_wrapper.tags {
            let key = TagKey::new(tag.category.clone(), tag.slug.clone());
            let tag_weight = weight * tag.relevance * category_multiplier(&tag.category);
            *profile.tags.entry(key).or_insert(0.0) += tag_weight;
        }

        // Processamento de séries
        if let Some(series) = &game_wrapper.series {
            *profile.series.entry(series.clone()).or_insert(0.0) += weight * WEIGHT_SERIES;
        }
    }

    profile
}

/// Calcula o peso/importância de um jogo individual
pub(crate) fn calculate_game_weight(game: &Game) -> f32 {
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

// === SISTEMA DE SCORING E EXPLICAÇÃO ===

/// Calcula score e gera a explicação
fn score_game(
    profile: &UserPreferenceVector,
    game: &GameWithDetails,
    config: &RecommendationConfig,
) -> (f32, Option<RecommendationReason>) {
    let mut score = 0.0;
    let mut best_reason: Option<RecommendationReason> = None;
    let mut max_contribution = 0.0;

    // 1. Score de Gêneros
    for genre in &game.genres {
        if let Some(&val) = profile.genres.get(genre) {
            score += val.min(50.0);
            if val > max_contribution {
                max_contribution = val;
                best_reason = Some(RecommendationReason {
                    label: format!("Fãs de {}", genre),
                    type_id: "genre".to_string(),
                });
            }
        }
    }

    // 2. Score de Séries (Bônus Moderado)
    if config.favor_series {
        if let Some(series) = &game.series {
            if let Some(&val) = profile.series.get(series) {
                let series_bonus = val.sqrt();
                score += series_bonus;

                if series_bonus > max_contribution {
                    max_contribution = series_bonus;
                    best_reason = Some(RecommendationReason {
                        label: format!("Série {}", series),
                        type_id: "series".to_string(),
                    });
                }
            }
        }
    }

    // 3. Score de Tags
    for tag in &game.tags {
        let key = TagKey::new(tag.category.clone(), tag.slug.clone());
        if let Some(&val) = profile.tags.get(&key) {
            score += val;

            if val > max_contribution {
                max_contribution = val;
                best_reason = Some(RecommendationReason {
                    label: format!("Tag: {}", tag.name),
                    type_id: "tag".to_string(),
                });
            }
        }
    }

    // 4. Penalização por Idade (Decaimento)
    if let Some(release_year) = game.release_year {
        let current_year = chrono::Local::now().year();
        let age = (current_year - release_year).clamp(0, 15);
        if age > 0 {
            let multiplier = config.age_decay.powi(age);
            score *= multiplier;
        }
    }

    (score, best_reason)
}

// === FUNÇÕES DE RANQUEAMENTO ===

/// Híbrido: Content-Based + Collaborative + Explicação + Configuração
pub fn rank_games_hybrid(
    profile: &UserPreferenceVector,
    candidates: &[GameWithDetails],
    cf_scores: &HashMap<u32, f32>,
    ignored_ids: &HashSet<String>,
    config: RecommendationConfig,
) -> Vec<(GameWithDetails, f32, RecommendationReason)> {
    // Passo 1: Calcular scores brutos (CB e CF)
    let raw_results: Vec<_> = candidates
        .iter()
        .filter(|g| !ignored_ids.contains(&g.game.id)) // Filtra ignorados
        .map(|g| {
            let (cb_score, cb_reason) = score_game(profile, g, &config);

            let cf_score = g
                .steam_app_id
                .and_then(|id| cf_scores.get(&id))
                .cloned()
                .unwrap_or(0.0);

            (g.clone(), cb_score, cf_score, cb_reason)
        })
        .collect();

    // Passo 2: Normalização para misturar escalas diferentes
    let max_cb = raw_results
        .iter()
        .map(|(_, c, _, _)| *c)
        .fold(0.0, f32::max);
    let max_cf = raw_results
        .iter()
        .map(|(_, _, c, _)| *c)
        .fold(0.0, f32::max);

    // Passo 3: Combinação ponderada e decisão da explicação final
    let mut ranked: Vec<_> = raw_results
        .into_iter()
        .filter_map(|(g, cb, cf, cb_reason)| {
            let cb_n = normalize_score(cb, max_cb);
            let cf_n = normalize_score(cf, max_cf);

            let weighted_cb = cb_n * config.content_weight;

            let mut weighted_cf = cf_n * config.collaborative_weight;

            if let Some(series) = &g.series {
                if profile.series.contains_key(series) {
                    weighted_cf *= 0.7;
                }
            }

            if cb == 0.0 && cf == 0.0 {
                return None;
            }

            let final_score = weighted_cb + weighted_cf;

            let reason = match (weighted_cb > 0.0, weighted_cf > 0.0) {
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
            };

            Some((g, final_score, reason))
        })
        .collect();

    // Passo 4: Penalização por múltiplos jogos da mesma série
    let mut series_count: HashMap<String, usize> = HashMap::new();

    for (g, score, _) in ranked.iter_mut() {
        if let Some(series) = &g.series {
            let count = series_count.entry(series.clone()).or_insert(0);

            let penalty = match *count {
                0 => 1.0,
                1 => 0.85,
                2 => 0.65,
                _ => 0.4,
            };

            *score *= penalty;
            *count += 1;
        }
    }

    // Passo 5: Penalização por múltiplos jogos do mesmo gênero
    let mut genre_count: HashMap<String, usize> = HashMap::new();

    for (g, score, _) in ranked.iter_mut() {
        for genre in &g.genres {
            let count = genre_count.entry(genre.clone()).or_insert(0);
            if *count > 2 {
                *score *= 0.9;
            }
            *count += 1;
        }
    }

    // Ordenação final
    ranked.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

    ranked
}

/// Rankeamento puramente Content-Based
pub fn rank_games_content_based(
    profile: &UserPreferenceVector,
    candidates: &[GameWithDetails],
    config: &RecommendationConfig,
) -> Vec<(GameWithDetails, f32, RecommendationReason)> {
    let mut ranked: Vec<_> = candidates
        .iter()
        .map(|g| {
            let (score, reason) = score_game(profile, g, config);

            // Garante que sempre tem uma razão
            let final_reason = reason.unwrap_or(RecommendationReason {
                label: "Baseado no seu perfil".to_string(),
                type_id: "general".to_string(),
            });

            (g.clone(), score, final_reason)
        })
        .filter(|(_, score, _)| *score > 0.0)
        .collect();

    ranked.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

    ranked
}

/// Rankeamento puramente Colaborativo
pub fn rank_games_collaborative(
    candidates: &[GameWithDetails],
    cf_scores: &HashMap<u32, f32>,
) -> Vec<(GameWithDetails, f32, RecommendationReason)> {
    let mut ranked: Vec<_> = candidates
        .iter()
        .filter_map(|g| {
            let steam_id = g.steam_app_id?;
            let score = cf_scores.get(&steam_id).cloned()?;

            if score <= 0.0 {
                return None;
            }

            let reason = RecommendationReason {
                label: "Tendência na Comunidade".to_string(),
                type_id: "community".to_string(),
            };

            Some((g.clone(), score, reason))
        })
        .collect();

    ranked.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

    ranked
}

// === UTILITÁRIOS ===

/// Parse de ano a partir de data ISO 8601 (YYYY-MM-DD)
pub fn parse_release_year(date_str: &str) -> Option<i32> {
    date_str.split('-').next()?.parse().ok()
}

/// Normaliza um score dividindo pelo valor máximo
fn normalize_score(score: f32, max: f32) -> f32 {
    if max > 0.0 {
        score / max
    } else {
        0.0
    }
}
