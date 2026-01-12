//! Serviço de integração com HowLongToBeat (HLTB)
//!
//! Baseado na API interna do site.

use crate::utils::http_client::HTTP_CLIENT;
use serde::{Deserialize, Serialize};
use serde_json::json;

const API_URL: &str = "https://howlongtobeat.com/api/search";

// Estruturas para deserializar a resposta do HLTB
#[derive(Debug, Deserialize)]
pub struct HltbResponse {
    pub data: Vec<HltbGameRaw>,
}

#[derive(Debug, Deserialize)]
pub struct HltbGameRaw {
    #[serde(rename = "game_name")]
    pub name: String,
    // A API retorna em segundos
    #[serde(rename = "comp_main")]
    pub comp_main: i32,
    #[serde(rename = "comp_plus")]
    pub comp_plus: i32,
    #[serde(rename = "comp_100")]
    pub comp_100: i32,
}

#[derive(Debug, Serialize)]
pub struct HltbResult {
    pub main_story: i32,    // Horas
    pub main_extra: i32,    // Horas
    pub completionist: i32, // Horas
}

/// Busca tempos de jogo no HLTB
pub async fn search(game_name: &str) -> Result<Option<HltbResult>, String> {
    // Payload específico exigido pela API do HLTB
    let payload = json!({
        "searchType": "games",
        "searchTerms": [game_name],
        "searchPage": 1,
        "size": 5,
        "searchOptions": {
            "games": {
                "userId": 0,
                "platform": "",
                "sortCategory": "popular",
                "rangeCategory": "main",
                "rangeTime": { "min": 0, "max": 0 }
            }
        }
    });

    let res = HTTP_CLIENT
        .post(API_URL)
        .header("Referer", "https://howlongtobeat.com/")
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Erro HLTB API: {}", res.status()));
    }

    let response: HltbResponse = res.json().await.map_err(|e| e.to_string())?;

    // Pega o primeiro resultado (geralmente o mais relevante por ser ordenado por popularidade)
    if let Some(game) = response.data.into_iter().next() {
        // Conversão: Segundos -> Horas (arredondado) - Ex: 36000s -> 10h
        Ok(Some(HltbResult {
            main_story: (game.comp_main as f32 / 3600.0).round() as i32,
            main_extra: (game.comp_plus as f32 / 3600.0).round() as i32,
            completionist: (game.comp_100 as f32 / 3600.0).round() as i32,
        }))
    } else {
        Ok(None) // Nenhum jogo encontrado
    }
}
