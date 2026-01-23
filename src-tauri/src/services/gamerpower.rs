//! Integração com GamerPower API para buscar jogos grátis.
//!
//! Fornece funcionalidades para obter ofertas ativas de jogos gratuitos para PC.
//! A GamerPower é uma plataforma que agrega ofertas de jogos gratuitos de várias fontes.

use crate::utils::http_client::HTTP_CLIENT;
use serde::{Deserialize, Serialize};

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
pub async fn fetch_giveaways() -> Result<Vec<Giveaway>, String> {
    // platform=pc -> filtra mobile/console
    // type=game -> busca jogos completos
    let url = "https://www.gamerpower.com/api/giveaways?platform=pc&type=game&sort-by=popularity";

    let res = HTTP_CLIENT
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Erro ao conectar GamerPower: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("Erro API GamerPower: {}", res.status()));
    }

    let giveaways: Vec<Giveaway> = res.json().await.map_err(|e| e.to_string())?;

    // Filtra apenas ativos
    let active_ones = giveaways
        .into_iter()
        .filter(|g| g.status == "Active")
        .collect();

    Ok(active_ones)
}
