//! Comandos Tauri para Sistema de Recomendação v2.0
//!
//! Faz JOIN com game_details para obter genres, tags e series

use crate::database::AppState;
use crate::models::Game;
use crate::services::recommendation::{
    calculate_user_profile, parse_release_year, rank_games, score_game, GameWithDetails,
    UserPreferenceVector,
};
use serde::Serialize;
use tauri::State;

/// Estrutura simplificada de recomendação (game_id + score)
#[derive(Debug, Serialize)]
pub struct GameRecommendation {
    pub game_id: String,
    pub score: f32,
}

/// Retorna o perfil completo v2.0 com gêneros, tags e séries
#[tauri::command]
pub fn get_user_profile(state: State<AppState>) -> Result<UserPreferenceVector, String> {
    let games = fetch_all_games_with_details(&state)?;
    let profile = calculate_user_profile(&games);
    Ok(profile)
}

/// Ranqueia jogos da biblioteca do usuário baseado em afinidade
#[tauri::command]
pub fn recommend_from_library(
    state: State<AppState>,
    min_playtime: Option<i32>,
    max_playtime: Option<i32>,
    limit: Option<usize>,
) -> Result<Vec<GameRecommendation>, String> {
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

/// Calcula o score de afinidade de um jogo específico
#[tauri::command]
pub fn get_game_affinity(state: State<AppState>, game_id: String) -> Result<f32, String> {
    let all_games = fetch_all_games_with_details(&state)?;
    let profile = calculate_user_profile(&all_games);

    let game = all_games
        .into_iter()
        .find(|g| g.game.id == game_id)
        .ok_or_else(|| format!("Jogo {} não encontrado", game_id))?;

    let score = score_game(&profile, &game);
    Ok(score)
}

// === HELPER FUNCTIONS - JOIN COM game_details ===

/// Busca todos os jogos COM detalhes (JOIN com game_details)
fn fetch_all_games_with_details(state: &State<AppState>) -> Result<Vec<GameWithDetails>, String> {
    let conn = state
        .library_db
        .lock()
        .map_err(|_| "Falha ao bloquear mutex")?;

    let mut stmt = conn
        .prepare(
            "SELECT
                g.id, g.name, g.cover_url, d.developer, g.platform, g.platform_id,
                g.install_path, g.executable_path, g.launch_args,
                g.user_rating, g.favorite, g.status, g.playtime, g.last_played, g.added_at,
                COALESCE(d.is_adult, 0), -- 15: is_adult
                d.genres,                -- 16: genres
                d.tags,                  -- 17: tags
                d.series,                -- 18: series
                d.release_date           -- 19: release_date
             FROM games g
             LEFT JOIN game_details d ON g.id = d.game_id",
        )
        .map_err(|e| e.to_string())?;

    let games_iter = stmt
        .query_map([], |row| {
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
            let tags_str: Option<String> = row.get(17)?;
            let tags = tags_str
                .as_ref()
                .map(|s| {
                    s.split(',')
                        .map(|t| t.trim().to_string())
                        .filter(|t| !t.is_empty())
                        .collect()
                })
                .unwrap_or_default();

            // Series
            let series: Option<String> = row.get(18)?;

            // Release year
            let release_date: Option<String> = row.get(19)?;
            let release_year = release_date.as_ref().and_then(|d| parse_release_year(d));

            Ok(GameWithDetails {
                game,
                genres,
                tags,
                series,
                release_year,
            })
        })
        .map_err(|e| e.to_string())?;

    games_iter
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}
