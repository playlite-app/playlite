//! Helpers internos para a integracao GameBrain.

use crate::utils::http_client::HTTP_CLIENT;

use super::models::GameMedia;
use super::raw::{RawGameDetail, RawSuggestionsResponse};

/// Extrai um ID numérico de um serde_json::Value.
///
/// A GameBrain retorna IDs ora como número, ora como string.
/// Normaliza para u64. Retorna None se não for possível converter.
pub(super) fn parse_gamebrain_id(value: &serde_json::Value) -> Option<u64> {
    match value {
        serde_json::Value::Number(n) => n.as_u64(),
        serde_json::Value::String(s) => s.parse::<u64>().ok(),
        _ => None,
    }
}

/// Busca o gamebrain_id a partir do nome do jogo via /suggestions.
///
/// Usa o primeiro resultado — suggestions retorna o match mais próximo
/// primeiro, o que é suficiente para jogos da biblioteca do usuário
/// (nomes exatos ou quase exatos).
///
/// **Estratégia de matching:**
///
/// Para minimizar falsos positivos, compara o nome do jogo
/// (em lowercase, sem espaços extras) com o nome do primeiro resultado.
/// Se não houver match próximo o suficiente, retorna None.
pub(super) async fn resolve_gamebrain_id(
    api_key: &str,
    game_name: &str,
) -> Result<Option<u64>, String> {
    let url = "https://api.gamebrain.co/v1/games/suggestions";

    let response = HTTP_CLIENT
        .get(url)
        .header("x-api-key", api_key)
        .query(&[("query", game_name)])
        .send()
        .await
        .map_err(|e| {
            tracing::error!("GameBrain suggestions request error: {}", e);
            e.to_string()
        })?;

    let status = response.status();

    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        tracing::error!(
            "GameBrain suggestions HTTP Error => status={} body={}",
            status,
            body
        );
        return Err(format!("Erro GameBrain suggestions: {}", status));
    }

    let text = response.text().await.map_err(|e| e.to_string())?;
    let raw: RawSuggestionsResponse = serde_json::from_str(&text).map_err(|e| {
        tracing::error!("GameBrain suggestions JSON parse error: {}", e);
        format!("Erro JSON GameBrain suggestions: {}", e)
    })?;

    let first = match raw.results.into_iter().next() {
        Some(s) => s,
        None => {
            tracing::debug!(
                "GameBrain suggestions => nenhum resultado para '{}'",
                game_name
            );
            return Ok(None);
        }
    };

    // Validação básica: o nome retornado deve conter o início do nome buscado.
    let query_lower = game_name.to_lowercase();
    let result_lower = first.name.to_lowercase();

    // Aceita se:
    //   1. O resultado contém o nome buscado, ou
    //   2. O nome buscado contém o resultado (subtítulos removidos), ou
    //   3. Os dois primeiros "tokens" (palavras) batem — cobre casos como
    //      "Resident Evil 4" vs "Resident Evil 4 Remake"
    let query_tokens: Vec<&str> = query_lower.split_whitespace().take(2).collect();
    let result_tokens: Vec<&str> = result_lower.split_whitespace().take(2).collect();

    let is_match = result_lower.contains(&query_lower)
        || query_lower.contains(&result_lower)
        || query_tokens == result_tokens;

    if !is_match {
        tracing::debug!(
            "GameBrain suggestions => match rejeitado: query='{}' result='{}'",
            game_name,
            first.name
        );
        return Ok(None);
    }

    let id = parse_gamebrain_id(&first.id);

    tracing::debug!(
        "GameBrain suggestions => '{}' resolvido para id={:?}",
        game_name,
        id
    );

    Ok(id)
}

/// Constrói GameMedia a partir do raw, classificando os vídeos.
pub(super) fn build_game_media(raw: RawGameDetail) -> GameMedia {
    // Classifica cada URL de vídeo em trailer (.webm direto) ou embed YouTube.
    // O array `videos` da GameBrain pode conter:
    //   - "https://cdn.akamai.steamstatic.com/.../movie480_vp9.webm"  → trailer
    //   - "https://video.akamai.steamstatic.com/.../movie480_vp9.webm" → trailer
    //   - "https://www.youtube-nocookie.com/embed/..."                 → youtube embed
    //   - "https://youtube-nocookie.com/embed/..."                     → youtube embed (sem www)
    let mut trailers = Vec::new();
    let mut youtube_embeds = Vec::new();

    for url in raw.videos {
        if url.ends_with(".webm") {
            trailers.push(url);
        } else if url.contains("youtube-nocookie.com/embed") {
            youtube_embeds.push(url);
        }
        // URLs desconhecidas são descartadas silenciosamente
    }

    // Deduplica screenshots: o campo `image` às vezes repete a primeira screenshot.
    let mut screenshots = raw.screenshots;
    if let Some(ref img) = raw.image {
        if !screenshots.contains(img) {
            screenshots.insert(0, img.clone());
        }
    }

    GameMedia {
        screenshots,
        trailers,
        youtube_embeds,
        micro_trailer: raw.micro_trailer,
    }
}
