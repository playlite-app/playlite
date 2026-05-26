//! Integração com GameBrain API
//!
//! Responsável por busca semântica de jogos,
//! descoberta e recomendações.
//!
//! Atualmente implementa:
//! - Busca por características/texto
//! - Filtros (plataforma, gênero, modo de jogo, preço, etc.)
//! - Ordenação (rating, data de lançamento, preço)
//! - Paginação
//!
//! Exemplo:
//! "RPG medieval cooperativo"
//! "Jogo parecido com Skyrim"
//! "FPS cyberpunk"
//!
//! Documentação:
//! https://api.gamebrain.co/

use crate::database;
use crate::services::integration::gemini;
use crate::utils::http_client::HTTP_CLIENT;

use serde::{Deserialize, Serialize};
use tauri::AppHandle;

// === ESTRUTURAS PÚBLICAS ===

/// Resultado simplificado usado pelo frontend.
///
/// Estrutura compatível com:
/// - Wishlist
/// - Busca
/// - Descoberta
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

/// Parâmetros opcionais de busca.
///
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
    /// Filtros a aplicar na busca.
    /// Os valores válidos vêm do campo `filter_options` da resposta da API.
    pub filters: Vec<GameBrainFilter>,

    /// Campo de ordenação.
    pub sort: Option<GameBrainSort>,

    /// Direção da ordenação. Padrão da API: descendente.
    pub sort_order: Option<GameBrainSortOrder>,

    /// Número máximo de resultados. Padrão da API: 10.
    pub limit: Option<u32>,

    /// Offset para paginação.
    pub offset: Option<u32>,
}

/// Um filtro a ser aplicado na busca.
#[derive(Debug, Clone, Serialize)]
pub struct GameBrainFilter {
    /// Chave do filtro (ex: "platform", "genre", "play_mode").
    pub key: String,

    /// Valores do filtro.
    pub values: Vec<GameBrainFilterValue>,

    /// Operador lógico entre os valores: "OR" ou "AND".
    /// A maioria dos filtros usa "OR". Omita para usar o padrão da API.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub connection: Option<String>,
}

/// Um valor individual de filtro.
#[derive(Debug, Clone, Serialize)]
pub struct GameBrainFilterValue {
    /// Valor do filtro (ex: "pc", "action", "single_player").
    pub value: String,
}

/// Campo de ordenação dos resultados.
#[derive(Debug, Clone)]
pub enum GameBrainSort {
    /// Ordena por rating calculado.
    Rating,
    /// Ordena por data de lançamento.
    ReleaseDate,
    /// Ordena por preço.
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

/// Direção da ordenação.
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

// === ESTRUTURAS INTERNAS (RAW JSON) ===

/// Resposta principal da API.
///
/// A estrutura real da API pode mudar.
/// Mantemos apenas os campos necessários.
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

    /// Nome do jogo.
    #[serde(default)]
    name: String,

    /// URL de imagem principal.
    #[serde(default)]
    image: Option<String>,

    /// Gênero principal do jogo.
    #[serde(default)]
    genre: Option<String>,

    /// Ano de lançamento.
    #[serde(default)]
    year: Option<f64>,

    /// Dados de rating.
    #[serde(default)]
    rating: Option<RawRating>,

    /// Plataformas disponíveis.
    #[serde(default)]
    platforms: Vec<RawPlatform>,

    /// Link para a página do jogo na GameBrain.
    #[serde(default)]
    link: Option<String>,

    // Campos alternativos de imagem que alguns endpoints podem retornar.
    #[serde(default)]
    cover: Option<RawCover>,
}

/// Estrutura de rating.
#[derive(Debug, Deserialize)]
struct RawRating {
    /// Score normalizado entre 0.0 e 1.0.
    #[serde(default)]
    mean: f64,
}

/// Estrutura de plataforma.
#[derive(Debug, Deserialize)]
struct RawPlatform {
    /// Nome legível da plataforma (ex: "PC", "Xbox Series X|S").
    #[serde(default)]
    name: String,
}

/// Estrutura de capa (fallback para endpoints legados).
#[derive(Debug, Deserialize)]
struct RawCover {
    #[serde(default)]
    url: String,
}

// === FUNÇÕES PRINCIPAIS ===

/// Busca jogos por descrição/características.
///
/// Exemplos:
/// - "RPG medieval"
/// - "Co-op zombie survival"
/// - "Jogo parecido com Stardew Valley"
///
/// Use `params` para aplicar filtros e ordenação.
/// Para uma busca simples sem filtros, passe `GameBrainSearchParams::default()`.
///
/// Retorna uma lista simplificada compatível com o frontend.
///
/// # Errors
///
/// Retorna erro caso:
/// - API key não esteja configurada
/// - Falha de rede
/// - Erro HTTP
/// - JSON inválido
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

    // Traduz a query para inglês se necessário.
    // Falha silenciosa: se a tradução falhar, usa a query original.
    let english_query = match database::get_secret(app, "gemini_api_key") {
        Ok(gemini_key) if !gemini_key.trim().is_empty() => {
            gemini::translate_query_to_english(&gemini_key, cleaned_query)
                .await
                .unwrap_or_else(|_| cleaned_query.to_string())
        }
        // Se não tiver chave do Gemini configurada, usa a query como está
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
    // Formato esperado pela API:
    // [{"key":"platform","values":[{"value":"pc"}],"connection":"OR"}]
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

    // IMPORTANTE:
    // Durante desenvolvimento, pode ajudar descomentar:
    // tracing::debug!("{}", response_text);

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
/// Equivale a chamar `search_games_by_features` com o filtro
/// `platform: pc` já aplicado.
pub async fn search_pc_games_by_features(
    app: &AppHandle,
    query: &str,
    mut params: GameBrainSearchParams,
) -> Result<Vec<GameBrainSearchResult>, String> {
    // Injeta o filtro de PC caso ainda não esteja presente,
    // preservando quaisquer filtros extras passados pelo caller.
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
