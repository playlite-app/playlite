//! Integração com GameBrain API
//!
//! Responsável por busca semântica de jogos, descoberta e recomendações.
//!
//! Atualmente implementa:
//! - Busca por características/texto
//! - Filtros (plataforma, gênero, modo de jogo, preço, etc.)

use crate::database::{self, AppState};
use crate::services::cache;
use crate::services::integration::gemini;
use crate::utils::http_client::HTTP_CLIENT;

use rusqlite::Connection;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

const GAMEBRAIN_SIMILAR_REQUEST_LIMIT: u32 = 12;

// === ESTRUTURAS PÚBLICAS ===

/// Resultado simplificado usado pelo frontend.
/// Estrutura compatível com: Wishlist, Busca, Descoberta e Similares
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameBrainSearchResult {
    pub id: String,
    pub name: String,
    pub cover_url: Option<String>,
    pub genre: Option<String>,
    pub year: Option<u32>,
    pub rating: Option<f64>,
    pub platforms: Vec<String>,
    pub link: Option<String>,
}

/// Todos os campos são opcionais — use apenas o que precisar.
///
/// # Exemplo
///
/// ```rust
/// let params = GameBrainSearchParams {
///     filters: vec![
///         GameBrainFilter {
///             key: "platform".into(),
///             values: vec![GameBrainFilterValue { value: "pc".into() }],
///             connection: Some("OR".into()),
///         },
///     ],
///     sort: Some(GameBrainSort::Rating),
///     sort_order: Some(GameBrainSortOrder::Desc),
///     limit: Some(20),
///     offset: None,
/// };
/// ```
#[derive(Debug, Default, Clone)]
pub struct GameBrainSearchParams {
    /// Filtros a aplicar na busca. Os valores válidos vêm do campo `filter_options` da resposta da API.
    pub filters: Vec<GameBrainFilter>,
    pub sort: Option<GameBrainSort>,
    /// Direção da ordenação. Padrão da API: descendente.
    pub sort_order: Option<GameBrainSortOrder>,
    /// Número máximo de resultados. Padrão da API: 10.
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

/// Um filtro a ser aplicado na busca.
#[derive(Debug, Clone, Serialize)]
pub struct GameBrainFilter {
    /// Chave do filtro (ex: "platform", "genre", "play_mode").
    pub key: String,
    pub values: Vec<GameBrainFilterValue>,
    /// Operador lógico entre os valores: "OR" ou "AND". A maioria dos filtros usa "OR". Omita para usar o padrão da API.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub connection: Option<String>,
}

/// Um valor individual de filtro (ex: "pc", "action", "single_player").
#[derive(Debug, Clone, Serialize)]
pub struct GameBrainFilterValue {
    pub value: String,
}

#[derive(Debug, Clone)]
pub enum GameBrainSort {
    Rating,
    ReleaseDate,
    Price,
}

impl GameBrainSort {
    fn as_str(&self) -> &'static str {
        match self {
            GameBrainSort::Rating => "computed_rating",
            GameBrainSort::ReleaseDate => "release_date",
            GameBrainSort::Price => "price",
        }
    }
}

#[derive(Debug, Clone)]
pub enum GameBrainSortOrder {
    Asc,
    Desc,
}

impl GameBrainSortOrder {
    fn as_str(&self) -> &'static str {
        match self {
            GameBrainSortOrder::Asc => "asc",
            GameBrainSortOrder::Desc => "desc",
        }
    }
}

/// Jogo similar retornado para o frontend.
///
/// Subset dos campos disponíveis na resposta de /similar.
/// Inclui screenshots e micro_trailer para a UI da aba Descoberta.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimilarGame {
    /// ID no formato "gamebrain:{id}" para consistência com GameBrainSearchResult.
    pub id: String,
    pub name: String,
    pub cover_url: Option<String>,
    pub genre: Option<String>,
    pub year: Option<u32>,
    /// Rating em percentual (0–100), convertido de 0.0–1.0.
    pub rating: Option<f64>,
    pub link: Option<String>,
    /// Primeiros screenshots disponíveis (máx 4 pela API).
    pub screenshots: Vec<String>,
    /// URL do micro-trailer em .webm (Steam CDN), se disponível.
    pub micro_trailer: Option<String>,
    /// Flag de conteúdo adulto — o frontend pode usar para bloquear a exibição automática de imagens.
    pub adult_only: bool,
}

// === ESTRUTURAS INTERNAS (RAW JSON) ===

/// Resposta principal da API.
///
/// A estrutura real da API pode mudar. Mantemos apenas os campos necessários.
#[derive(Debug, Deserialize)]
struct RawSearchResponse {
    #[serde(default)]
    results: Vec<RawGame>,
}

/// Estrutura bruta do jogo retornado pela API.
#[derive(Debug, Deserialize)]
struct RawGame {
    /// ID da API (pode ser número ou string).
    id: serde_json::Value,
    #[serde(default)]
    name: String,
    #[serde(default)]
    image: Option<String>,
    #[serde(default)]
    genre: Option<String>,
    #[serde(default)]
    year: Option<f64>,
    #[serde(default)]
    rating: Option<RawRating>,
    #[serde(default)]
    platforms: Vec<RawPlatform>,
    #[serde(default)]
    link: Option<String>,
    // Campos alternativos de imagem que alguns endpoints podem retornar.
    #[serde(default)]
    cover: Option<RawCover>,
}

/// Estrutura de rating - Score normalizado entre 0.0 e 1.0.
#[derive(Debug, Deserialize)]
struct RawRating {
    #[serde(default)]
    mean: f64,
}

/// Estrutura de plataforma (ex: "PC", "Xbox Series X|S").
#[derive(Debug, Deserialize)]
struct RawPlatform {
    #[serde(default)]
    name: String,
}

/// Estrutura de capa (fallback para endpoints legados).
#[derive(Debug, Deserialize)]
struct RawCover {
    #[serde(default)]
    url: String,
}

/// Resposta bruta do endpoint /suggestions.
#[derive(Debug, Deserialize)]
struct RawSuggestionsResponse {
    #[serde(default)]
    results: Vec<RawSuggestion>,
}

/// Um item de sugestão — Estrutura mínima (id e nome).
#[derive(Debug, Deserialize)]
struct RawSuggestion {
    id: serde_json::Value,
    #[serde(default)]
    name: String,
}

/// Resposta bruta do endpoint /similar.
#[derive(Debug, Deserialize)]
struct RawSimilarResponse {
    #[serde(default)]
    results: Vec<RawSimilarGame>,
}

/// Estrutura bruta de um jogo similar.
#[derive(Debug, Deserialize)]
struct RawSimilarGame {
    id: serde_json::Value,
    #[serde(default)]
    name: String,
    #[serde(default)]
    image: Option<String>,
    #[serde(default)]
    genre: Option<String>,
    #[serde(default)]
    year: Option<f64>,
    #[serde(default)]
    rating: Option<RawRating>,
    #[serde(default)]
    link: Option<String>,
    #[serde(default)]
    screenshots: Vec<String>,
    #[serde(default)]
    micro_trailer: Option<String>,
    #[serde(default)]
    adult_only: bool,
}

// === FUNÇÕES PRIVADAS DE SUPORTE ===

fn gamebrain_id_cache_key(playlite_game_id: &str) -> String {
    format!("gamebrain_id:{}", playlite_game_id)
}

fn gamebrain_similar_cache_key(gamebrain_id: u64) -> String {
    format!("gamebrain_similar:{}", gamebrain_id)
}

fn with_metadata_cache_conn<T>(
    app: &AppHandle,
    f: impl FnOnce(&Connection) -> Result<T, String>,
) -> Result<T, String> {
    let state = app.state::<AppState>();
    let conn = state
        .metadata_db
        .lock()
        .map_err(|_| "Falha ao acessar o cache persistente do GameBrain".to_string())?;

    f(&conn)
}

fn read_cached_json<T: DeserializeOwned>(
    app: &AppHandle,
    source: &str,
    external_id: &str,
    stale: bool,
) -> Result<Option<T>, String> {
    with_metadata_cache_conn(app, |conn| {
        let payload = if stale {
            cache::get_stale_api_data(conn, source, external_id)
        } else {
            cache::get_cached_api_data(conn, source, external_id)
        };

        match payload {
            Some(payload) => serde_json::from_str::<T>(&payload)
                .map(Some)
                .map_err(|e| e.to_string()),
            None => Ok(None),
        }
    })
}

fn save_cached_json<T: Serialize>(
    app: &AppHandle,
    source: &str,
    external_id: &str,
    value: &T,
) -> Result<(), String> {
    with_metadata_cache_conn(app, |conn| {
        let payload = serde_json::to_string(value).map_err(|e| e.to_string())?;
        cache::save_cached_api_data(conn, source, external_id, &payload)
    })
}

/// Extrai um ID numérico de um serde_json::Value.
///
/// A GameBrain retorna IDs ora como número, ora como string.
/// Normaliza para u64. Retorna None se não for possível converter.
fn parse_gamebrain_id(value: &serde_json::Value) -> Option<u64> {
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
/// Para minimizar falsos positivos, comparamos o nome do jogo
/// (em lowercase, sem espaços extras) com o nome do primeiro resultado.
/// Se não houver match próximo o suficiente, retorna None.
async fn resolve_gamebrain_id(api_key: &str, game_name: &str) -> Result<Option<u64>, String> {
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

// === FUNÇÕES PRINCIPAIS ===

/// Busca jogos por descrição/características.
///
/// Exemplos:
/// - "RPG medieval"
/// - "Co-op zombie survival"
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
                let mut seen = std::collections::HashSet::new();
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
                rating: game.rating.map(|r| (r.mean * 100.0).round()),
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
                        read_cached_json::<u64>(app, "gamebrain", &id_cache_key, true)?
                    {
                        tracing::debug!(
                            "GameBrain ID fallback para cache antigo => game_id='{}' gamebrain_id={}",
                            playlite_game_id,
                            stale_id
                        );
                        stale_id
                    } else {
                        return Err(format!("Jogo '{}' não encontrado na GameBrain", game_name));
                    }
                }
                Err(err) => {
                    if let Some(stale_id) =
                        read_cached_json::<u64>(app, "gamebrain", &id_cache_key, true)?
                    {
                        tracing::debug!(
                            "GameBrain ID fallback para cache antigo => game_id='{}' gamebrain_id={}",
                            playlite_game_id,
                            stale_id
                        );
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
        let results = cached_results
            .into_iter()
            .take(requested_limit as usize)
            .collect();
        return Ok(results);
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
                read_cached_json::<Vec<SimilarGame>>(app, "gamebrain", &similar_cache_key, true)?
            {
                tracing::debug!(
                    "GameBrain similar stale cache fallback => gamebrain_id={}",
                    gamebrain_id
                );
                return Ok(cached_results
                    .into_iter()
                    .take(requested_limit as usize)
                    .collect());
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
            read_cached_json::<Vec<SimilarGame>>(app, "gamebrain", &similar_cache_key, true)?
        {
            tracing::debug!(
                "GameBrain similar stale cache fallback => gamebrain_id={}",
                gamebrain_id
            );
            return Ok(cached_results
                .into_iter()
                .take(requested_limit as usize)
                .collect());
        }

        return Err(format!("Erro GameBrain similar: {}", status));
    }

    let text = match response.text().await {
        Ok(text) => text,
        Err(err) => {
            if let Some(cached_results) =
                read_cached_json::<Vec<SimilarGame>>(app, "gamebrain", &similar_cache_key, true)?
            {
                tracing::debug!(
                    "GameBrain similar stale cache fallback => gamebrain_id={}",
                    gamebrain_id
                );
                return Ok(cached_results
                    .into_iter()
                    .take(requested_limit as usize)
                    .collect());
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
                read_cached_json::<Vec<SimilarGame>>(app, "gamebrain", &similar_cache_key, true)?
            {
                tracing::debug!(
                    "GameBrain similar stale cache fallback => gamebrain_id={}",
                    gamebrain_id
                );
                return Ok(cached_results
                    .into_iter()
                    .take(requested_limit as usize)
                    .collect());
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

    Ok(results.into_iter().take(requested_limit as usize).collect())
}
