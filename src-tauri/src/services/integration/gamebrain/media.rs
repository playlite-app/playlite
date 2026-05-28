//! Busca de mídia (screenshots e videos) via GameBrain.

use crate::database;
use crate::utils::http_client::HTTP_CLIENT;

use tauri::AppHandle;

use super::cache::{
    gamebrain_id_cache_key, gamebrain_media_cache_key, read_cached_json, read_stale_gamebrain_id,
    save_cached_json,
};
use super::helpers::{build_game_media, resolve_gamebrain_id};
use super::models::GameMedia;
use super::raw::RawGameDetail;

/// Busca a mídia (screenshots, trailers, embeds YouTube) de um jogo via GameBrain.
///
/// **Fluxo:**
/// ```text
/// playlite_game_id (UUID)
///   → resolve gamebrain_id (mesmo caminho de fetch_similar_games)
///   → cache sqlite gamebrain_media:{gamebrain_id}?  → GameMedia
///   → se não: GET /v1/games/{gamebrain_id}
///             → extrai apenas campos de mídia
///             → classifica vídeos em trailers vs youtube_embeds
///             → salva no cache
/// ```
///
/// **Cache:** TTL configurado em `cache.rs` pela chave `gamebrain_media:`.
/// Adicionar ao `get_ttl_for_cache_type` e `cleanup_expired_cache` em cache.rs
/// (ver comentário no final deste arquivo).
///
/// **Parâmetros:**
/// - `playlite_game_id`: UUID interno do Playlite
/// - `game_name`: nome do jogo, usado como fallback para resolver o gamebrain_id via /suggestions se não estiver em cache
pub async fn fetch_game_media(
    app: &AppHandle,
    playlite_game_id: &str,
    game_name: &str,
) -> Result<GameMedia, String> {
    let api_key = database::get_secret(app, "gamebrain_api_key").map_err(|e| e.to_string())?;

    if api_key.trim().is_empty() {
        return Err("GameBrain API key não configurada".into());
    }

    // Etapa 1: resolver gamebrain_id
    // Reutiliza o mesmo cache de ID da fetch_similar_games —
    // se o usuário já abriu a aba Descoberta antes, o ID já está em cache.
    let gamebrain_id = {
        let id_cache_key = gamebrain_id_cache_key(playlite_game_id);

        if let Some(id) = read_cached_json::<u64>(app, "gamebrain", &id_cache_key, false)? {
            tracing::debug!(
                "GameBrain media: ID cache hit => game_id='{}' gamebrain_id={}",
                playlite_game_id,
                id
            );
            id
        } else {
            tracing::debug!(
                "GameBrain media: ID cache miss => resolvendo '{}' via suggestions",
                game_name
            );

            match resolve_gamebrain_id(&api_key, game_name).await {
                Ok(Some(id)) => {
                    let _ = save_cached_json(app, "gamebrain", &id_cache_key, &id);
                    id
                }
                Ok(None) => {
                    // Tenta ID stale antes de falhar
                    read_stale_gamebrain_id(app, &id_cache_key, playlite_game_id)?.ok_or_else(
                        || format!("Jogo '{}' não encontrado na GameBrain", game_name),
                    )?
                }
                Err(err) => {
                    read_stale_gamebrain_id(app, &id_cache_key, playlite_game_id)?.ok_or(err)?
                }
            }
        }
    };

    // Etapa 2: buscar mídia do game detail
    let media_cache_key = gamebrain_media_cache_key(gamebrain_id);

    if let Some(cached) = read_cached_json::<GameMedia>(app, "gamebrain", &media_cache_key, false)?
    {
        tracing::debug!("GameBrain media cache hit => gamebrain_id={}", gamebrain_id);
        return Ok(cached);
    }

    // Cache miss: chama GET /v1/games/{id}
    tracing::debug!(
        "GameBrain media cache miss => chamando /v1/games/{} para mídia",
        gamebrain_id
    );

    let url = format!("https://api.gamebrain.co/v1/games/{}", gamebrain_id);

    let response = HTTP_CLIENT
        .get(&url)
        .header("x-api-key", &api_key)
        .send()
        .await
        .map_err(|e| {
            tracing::error!("GameBrain game detail request error: {}", e);
            e.to_string()
        });

    let response = match response {
        Ok(r) => r,
        Err(err) => {
            // Stale fallback em caso de falha de rede
            return read_cached_json::<GameMedia>(app, "gamebrain", &media_cache_key, true)?
                .ok_or(err);
        }
    };

    let status = response.status();

    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        tracing::error!(
            "GameBrain game detail HTTP Error => status={} body={}",
            status,
            body
        );
        return read_cached_json::<GameMedia>(app, "gamebrain", &media_cache_key, true)?
            .ok_or_else(|| format!("Erro GameBrain game detail: {}", status));
    }

    let text = response.text().await.map_err(|e| e.to_string())?;

    tracing::debug!("GameBrain game detail response size: {} bytes", text.len());

    let raw: RawGameDetail = serde_json::from_str(&text).map_err(|e| {
        tracing::error!("GameBrain game detail JSON parse error: {}", e);
        format!("Erro JSON GameBrain game detail: {}", e)
    })?;

    let media = build_game_media(raw);

    tracing::debug!(
        "GameBrain media => {} screenshots, {} trailers, {} embeds para gamebrain_id={}",
        media.screenshots.len(),
        media.trailers.len(),
        media.youtube_embeds.len(),
        gamebrain_id
    );

    let _ = save_cached_json(app, "gamebrain", &media_cache_key, &media);

    Ok(media)
}
