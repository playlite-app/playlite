//! Comandos Tauri para Sistema de Recomendação v2.1
//!
//! Faz JOIN com game_details para obter genres, tags categorizadas e series

use crate::database::AppState;
use crate::errors::AppError;
use crate::models::Game;
use crate::services::recommendation::{
    calculate_user_profile, parse_release_year, rank_games, score_game, GameWithDetails,
};
use serde::Serialize;
use std::collections::HashMap;
use tauri::State;

/// Estrutura simplificada de recomendação (game_id + score)
#[derive(Debug, Serialize)]
pub struct GameRecommendation {
    pub game_id: String,
    pub score: f32,
}

/// Retorna o perfil do usuário formatado para o frontend.
/// Converte TagKey para formato "category:slug" para facilitar uso no frontend.
/// Tags são retornadas como Record<string, number> no formato "category:slug"
#[tauri::command]
pub fn get_user_profile(state: State<AppState>) -> Result<serde_json::Value, AppError> {
    let games = fetch_all_games_with_details(&state)?;
    let profile = calculate_user_profile(&games);

    // Converte tags para formato mais amigável: "category:slug"
    let tags_formatted: HashMap<String, f32> = profile
        .tags
        .into_iter()
        .map(|(key, score)| {
            let tag_key = format!(
                "{}:{}",
                serde_json::to_string(&key.category)
                    .unwrap_or_default()
                    .trim_matches('"')
                    .to_lowercase(),
                key.slug
            );
            (tag_key, score)
        })
        .collect();

    Ok(serde_json::json!({
        "genres": profile.genres,
        "tags": tags_formatted,
        "series": profile.series,
        "totalPlaytime": profile.total_playtime,
        "totalGames": profile.total_games,
    }))
}

/// Ranqueia jogos da biblioteca do usuário baseado em afinidade
#[tauri::command]
pub fn recommend_from_library(
    state: State<AppState>,
    min_playtime: Option<i32>,
    max_playtime: Option<i32>,
    limit: Option<usize>,
) -> Result<Vec<GameRecommendation>, AppError> {
    let all_games = fetch_all_games_with_details(&state)?;
    let profile = calculate_user_profile(&all_games);

    // Filtra jogos candidatos (pouco jogados)
    let min = min_playtime.unwrap_or(0);
    let max = max_playtime.unwrap_or(60); // Default 60 min (1h)

    let candidates: Vec<GameWithDetails> = all_games
        .into_iter()
        .filter(|g| {
            let playtime = g.game.playtime.unwrap_or(0);
            playtime >= min && playtime <= max
        })
        .collect();

    if candidates.is_empty() {
        return Ok(vec![]);
    }

    let mut ranked = rank_games(&profile, &candidates);

    // Limita quantidade de resultados
    if let Some(lim) = limit {
        ranked.truncate(lim);
    }

    // Converte para formato simplificado
    let result: Vec<GameRecommendation> = ranked
        .into_iter()
        .map(|(game, score)| GameRecommendation {
            game_id: game.game.id,
            score,
        })
        .collect();

    Ok(result)
}

/// Retorna jogos da biblioteca do usuário baseados em scores CF calculados a partir do índice.
#[tauri::command]
pub async fn recommend_collaborative_library(
    state: State<'_, AppState>,
    min_playtime: Option<i32>,
    max_playtime: Option<i32>,
    limit: usize,
) -> Result<Vec<GameRecommendation>, AppError> {
    // 1. Busca todos os jogos com detalhes
    let games_with_details = fetch_all_games_with_details(&state)?;

    // 2. Calcula os scores CF baseados no histórico do usuário
    // (Usa a função existente no cf_aggregator)
    let (cf_scores, stats) =
        crate::services::cf_aggregator::build_cf_candidates(&games_with_details);

    // Se não houver matches suficientes, retorna vazio para não mostrar seção "quebrada"
    if stats.games_with_cf_match == 0 {
        return Ok(vec![]);
    }

    // 3. Filtra candidatos (Backlog: jogos pouco jogados)
    let min = min_playtime.unwrap_or(0);
    let max = max_playtime.unwrap_or(999999);

    let candidates: Vec<_> = games_with_details
        .into_iter()
        .filter(|g| {
            let pt = g.game.playtime.unwrap_or(0);
            pt >= min && pt <= max
        })
        .collect();

    // 4. Ranqueia usando a NOVA função Pura (CF Only)
    let ranked = crate::services::recommendation::rank_games_collaborative(&candidates, &cf_scores);

    // 5. Formata retorno
    let result = ranked
        .into_iter()
        .take(limit)
        .map(|(g, score)| GameRecommendation {
            game_id: g.game.id,
            score,
        })
        .collect();

    Ok(result)
}

/// Recomenda jogos usando uma abordagem HÍBRIDA (Content-Based + Collaborative).
#[tauri::command]
pub async fn recommend_hybrid_library(
    state: State<'_, AppState>,
    min_playtime: Option<i32>,
    max_playtime: Option<i32>,
    limit: usize,
) -> Result<Vec<GameRecommendation>, AppError> {
    // 1. Busca todos os jogos
    let games_with_details = fetch_all_games_with_details(&state)?;

    // 2. Calcula o Perfil do Usuário (Content-Based)
    let profile = calculate_user_profile(&games_with_details);

    // 3. Calcula os scores Sociais (Collaborative Filtering)
    // Nota: Mesmo que o CF falhe ou retorne vazio, o híbrido funciona (cai para CB puro)
    let (cf_scores, _) = crate::services::cf_aggregator::build_cf_candidates(&games_with_details);

    // 4. Filtra candidatos (Backlog: jogos pouco jogados)
    let min = min_playtime.unwrap_or(0);
    let max = max_playtime.unwrap_or(999999);

    let candidates: Vec<_> = games_with_details
        .into_iter()
        .filter(|g| {
            let pt = g.game.playtime.unwrap_or(0);
            pt >= min && pt <= max
        })
        .collect();

    // 5. Ranqueia usando a função HÍBRIDA que você já criou
    // Ela usa pesos: 65% CB + 35% CF (conforme recommendation.rs)
    let ranked =
        crate::services::recommendation::rank_games_hybrid(&profile, &candidates, &cf_scores);

    // 6. Formata retorno
    let result = ranked
        .into_iter()
        .take(limit)
        .map(|(g, score)| GameRecommendation {
            game_id: g.game.id,
            score,
        })
        .collect();

    Ok(result)
}

/// Calcula o score de afinidade de um jogo específico
#[tauri::command]
pub fn get_game_affinity(state: State<AppState>, game_id: String) -> Result<f32, AppError> {
    let all_games = fetch_all_games_with_details(&state)?;
    let profile = calculate_user_profile(&all_games);

    let game = all_games
        .into_iter()
        .find(|g| g.game.id == game_id)
        .ok_or_else(|| AppError::NotFound(format!("Jogo {} não encontrado", game_id)))?;

    let score = score_game(&profile, &game);
    Ok(score)
}

// === HELPER FUNCTIONS - JOIN COM game_details ===

/// Busca todos os jogos COM detalhes (JOIN com game_details)
fn fetch_all_games_with_details(state: &State<AppState>) -> Result<Vec<GameWithDetails>, AppError> {
    let conn = state.library_db.lock()?;

    let mut stmt = conn.prepare(
        "SELECT
            g.id, g.name, g.cover_url, d.developer, g.platform, g.platform_id,
            g.install_path, g.executable_path, g.launch_args,
            g.user_rating, g.favorite, g.status, g.playtime, g.last_played, g.added_at,
            COALESCE(d.is_adult, 0), -- 15: is_adult
            d.genres,                -- 16: genres
            d.tags,                  -- 17: tags (JSON de GameTag[])
            d.series,                -- 18: series
            d.release_date,          -- 19: release_date
            d.steam_app_id           -- 20: steam_app_id
         FROM games g
         LEFT JOIN game_details d ON g.id = d.game_id",
    )?;

    let games_iter = stmt.query_map([], |row| {
        // Monta Game base
        let game = Game {
            id: row.get(0)?,
            name: row.get(1)?,
            cover_url: row.get(2)?,
            genres: None,
            developer: row.get(3)?,
            platform: row.get(4)?,
            platform_id: row.get(5)?,
            install_path: row.get(6)?,
            executable_path: row.get(7)?,
            launch_args: row.get(8)?,
            user_rating: row.get(9)?,
            favorite: row.get(10)?,
            status: row.get(11)?,
            playtime: row.get(12)?,
            last_played: row.get(13)?,
            added_at: row.get(14)?,
            is_adult: row.get(15)?,
        };

        // Processa genres
        let genres_str: Option<String> = row.get(16)?;
        let genres = genres_str
            .as_ref()
            .map(|s| {
                s.split(',')
                    .map(|g| g.trim().to_string())
                    .filter(|g| !g.is_empty() && g != "Desconhecido")
                    .collect()
            })
            .unwrap_or_default();

        // Processa tags
        let tags_json: Option<String> = row.get(17)?;
        let tags: Vec<crate::models::GameTag> = tags_json
            .as_ref()
            .and_then(|json| serde_json::from_str(json).ok())
            .unwrap_or_default();

        // Series
        let series: Option<String> = row.get(18)?;

        // Release year
        let release_date: Option<String> = row.get(19)?;
        let release_year = release_date.as_ref().and_then(|d| parse_release_year(d));

        // Steam App ID (convertido de String para u32)
        let steam_app_id: Option<String> = row.get(20)?;
        let steam_app_id = steam_app_id.and_then(|s| s.parse::<u32>().ok());

        Ok(GameWithDetails {
            game,
            genres,
            tags,
            series,
            release_year,
            steam_app_id,
        })
    })?;

    Ok(games_iter.collect::<Result<Vec<_>, _>>()?)
}
