//! Busca de jogos similares via GameBrain.

use crate::constants::GAMEBRAIN_SIMILAR_REQUEST_LIMIT;
use crate::database;
use crate::utils::http_client::HTTP_CLIENT;

use tauri::AppHandle;

use super::cache::{
    gamebrain_id_cache_key, gamebrain_similar_cache_key, read_cached_json, read_stale_gamebrain_id,
    read_stale_similar_games, save_cached_json, take_similar_limit,
};
use super::helpers::{parse_gamebrain_id, resolve_gamebrain_id};
use super::models::SimilarGame;
use super::raw::RawSimilarResponse;

/// Busca jogos similares ao jogo identificado pelo UUID interno do Playlite.
///
/// **Fluxo:**
/// ```text
/// playlite_game_id (UUID)
///   → cache sqlite gamebrain_id:{UUID}? → gamebrain_id (u64)
///   → se não: database::get_game_name(playlite_game_id)
///             → /suggestions?query={nome} → gamebrain_id
///             → salva no cache persistente
///   → cache sqlite gamebrain_similar:{id}? → Vec<SimilarGame>
///   → se não: /v1/games/{gamebrain_id}/similar
///             → salva no cache persistente
/// ```
///
/// **Cache:**
/// - gamebrain_id e similares: TTL de 30 dias (estável)
///
/// **Parâmetros:**
/// - `app`: AppHandle do Tauri, necessário para acessar database e secrets
/// - `playlite_game_id`: UUID interno do jogo na biblioteca do Playlite
/// - `game_name`: Nome do jogo, usado como query para /suggestions. Passar diretamente evita uma chamada ao banco.
/// - `limit`: Número de similares a retornar (padrão da API: 10, máx recomendado: 12)
///
/// Retorna `Err` se: API key não estiver configurada, falha de rede ou jogo não encontrado na GameBrain.
pub async fn fetch_similar_games(
    app: &AppHandle,
    playlite_game_id: &str,
    game_name: &str,
    limit: Option<u32>,
) -> Result<Vec<SimilarGame>, String> {
    let api_key = database::get_secret(app, "gamebrain_api_key").map_err(|e| e.to_string())?;

    if api_key.trim().is_empty() {
        return Err("GameBrain API key não configurada".into());
    }

    let requested_limit = limit.unwrap_or(10);

    // Etapa 1: resolver gamebrain_id
    let gamebrain_id = {
        let id_cache_key = gamebrain_id_cache_key(playlite_game_id);

        if let Some(id) = read_cached_json::<u64>(app, "gamebrain", &id_cache_key, false)? {
            tracing::debug!(
                "GameBrain ID cache hit => game_id='{}' gamebrain_id={}",
                playlite_game_id,
                id
            );
            id
        } else {
            // Cache miss: resolve via /suggestions
            tracing::debug!(
                "GameBrain ID cache miss => resolvendo '{}' via suggestions",
                game_name
            );

            match resolve_gamebrain_id(&api_key, game_name).await {
                Ok(Some(id)) => {
                    let _ = save_cached_json(app, "gamebrain", &id_cache_key, &id);
                    id
                }
                Ok(None) => {
                    if let Some(stale_id) =
                        read_stale_gamebrain_id(app, &id_cache_key, playlite_game_id)?
                    {
                        stale_id
                    } else {
                        return Err(format!("Jogo '{}' não encontrado na GameBrain", game_name));
                    }
                }
                Err(err) => {
                    if let Some(stale_id) =
                        read_stale_gamebrain_id(app, &id_cache_key, playlite_game_id)?
                    {
                        stale_id
                    } else {
                        return Err(err);
                    }
                }
            }
        }
    };

    // Etapa 2: buscar similares usando gamebrain_id
    let similar_cache_key = gamebrain_similar_cache_key(gamebrain_id);

    if let Some(cached_results) =
        read_cached_json::<Vec<SimilarGame>>(app, "gamebrain", &similar_cache_key, false)?
    {
        tracing::debug!(
            "GameBrain similar cache hit => gamebrain_id={}",
            gamebrain_id
        );
        return Ok(take_similar_limit(cached_results, requested_limit));
    }

    // Cache miss: chama a API
    tracing::debug!(
        "GameBrain similar cache miss => chamando /similar para gamebrain_id={}",
        gamebrain_id
    );

    let url = format!("https://api.gamebrain.co/v1/games/{}/similar", gamebrain_id);

    let mut request = HTTP_CLIENT.get(&url).header("x-api-key", &api_key);

    request = request.query(&[("limit", GAMEBRAIN_SIMILAR_REQUEST_LIMIT.to_string())]);

    let response = request.send().await.map_err(|e| {
        tracing::error!("GameBrain similar request error: {}", e);
        e.to_string()
    });

    let response = match response {
        Ok(response) => response,
        Err(err) => {
            if let Some(cached_results) =
                read_stale_similar_games(app, &similar_cache_key, gamebrain_id, requested_limit)?
            {
                return Ok(cached_results);
            }

            return Err(err);
        }
    };

    let status = response.status();

    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        tracing::error!(
            "GameBrain similar HTTP Error => status={} body={}",
            status,
            body
        );
        if let Some(cached_results) =
            read_stale_similar_games(app, &similar_cache_key, gamebrain_id, requested_limit)?
        {
            return Ok(cached_results);
        }

        return Err(format!("Erro GameBrain similar: {}", status));
    }

    let text = match response.text().await {
        Ok(text) => text,
        Err(err) => {
            if let Some(cached_results) =
                read_stale_similar_games(app, &similar_cache_key, gamebrain_id, requested_limit)?
            {
                return Ok(cached_results);
            }

            return Err(err.to_string());
        }
    };
    tracing::debug!("GameBrain similar response size: {} bytes", text.len());

    let raw: RawSimilarResponse = match serde_json::from_str(&text) {
        Ok(raw) => raw,
        Err(e) => {
            tracing::error!("GameBrain similar JSON parse error: {}", e);
            if let Some(cached_results) =
                read_stale_similar_games(app, &similar_cache_key, gamebrain_id, requested_limit)?
            {
                return Ok(cached_results);
            }

            return Err(format!("Erro JSON GameBrain similar: {}", e));
        }
    };

    let results: Vec<SimilarGame> = raw
        .results
        .into_iter()
        .filter_map(|g| {
            // Descarta jogos sem ID válido — não deveriam existir, mas defensive.
            let raw_id = parse_gamebrain_id(&g.id)?;

            Some(SimilarGame {
                id: format!("gamebrain:{}", raw_id),
                name: g.name,
                cover_url: g.image,
                genre: g.genre,
                year: g.year.map(|y| y as u32),
                rating: g.rating.map(|r| (r.mean * 100.0).round()),
                link: g.link,
                screenshots: g.screenshots,
                micro_trailer: g.micro_trailer,
                adult_only: g.adult_only,
            })
        })
        .collect();

    tracing::debug!(
        "GameBrain similar => {} jogos para gamebrain_id={}",
        results.len(),
        gamebrain_id
    );

    // Salva no cache persistente antes de retornar
    let _ = save_cached_json(app, "gamebrain", &similar_cache_key, &results);

    Ok(take_similar_limit(results, requested_limit))
}
