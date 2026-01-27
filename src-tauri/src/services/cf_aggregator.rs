use serde::Deserialize;
use std::collections::HashMap;

use crate::services::recommendation::{calculate_game_weight, GameWithDetails};

#[derive(Debug, Deserialize)]
struct CollaborativeIndexRaw {
    version: String,
    generated_at: String,
    source: String,
    index: HashMap<String, Vec<Similar>>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct Similar {
    pub app_id: u32,
    pub score: f32,
}

pub type CFIndex = HashMap<u32, Vec<Similar>>;

/// Carrega o índice CF exportado pelo Python
pub fn load_cf_index(path: &str) -> anyhow::Result<CFIndex> {
    let json = std::fs::read_to_string(path)?;
    let raw: CollaborativeIndexRaw = serde_json::from_str(&json)?;

    let index = raw
        .index
        .into_iter()
        .filter_map(|(k, v)| k.parse::<u32>().ok().map(|id| (id, v)))
        .collect();

    Ok(index)
}

/// Agrega candidatos CF a partir da biblioteca do usuário
///
/// Retorna:
/// HashMap<steam_app_id, cf_score>
pub fn build_cf_candidates(
    cf_index: &CFIndex,
    user_games: &[GameWithDetails],
) -> HashMap<u32, f32> {
    let mut scores: HashMap<u32, f32> = HashMap::new();

    for game in user_games {
        let Some(steam_id) = game.steam_app_id else {
            continue; // jogos sem Steam ID ficam fora do CF
        };

        let Some(similars) = cf_index.get(&steam_id) else {
            continue;
        };

        let source_weight = calculate_game_weight(&game.game);

        for similar in similars {
            if similar.score <= 0.0 {
                continue;
            }

            *scores.entry(similar.app_id).or_insert(0.0) += similar.score * source_weight;
        }
    }

    scores
}
