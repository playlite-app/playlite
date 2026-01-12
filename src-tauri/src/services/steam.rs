//! Módulo de integração com as APIs Steam.
//!
//! Módulo de integração estrita com a conta de usuário Steam.
//! Focado apenas em dados privados (OwnedGames).

use crate::utils::http_client::HTTP_CLIENT;
use serde::{Deserialize, Serialize};

// === Estruturas ===

#[derive(Debug, Deserialize, Serialize)]
pub struct SteamGame {
    pub appid: u32,
    pub name: String,
    pub playtime_forever: i32, // Minutos
    pub img_icon_url: Option<String>,
    #[serde(default)]
    pub rtime_last_played: i64,
}

#[derive(Debug, Deserialize, Serialize)]
struct SteamResponseData {
    game_count: u32,
    games: Vec<SteamGame>,
}

#[derive(Debug, Deserialize, Serialize)]
struct SteamApiResponse {
    response: SteamResponseData,
}

// === FUNÇÕES PÚBLICAS ===

/// Lista todos os jogos da biblioteca de um usuário Steam.
pub async fn list_steam_games(api_key: &str, steam_id: &str) -> Result<Vec<SteamGame>, String> {
    let url = format!(
        "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key={}&steamid={}&format=json&include_appinfo=true&include_played_free_games=true",
        api_key, steam_id
    );

    let res = HTTP_CLIENT
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Erro Steam API: {}", res.status()));
    }

    let api_data: SteamApiResponse = res.json().await.map_err(|e| format!("JSON Error: {}", e))?;
    Ok(api_data.response.games)
}
