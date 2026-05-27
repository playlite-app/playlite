//! Scraper - EA Play

use crate::constants::GAME_PASS_BATCH_SIZE;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use log::info;

// IDs dos catálogos
const EA_PLAY_SIGL: &str = "b8900d09-a491-44cc-916e-32b5acae621b";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EAPlayGame {
    pub store_id: String,
    pub title: String,
    pub description: Option<String>,
    pub image_poster: Option<String>, // capa 2:3 para cards
    pub image_hero: Option<String>,   // banner 16:9 para carrossel
    pub categories: Vec<String>,
    pub developer: Option<String>,
    pub store_url: String,
}

fn parse_ea_play_products(products: &serde_json::Value) -> Vec<EAPlayGame> {
    let mut games = Vec::new();

    let Some(products) = products.as_object() else {
        return games;
    };

    let mut total = 0usize;
    let mut kept = 0usize;
    let mut skipped_type = 0usize;
    let mut skipped_platform = 0usize;
    let mut skipped_other = 0usize;
    let mut skipped_samples: Vec<(String, String)> = Vec::new();

    for (store_id, product) in products {
        total += 1;

        // Filtra não-jogos
        let product_type = product["ProductType"].as_str().unwrap_or("");
        if product_type != "Game" {
            skipped_type += 1;
            if skipped_samples.len() < 5 {
                skipped_samples.push((store_id.clone(), format!("type={}", product_type)));
            }
            continue;
        }

        // Confirma que roda no PC — se o campo estiver ausente ou vazio, NÃO filtra
        // Alguns responses podem usar objetos para AllowedPlatforms em vez de strings,
        // então aceitamos ambos formatos.
        let mut platforms: Vec<String> = Vec::new();
        if let Some(arr) = product["AllowedPlatforms"].as_array() {
            for v in arr {
                if let Some(s) = v.as_str() {
                    platforms.push(s.to_string());
                } else if let Some(obj) = v.as_object() {
                    if let Some(n) = obj.get("Name").and_then(|n| n.as_str()) {
                        platforms.push(n.to_string());
                    } else if let Some(n) = obj.get("Platform").and_then(|n| n.as_str()) {
                        platforms.push(n.to_string());
                    }
                }
            }
        }

        if !platforms.is_empty() {
            // aceita variações como "Windows", "Windows.Desktop", "PC" ou "desktop"
            let has_pc = platforms.iter().any(|p| {
                let s = p.to_lowercase();
                s.contains("windows") || s.contains("pc") || s.contains("desktop")
            });

            if !has_pc {
                skipped_platform += 1;
                if skipped_samples.len() < 5 {
                    skipped_samples.push((store_id.clone(), format!("platforms={:?}", platforms)));
                }
                continue;
            }
        }

        // Categories
        let categories = product["Categories"]
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect()
            })
            .unwrap_or_default();

        // Build game
        let game = EAPlayGame {
            store_id: store_id.clone(),
            title: product["ProductTitle"].as_str().unwrap_or("?").to_string(),
            description: product["ProductDescription"].as_str().map(|s| s.to_string()),
            image_poster: product["ImagePoster"]["URI"].as_str().map(|s| s.to_string()),
            image_hero: product["ImageHero"]["URI"].as_str().map(|s| s.to_string()),
            categories,
            developer: product["DeveloperName"].as_str().map(|s| s.to_string()),
            store_url: format!("https://www.xbox.com/pt-BR/games/store/_/{}", store_id),
        };

        games.push(game);
        kept += 1;
    }

    info!(
        "EA Play: parse stats total={} kept={} skipped_type={} skipped_platform={} skipped_other={} samples={:?}",
        total,
        kept,
        skipped_type,
        skipped_platform,
        skipped_other,
        skipped_samples
    );

    games
}

pub async fn fetch_ea_play_catalog() -> Result<Vec<EAPlayGame>, String> {
    let client = Client::new();

    // Etapa 1 — lista de IDs
    let url = format!(
        "https://catalog.gamepass.com/sigls/v2?id={}&language=pt-br&market=BR",
        EA_PLAY_SIGL
    );

    let sigls: Vec<serde_json::Value> = client
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    info!("EA Play: sigls returned {} entries", sigls.len());

    // Extrai apenas os IDs (pula o primeiro objeto que é metadata do catálogo)
    let ids: Vec<String> = sigls
        .iter()
        .filter_map(|v| v["id"].as_str().map(|s| s.to_string()))
        .collect();

    // Etapa 2 — detalhes em batches de 20
    let mut games = Vec::new();

    for chunk in ids.chunks(GAME_PASS_BATCH_SIZE) {
        let body = serde_json::json!({ "Products": chunk });

        let response: serde_json::Value = client
            .post("https://catalog.gamepass.com/products?market=BR&language=pt-BR&hydration=MobileDetailsForConsole")
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| e.to_string())?
            .json()
            .await
            .map_err(|e| e.to_string())?;

        // Log para diagnosticar quantos products o endpoint retornou
        if let Some(obj) = response["Products"].as_object() {
            info!("EA Play: requested {} ids, products returned {}", chunk.len(), obj.len());
        } else {
            info!("EA Play: requested {} ids, products returned an unexpected shape", chunk.len());
        }

        games.extend(parse_ea_play_products(&response["Products"]));

        // Delay entre batches para não sobrecarregar
        if !chunk.is_empty() {
            tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
        }
    }

    info!("EA Play: total parsed games {}", games.len());

    Ok(games)
}
