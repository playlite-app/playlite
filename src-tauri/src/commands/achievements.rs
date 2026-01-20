//! Comando para buscar conquistas recentes do Steam para o dashboard.
//!
//! Retorna as 5 conquistas mais recentes dos jogos jogados nas últimas 2 semanas.

use crate::database;
use crate::services::steam;
use serde::Serialize;
use tauri::AppHandle;

#[derive(Serialize)]
pub struct DashboardAchievement {
    pub game_name: String,
    pub achievement_name: String,
    pub unlock_time: i64,
    pub game_id: String,
}

/// Busca as 5 conquistas mais recentes dos jogos jogados nas últimas 2 semanas.
/// Retorna uma lista vazia se não houver conquistas ou se as credenciais não estiverem configuradas.
#[tauri::command]
pub async fn get_recent_achievements(app: AppHandle) -> Result<Vec<DashboardAchievement>, String> {
    // 1. Pega credenciais
    let api_key = database::get_secret(&app, "steam_api_key")?;
    let steam_id = database::get_secret(&app, "steam_id")?;

    if api_key.is_empty() || steam_id.is_empty() {
        return Ok(vec![]);
    }

    // 2. Busca jogos recentes (últimas 2 semanas)
    let recent_games = steam::get_recently_played_games(&api_key, &steam_id).await?;

    let mut all_achievements = Vec::new();

    // 3. Para cada jogo recente, busca as conquistas
    for game in recent_games {
        if let Ok(achievements) =
            steam::get_player_achievements(&api_key, &steam_id, game.appid).await
        {
            for ach in achievements {
                // Filtra apenas as desbloqueadas (achieved == 1)
                if ach.achieved == 1 {
                    all_achievements.push(DashboardAchievement {
                        game_name: game.name.clone(),
                        achievement_name: ach.name.unwrap_or(ach.apiname),
                        unlock_time: ach.unlocktime,
                        game_id: game.appid.to_string(),
                    });
                }
            }
        }
    }

    // 4. Ordena: Mais recentes primeiro (unlock_time decrescente)
    all_achievements.sort_by(|a, b| b.unlock_time.cmp(&a.unlock_time));

    // 5. Pega apenas as 5 últimas
    all_achievements.truncate(5);

    Ok(all_achievements)
}
