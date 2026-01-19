//! Módulo de integração com as APIs Steam.
//!
//! Unifica funcionalidades da API de Usuário (autenticada) para importar biblioteca
//! e da API da Loja (pública) para enriquecer metadados (reviews, conteúdo adulto).

use crate::constants::{REVIEW_API_URL, STEAMSPY_API_URL, STEAM_STORE_API_URL};
use crate::utils::http_client::HTTP_CLIENT;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::time::Duration;

// === API DE USUÁRIO - IMPORTAÇÃO DE BIBLIOTECA (Requer API Key) ===

/// Representa um jogo retornado pela API GetOwnedGames da Steam.
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
        return Err(format!("Erro Steam API (OwnedGames): {}", res.status()));
    }

    let api_data: SteamApiResponse = res.json().await.map_err(|e| format!("JSON Error: {}", e))?;
    Ok(api_data.response.games)
}

//  === API DA LOJA - METADADOS, REVIEWS E CONTEÚDO ADULTO (Pública) ===

/// Detalhes da loja Steam para um aplicativo (jogo).
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
    pub review_score: u32,
    pub review_score_desc: String,
    pub total_positive: u32,
    pub total_negative: u32,
    pub total_reviews: u32,
}

#[derive(Debug, Deserialize)]
struct SteamSpyResponse {
    median_forever: u32,
}

/// Busca detalhes da loja (Conteúdo adulto, descrição, imagens)
///
/// Retorna Option porque o jogo pode não existir na loja (removido/banido).
pub async fn get_app_details(app_id: &str) -> Result<Option<SteamStoreData>, String> {
    // Filtramos apenas os campos necessários para economizar banda
    let url = format!(
        "{}?appids={}&l=brazilian&filters=basic,content_descriptors,categories,genres,release_date",
        STEAM_STORE_API_URL, app_id
    );

    let response = HTTP_CLIENT
        .get(&url)
        .timeout(Duration::from_secs(10)) // ← Adicionar
        .send()
        .await
        .map_err(|e| format!("Erro requisição Steam Store: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Steam Store API Error: {}", response.status()));
    }

    let json: Value = response.json().await.map_err(|e| e.to_string())?;

    // Navega no JSON dinâmico (Chave é o AppID)
    if let Some(app_wrapper) = json.get(app_id) {
        if let Some(success) = app_wrapper.get("success").and_then(|v| v.as_bool()) {
            if success {
                if let Some(data) = app_wrapper.get("data") {
                    let name = data
                        .get("name")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();
                    let is_free = data
                        .get("is_free")
                        .and_then(|v| v.as_bool())
                        .unwrap_or(false);
                    let short_description = data
                        .get("short_description")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();
                    let header_image = data
                        .get("header_image")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();
                    let website = data
                        .get("website")
                        .and_then(|v| v.as_str())
                        .map(|s| s.to_string());

                    let release_date = data
                        .get("release_date")
                        .and_then(|v| v.get("date"))
                        .and_then(|v| v.as_str())
                        .map(|s| s.to_string());

                    let required_age = data
                        .get("required_age")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0) as u32;

                    let content_descriptors: ContentDescriptors = serde_json::from_value(
                        data.get("content_descriptors")
                            .cloned()
                            .unwrap_or(json!({"ids": [], "notes": null})),
                    )
                    .unwrap_or(ContentDescriptors {
                        ids: vec![],
                        notes: None,
                    });

                    let categories: Vec<Category> = serde_json::from_value(
                        data.get("categories").cloned().unwrap_or(json!([])),
                    )
                    .unwrap_or_default();

                    let genres: Vec<Genre> =
                        serde_json::from_value(data.get("genres").cloned().unwrap_or(json!([])))
                            .unwrap_or_default();

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
                        required_age,
                    }));
                }
            }
        }
    }

    Ok(None)
}

/// Busca o resumo das avaliações (Reviews)
pub async fn get_app_reviews(app_id: &str) -> Result<Option<SteamReviewSummary>, String> {
    let url = format!(
        "{}/{}?json=1&language=all&purchase_type=all",
        REVIEW_API_URL, app_id
    );

    let response = HTTP_CLIENT
        .get(&url)
        .header("User-Agent", "Valve/Steam HTTP Client 1.0")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let json: Value = response.json().await.map_err(|e| e.to_string())?;

    if let Some(success) = json.get("success").and_then(|v| v.as_i64()) {
        if success == 1 {
            if let Some(summary) = json.get("query_summary") {
                let total_reviews = summary
                    .get("total_reviews")
                    .and_then(|v| v.as_u64())
                    .unwrap_or(0) as u32;

                let review_score_desc = summary
                    .get("review_score_desc")
                    .and_then(|v| v.as_str())
                    .unwrap_or("No Reviews")
                    .to_string();

                return Ok(Some(SteamReviewSummary {
                    review_score: summary
                        .get("review_score")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0) as u32,
                    review_score_desc,
                    total_positive: summary
                        .get("total_positive")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0) as u32,
                    total_negative: summary
                        .get("total_negative")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0) as u32,
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

    // 1. Verifica IDs de descritores de conteúdo
    for id in &data.content_descriptors.ids {
        match id {
            1 => {
                is_adult = true;
                flags.push("Violence".to_string());
            }
            2 => {
                is_adult = true;
                flags.push("Sexual Content".to_string());
            }
            3 => {
                is_adult = true;
                flags.push("Nudity".to_string());
            }
            4 => flags.push("Gore".to_string()),
            5 => {
                is_adult = true;
                flags.push("Adult Themes".to_string());
            }
            _ => {}
        }
    }

    // 2. Verificar notes também
    if let Some(notes) = &data.content_descriptors.notes {
        let notes_lower = notes.to_lowercase();
        if notes_lower.contains("sexual") || notes_lower.contains("nudity") {
            is_adult = true;
            flags.push("Sexual Content".to_string());
        }
    }

    // 3. Verifica idade mínima
    if data.required_age >= 18 {
        is_adult = true;
        flags.push("18+".to_string());
    }

    // 4. Verifica nas strings de gênero
    for genre in &data.genres {
        let desc = genre.description.to_lowercase();
        if desc.contains("sexual") || desc.contains("nudity") || desc.contains("hentai") {
            is_adult = true;
            flags.push(genre.description.clone());
        }
    }

    flags.sort();
    flags.dedup();

    (is_adult, flags)
}

/// Busca tempo médio de jogo no SteamSpy (em minutos)
pub async fn get_median_playtime(app_id: &str) -> Result<Option<u32>, String> {
    let url = format!("{}?request=appdetails&appid={}", STEAMSPY_API_URL, app_id);

    let response = HTTP_CLIENT
        .get(&url)
        .header("User-Agent", "Valve/Steam HTTP Client 1.0")
        .timeout(Duration::from_secs(5))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Ok(None);
    }

    // Tenta parsear. Se falhar (ex: jogo não trackeado), retorna None sem erro crítico
    match response.json::<SteamSpyResponse>().await {
        Ok(data) => {
            // SteamSpy retorna em minutos, converter para horas
            let median_hours = data.median_forever / 60;
            // Filtra zeros (jogos sem dados ou nunca jogados)
            if median_hours > 0 {
                Ok(Some(median_hours))
            } else {
                Ok(None)
            }
        }
        Err(_) => Ok(None),
    }
}
