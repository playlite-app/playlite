//! Integração com GamerPower API para buscar jogos grátis.
//!
//! Fornece funcionalidades para obter ofertas ativas de jogos gratuitos para PC.
//! A GamerPower é uma plataforma que agrega ofertas de jogos gratuitos de várias fontes.

use crate::database::AppState;
use crate::services::cache;
use crate::utils::http_client::HTTP_CLIENT;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Giveaway {
    pub id: u32,
    pub title: String,
    pub worth: String,     // ex: "$29.99" or "N/A"
    pub thumbnail: String, // Imagem pequena
    pub image: String,     // Imagem grande (Landscape) - Usaremos essa no card estilo Epic
    pub description: String,
    pub instructions: String,
    #[serde(rename = "open_giveaway_url")]
    pub open_giveaway_url: String,
    #[serde(rename = "published_date")]
    pub published_date: String,
    #[serde(rename = "type")]
    pub type_prop: String, // "Game", "DLC"
    pub platforms: String, // "PC, Steam, Epic Games Store"
    #[serde(rename = "end_date")]
    pub end_date: Option<String>,
    pub status: String, // "Active"
}

/// Busca ofertas ativas para PC
pub async fn fetch_giveaways(app: &AppHandle) -> Result<Vec<Giveaway>, String> {
    let cache_key = "gamerpower_list_active";
    let url = "https://www.gamerpower.com/api/giveaways?platform=pc&type=game&sort-by=popularity";

    // 1. Tenta buscar ONLINE
    match HTTP_CLIENT.get(url).send().await {
        Ok(res) => {
            if res.status().is_success() {
                let giveaways: Vec<Giveaway> = res.json().await.map_err(|e| e.to_string())?;

                // Filtra apenas ativos
                let active_ones: Vec<Giveaway> = giveaways
                    .into_iter()
                    .filter(|g| g.status == "Active")
                    .collect();

                // Sucesso: Salva a lista filtrada no Cache
                if let Ok(conn) = app.state::<AppState>().metadata_db.lock() {
                    if let Ok(json) = serde_json::to_string(&active_ones) {
                        // Usamos "gamerpower" como source
                        let _ = cache::save_cached_api_data(&conn, "gamerpower", cache_key, &json);
                    }
                }

                return Ok(active_ones);
            }
        }
        Err(_) => {} // Fallback
    }

    // 2. FALLBACK: Cache Offline
    if let Ok(conn) = app.state::<AppState>().metadata_db.lock() {
        if let Some(payload) = cache::get_stale_api_data(&conn, "gamerpower", cache_key) {
            if let Ok(cached_giveaways) = serde_json::from_str::<Vec<Giveaway>>(&payload) {
                return Ok(cached_giveaways);
            }
        }
    }

    Err("Não foi possível carregar jogos grátis (sem conexão e sem cache).".to_string())
}
