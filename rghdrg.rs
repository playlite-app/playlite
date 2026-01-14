//! Serviço de integração com a Steam Store API (Pública).
//! Não requer API Key para dados de loja e reviews.

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use crate::utils::http_client::HTTP_CLIENT; // Assumindo que você tem um cliente HTTP global ou use reqwest direto

const STORE_API_URL: &str = "https://store.steampowered.com/api/appdetails";
const REVIEW_API_URL: &str = "https://store.steampowered.com/appreviews";

// === ESTRUTURAS DE RETORNO DA STEAM ===

#[derive(Debug, Clone)]
pub struct SteamStoreData {
    pub name: String,
    pub is_free: bool,
    pub short_description: String,
    pub header_image: String,
    pub website: Option<String>,
    pub release_date: Option<String>,
    pub content_descriptors: ContentDescriptors,
    pub categories: Vec<Category>,
    pub genres: Vec<Genre>,
    pub required_age: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ContentDescriptors {
    pub ids: Vec<u32>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Category {
    pub id: u32,
    pub description: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Genre {
    pub id: String,
    pub description: String,
}

#[derive(Debug, Clone)]
pub struct SteamReviewSummary {
    pub review_score: u32,          // Score numérico interno da Steam
    pub review_score_desc: String,  // "Very Positive", "Mixed", etc.
    pub total_positive: u32,
    pub total_negative: u32,
    pub total_reviews: u32,
}

// === IMPLEMENTAÇÃO ===

/// Busca detalhes da loja (Conteúdo adulto, descrição, imagens)
/// Retorna Option porque o jogo pode não existir na loja ou ser removido.
pub async fn get_app_details(app_id: &str) -> Result<Option<SteamStoreData>, String> {
    // ?filters=basic,content_descriptors,categories,genres,release_date
    // Isso economiza banda filtrando só o que queremos
    let url = format!("{}?appids={}&l=brazilian", STORE_API_URL, app_id);

    let response = HTTP_CLIENT
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Erro requisição Steam: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Steam API Error: {}", response.status()));
    }

    // A Steam retorna um JSON onde a chave é o ID do jogo. Ex: { "1091500": { "success": true, "data": ... } }
    let json: Value = response.json().await.map_err(|e| e.to_string())?;

    // Navega no JSON dinâmico
    if let Some(app_wrapper) = json.get(app_id) {
        if let Some(success) = app_wrapper.get("success").and_then(|v| v.as_bool()) {
            if success {
                if let Some(data) = app_wrapper.get("data") {
                    // Manual parsing para evitar structs gigantescas aninhadas
                    let name = data.get("name").and_then(|v| v.as_str()).unwrap_or("").to_string();
                    let is_free = data.get("is_free").and_then(|v| v.as_bool()).unwrap_or(false);
                    let short_description = data.get("short_description").and_then(|v| v.as_str()).unwrap_or("").to_string();
                    let header_image = data.get("header_image").and_then(|v| v.as_str()).unwrap_or("").to_string();
                    let website = data.get("website").and_then(|v| v.as_str()).map(|s| s.to_string());
                    
                    let release_date = data.get("release_date")
                        .and_then(|v| v.get("date"))
                        .and_then(|v| v.as_str())
                        .map(|s| s.to_string());

                    let required_age = data.get("required_age")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0) as u32;

                    // Deserializa listas complexas
                    let content_descriptors: ContentDescriptors = serde_json::from_value(
                        data.get("content_descriptors").cloned().unwrap_or(json!({"ids": [], "notes": null}))
                    ).unwrap_or(ContentDescriptors { ids: vec![], notes: None });

                    let categories: Vec<Category> = serde_json::from_value(
                        data.get("categories").cloned().unwrap_or(json!([]))
                    ).unwrap_or_default();

                    let genres: Vec<Genre> = serde_json::from_value(
                        data.get("genres").cloned().unwrap_or(json!([]))
                    ).unwrap_or_default();

                    return Ok(Some(SteamStoreData {
                        name,
                        is_free,
                        short_description,
                        header_image,
                        website,
                        release_date,
                        content_descriptors,
                        categories,
                        genres,
                        required_age
                    }));
                }
            }
        }
    }

    Ok(None)
}

/// Busca o resumo das avaliações (Reviews)
pub async fn get_app_reviews(app_id: &str) -> Result<Option<SteamReviewSummary>, String> {
    let url = format!("{}/{}?json=1&language=all&purchase_type=all", REVIEW_API_URL, app_id);

    let response = HTTP_CLIENT
        .get(&url)
        .header("User-Agent", "Valve/Steam HTTP Client 1.0") // Boa prática para não ser bloqueado
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let json: Value = response.json().await.map_err(|e| e.to_string())?;

    if let Some(success) = json.get("success").and_then(|v| v.as_i64()) {
        if success == 1 {
            if let Some(summary) = json.get("query_summary") {
                let total_reviews = summary.get("total_reviews").and_then(|v| v.as_u64()).unwrap_or(0) as u32;
                
                // Se não tem reviews suficientes, o campo review_score_desc pode não vir
                let review_score_desc = summary.get("review_score_desc")
                    .and_then(|v| v.as_str())
                    .unwrap_or("No Reviews")
                    .to_string();

                return Ok(Some(SteamReviewSummary {
                    review_score: summary.get("review_score").and_then(|v| v.as_u64()).unwrap_or(0) as u32,
                    review_score_desc,
                    total_positive: summary.get("total_positive").and_then(|v| v.as_u64()).unwrap_or(0) as u32,
                    total_negative: summary.get("total_negative").and_then(|v| v.as_u64()).unwrap_or(0) as u32,
                    total_reviews,
                }));
            }
        }
    }

    Ok(None)
}

/// Helper para detectar se é adulto baseado nos dados da Steam
pub fn detect_adult_content(data: &SteamStoreData) -> (bool, Vec<String>) {
    let mut flags = Vec::new();
    let mut is_adult = false;

    // 1. Verifica IDs de descritores de conteúdo da Steam
    // IDs comuns: 1 (Nudity), 2 (Violence), 3 (Sexual Content), 4 (Gore), 5 (Drugs)
    for id in &data.content_descriptors.ids {
        match id {
            1 | 3 => {
                is_adult = true;
                flags.push("Sexual Content".to_string());
            },
            4 => flags.push("Gore".to_string()),
            _ => {}
        }
    }

    // 2. Verifica idade mínima
    if data.required_age >= 18 {
        is_adult = true;
        flags.push("18+".to_string());
    }

    // 3. Verifica nas categorias/generos se tem "Sexual Content" ou "Nudity" explícito nas strings
    // (A Steam às vezes coloca isso em genres)
    for genre in &data.genres {
        let desc = genre.description.to_lowercase();
        if desc.contains("sexual") || desc.contains("nudity") || desc.contains("hentai") {
            is_adult = true;
            flags.push(genre.description.clone());
        }
    }

    // Remove duplicatas
    flags.sort();
    flags.dedup();

    (is_adult, flags)
}