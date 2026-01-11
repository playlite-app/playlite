//! Serviço para interagir com a API da IsThereAnyDeal (ITAD)

use crate::database;
use crate::utils::http_client::HTTP_CLIENT;
use serde::Deserialize;
use serde_json::json;
use std::collections::HashMap;
use tauri::AppHandle;

const API_BASE: &str = "https://api.isthereanydeal.com";

// Estruturas de Resposta da ITAD
#[derive(Debug, Deserialize)]
pub struct ItadLookupResult {
    pub found: bool,
    pub id: Option<String>,
    pub slug: Option<String>,
    pub title: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ItadPrice {
    pub price: f64,
    pub currency: String,
    pub cut: i32, // Desconto %
    pub shop: ItadShop,
    pub url: String,
}

#[derive(Debug, Deserialize)]
pub struct ItadShop {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct ItadGameOverview {
    pub id: String,
    pub title: String,
    pub current: Option<ItadPrice>, // Menor preço atual
    pub low: Option<ItadPrice>,     // Menor preço histórico
}

/// Busca o ID do jogo na ITAD pelo título (Fuzzy Search simplificado)
pub async fn find_game_id(app: &AppHandle, title: &str) -> Result<String, String> {
    let key = database::get_secret(app, "itad_api_key")?;
    if key.is_empty() {
        return Err("API Key da ITAD não configurada".into());
    }

    // Endpoint de Lookup baseado na documentação: /lookup/id/title/
    let url = format!("{}/lookup/id/title/?key={}", API_BASE, key);

    // Corpo: Array de títulos
    let body = json!([title]);

    let res = HTTP_CLIENT
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Erro ITAD Lookup: {}", res.status()));
    }

    // A resposta é um mapa: "Titulo Enviado" -> "ID Encontrado"
    let map: HashMap<String, String> = res.json().await.map_err(|e| e.to_string())?;

    // Tenta pegar o ID usando o título exato ou retorna erro
    match map.get(title) {
        Some(id) if !id.is_empty() => Ok(id.clone()),
        _ => Err("Jogo não encontrado na ITAD".into()),
    }
}

/// Busca informações de preço para uma lista de IDs da ITAD
pub async fn get_prices(
    app: &AppHandle,
    itad_ids: Vec<String>,
) -> Result<Vec<ItadGameOverview>, String> {
    let key = database::get_secret(app, "itad_api_key")?;
    if key.is_empty() {
        return Err("API Key ausente".into());
    }
    if itad_ids.is_empty() {
        return Ok(vec![]);
    }

    // Endpoint Overview: Retorna preços atuais e históricos
    // Documentação v2: /games/overview/v2/
    let url = format!("{}/games/overview/v2/?key={}", API_BASE, key);

    let body = json!(itad_ids);

    let res = HTTP_CLIENT
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Erro ITAD Prices: {}", res.status()));
    }

    let data: Vec<ItadGameOverview> = res.json().await.map_err(|e| e.to_string())?;
    Ok(data)
}
