//! Busca de jogos por texto e filtros.

use crate::database;
use crate::services::integration::gemini;
use crate::utils::http_client::HTTP_CLIENT;

use std::collections::HashSet;
use tauri::AppHandle;

use super::models::{
    GameBrainFilter, GameBrainFilterValue, GameBrainSearchParams, GameBrainSearchResult,
};
use super::raw::RawSearchResponse;

/// Busca jogos por descrição/características.
///
/// Exemplos: "RPG medieval" / "Co-op zombie survival"
///
/// - Use `params` para aplicar filtros e ordenação.
/// - Para uma busca simples sem filtros: `GameBrainSearchParams::default()`.
/// - Retorna uma lista simplificada compatível com o frontend.
/// - Retorna erro caso: API key não esteja configurada, falha de rede, Erro HTTP ou JSON inválido
pub async fn search_games_by_features(
    app: &AppHandle,
    query: &str,
    params: GameBrainSearchParams,
) -> Result<Vec<GameBrainSearchResult>, String> {
    let api_key = database::get_secret(app, "gamebrain_api_key").map_err(|e| e.to_string())?;

    if api_key.trim().is_empty() {
        return Err("GameBrain API key não configurada".into());
    }

    let cleaned_query = query.trim();

    if cleaned_query.is_empty() {
        return Ok(vec![]);
    }

    // Traduz a query para inglês. Falha silenciosa: se a tradução falhar, usa a query original.
    let english_query = match database::get_secret(app, "gemini_api_key") {
        Ok(gemini_key) if !gemini_key.trim().is_empty() => {
            gemini::translate_query_to_english(&gemini_key, cleaned_query)
                .await
                .unwrap_or_else(|_| cleaned_query.to_string())
        }
        _ => cleaned_query.to_string(),
    };

    tracing::debug!(
        "GameBrain search => original='{}' translated='{}'",
        cleaned_query,
        english_query
    );

    let url = "https://api.gamebrain.co/v1/games";

    tracing::debug!(
        "GameBrain search => query='{}' filters={} sort={:?} limit={:?} offset={:?}",
        cleaned_query,
        params.filters.len(),
        params.sort.as_ref().map(|s| s.as_str()),
        params.limit,
        params.offset,
    );

    let mut request = HTTP_CLIENT
        .get(url)
        .header("x-api-key", api_key)
        .query(&[("query", english_query.as_str())]);

    // Filtros: serializa o Vec como JSON compacto e passa como query param.
    // Formato esperado pela API: [{"key":"platform","values":[{"value":"pc"}],"connection":"OR"}]
    if !params.filters.is_empty() {
        let filters_json = serde_json::to_string(&params.filters).map_err(|e| e.to_string())?;

        request = request.query(&[("filters", filters_json)]);
    }

    if let Some(sort) = &params.sort {
        request = request.query(&[("sort", sort.as_str())]);
    }

    if let Some(order) = &params.sort_order {
        request = request.query(&[("sort-order", order.as_str())]);
    }

    if let Some(limit) = params.limit {
        request = request.query(&[("limit", limit.to_string())]);
    }

    if let Some(offset) = params.offset {
        request = request.query(&[("offset", offset.to_string())]);
    }

    let response = request.send().await.map_err(|e| {
        tracing::error!("GameBrain request error: {}", e);
        e.to_string()
    })?;

    let status = response.status();

    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();

        tracing::error!("GameBrain HTTP Error => status={} body={}", status, body);

        return Err(format!("Erro GameBrain: {}", status));
    }

    let response_text = response.text().await.map_err(|e| e.to_string())?;

    tracing::debug!("GameBrain response size: {} bytes", response_text.len());

    let raw_response: RawSearchResponse = serde_json::from_str(&response_text).map_err(|e| {
        tracing::error!("GameBrain JSON parse error: {}", e);

        format!(
            "Erro JSON GameBrain (linha {}, coluna {}): {}",
            e.line(),
            e.column(),
            e
        )
    })?;

    let results: Vec<GameBrainSearchResult> = raw_response
        .results
        .into_iter()
        .map(|game| {
            // Fallback de imagem: image -> cover.url
            let cover_url = game
                .image
                .or_else(|| game.cover.filter(|c| !c.url.is_empty()).map(|c| c.url));

            // Coleta apenas os nomes das plataformas, deduplicando.
            let platforms: Vec<String> = {
                let mut seen = HashSet::new();
                game.platforms
                    .into_iter()
                    .filter(|p| !p.name.is_empty() && seen.insert(p.name.clone()))
                    .map(|p| p.name)
                    .collect()
            };

            GameBrainSearchResult {
                // Prefixo importante para evitar colisão entre providers.
                id: format!("gamebrain:{}", game.id),
                name: game.name,
                cover_url,
                genre: game.genre,
                year: game.year.map(|y| y as u32),
                // Converte o score 0.0–1.0 para percentual 0–100.
                rating: game
                    .rating
                    .and_then(|r| r.mean)
                    .map(|m| (m * 100.0).round()),
                platforms,
                link: game.link,
            }
        })
        .collect();

    tracing::debug!("GameBrain parsed {} results", results.len());

    Ok(results)
}

/// Busca jogos por características filtrando apenas jogos de PC.
///
/// Atalho conveniente para o Playlite, que é focado em PC.
/// Equivale a chamar `search_games_by_features` com o filtro `platform: pc` já aplicado.
pub async fn search_pc_games_by_features(
    app: &AppHandle,
    query: &str,
    mut params: GameBrainSearchParams,
) -> Result<Vec<GameBrainSearchResult>, String> {
    // Injeta o filtro de PC caso ainda não esteja presente, preservando quaisquer filtros extras.
    let already_has_platform = params.filters.iter().any(|f| f.key == "platform");

    if !already_has_platform {
        params.filters.push(GameBrainFilter {
            key: "platform".into(),
            values: vec![GameBrainFilterValue { value: "pc".into() }],
            connection: Some("OR".into()),
        });
    }

    search_games_by_features(app, query, params).await
}
