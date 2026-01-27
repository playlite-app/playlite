//! Comandos Tauri para Sistema de Recomendação v3.0
//!
//! Faz JOIN com game_details para obter genres, tags categorizadas e series
//! Utiliza abordagem híbrida: perfil do usuário + collaborative filtering
//! Permite configuração de filtros (playtime), pesos personalizados, feedback (blacklist)
//! Retorna razões detalhadas para cada recomendação

use crate::database::AppState;
use crate::errors::AppError;
use crate::models::Game;
use crate::services::recommendation::{
    calculate_user_profile, parse_release_year, rank_games_hybrid, GameWithDetails,
    RecommendationConfig, RecommendationReason,
};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use tauri::State;

// === ESTRUTURAS DE DADOS ===

/// Estrutura completa de recomendação para o Frontend
#[derive(Debug, Serialize)]
pub struct GameRecommendation {
    pub game_id: String,
    pub score: f32,
    pub reason: RecommendationReason,
}

/// Struct auxiliar para input de configuração opcional
#[derive(Debug, Deserialize)]
pub struct RecommendationOptions {
    pub min_playtime: Option<i32>,
    pub max_playtime: Option<i32>,
    pub limit: usize,
    pub ignored_game_ids: Option<Vec<String>>, // Blacklist do feedback
    pub config: Option<RecommendationConfig>,  // Pesos personalizados
}

// === COMANDO HÍBRIDO PRINCIPAL ===

/// Comando Híbrido Principal (Usado na Playlist e Home)
///
/// Retorna recomendações de jogos baseadas em perfil do usuário + collaborative filtering.
#[tauri::command]
pub async fn recommend_hybrid_library(
    state: State<'_, AppState>,
    options: RecommendationOptions,
) -> Result<Vec<GameRecommendation>, AppError> {
    // 1. Busca todos os jogos
    let games_with_details = fetch_all_games_with_details(&state)?;

    // 2. Prepara Blacklist
    let ignored_ids: HashSet<String> = options
        .ignored_game_ids
        .unwrap_or_default()
        .into_iter()
        .collect();

    // 3. Calcula Perfil (Ignorando jogos da blacklist)
    let profile = calculate_user_profile(&games_with_details, &ignored_ids);

    // 4. Calcula Collaborative Filtering
    let (cf_scores, _) = crate::services::cf_aggregator::build_cf_candidates(&games_with_details);

    // 5. Filtra Candidatos (Backlog)
    let min = options.min_playtime.unwrap_or(0);
    let max = options.max_playtime.unwrap_or(999999);

    let candidates: Vec<_> = games_with_details
        .into_iter()
        .filter(|g| {
            let pt = g.game.playtime.unwrap_or(0);
            pt >= min && pt <= max
        })
        .collect();

    // 6. Configuração (Usa padrão se não fornecida)
    let config = options.config.unwrap_or_default();

    // 7. Executa Rankeamento Híbrido com Feedback
    let ranked = rank_games_hybrid(&profile, &candidates, &cf_scores, &ignored_ids, config);

    // 8. Formata Resposta
    let result = ranked
        .into_iter()
        .take(options.limit)
        .map(|(g, score, reason)| GameRecommendation {
            game_id: g.game.id,
            score,
            reason,
        })
        .collect();

    Ok(result)
}

// === COMANDOS ESPECÍFICOS ===

/// Recomendação Content-Based Pura
#[tauri::command]
pub async fn recommend_from_library(
    state: State<'_, AppState>,
    min_playtime: Option<i32>,
    max_playtime: Option<i32>,
    limit: usize,
) -> Result<Vec<GameRecommendation>, AppError> {
    let games_with_details = fetch_all_games_with_details(&state)?;

    // Nota: Para CB puro ignora a blacklist
    let ignored_ids = HashSet::new();

    let profile = calculate_user_profile(&games_with_details, &ignored_ids);

    let min = min_playtime.unwrap_or(0);
    let max = max_playtime.unwrap_or(999999);

    let candidates: Vec<_> = games_with_details
        .into_iter()
        .filter(|g| {
            let pt = g.game.playtime.unwrap_or(0);
            pt >= min && pt <= max
        })
        .collect();

    // Usa config padrão
    let config = RecommendationConfig::default();

    let ranked =
        crate::services::recommendation::rank_games_content_based(&profile, &candidates, &config);

    let result = ranked
        .into_iter()
        .take(limit)
        .map(|(g, score, reason)| GameRecommendation {
            game_id: g.game.id,
            score,
            reason,
        })
        .collect();

    Ok(result)
}

/// Recomendação Colaborativa Pura
#[tauri::command]
pub async fn recommend_collaborative_library(
    state: State<'_, AppState>,
    min_playtime: Option<i32>,
    max_playtime: Option<i32>,
    limit: usize,
) -> Result<Vec<GameRecommendation>, AppError> {
    let games_with_details = fetch_all_games_with_details(&state)?;

    // CF não depende do profile, apenas dos scores pré-calculados
    let (cf_scores, stats) =
        crate::services::cf_aggregator::build_cf_candidates(&games_with_details);

    if stats.games_with_cf_match == 0 {
        return Ok(vec![]);
    }

    let min = min_playtime.unwrap_or(0);
    let max = max_playtime.unwrap_or(999999);

    let candidates: Vec<_> = games_with_details
        .into_iter()
        .filter(|g| {
            let pt = g.game.playtime.unwrap_or(0);
            pt >= min && pt <= max
        })
        .collect();

    let ranked = crate::services::recommendation::rank_games_collaborative(&candidates, &cf_scores);

    let result = ranked
        .into_iter()
        .take(limit)
        .map(|(g, score, reason)| GameRecommendation {
            game_id: g.game.id,
            score,
            reason,
        })
        .collect();

    Ok(result)
}

// === HELPER FUNCTIONS ===

/// Retorna o perfil do usuário formatado para o frontend.
///
/// Converte TagKey para formato "category:slug" para facilitar uso no frontend.
/// Tags são retornadas como Record<string, number> no formato "category:slug"
#[tauri::command]
pub fn get_user_profile(state: State<AppState>) -> Result<serde_json::Value, AppError> {
    let games = fetch_all_games_with_details(&state)?;
    let ignored_ids = HashSet::new();
    let profile = calculate_user_profile(&games, &ignored_ids);

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

/// Busca todos os jogos COM detalhes (JOIN com game_details)
///
/// Retorna lista de GameWithDetails
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
