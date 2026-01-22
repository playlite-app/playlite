//! Módulo de integração com as APIs Steam.
//!
//! Unifica funcionalidades da API de Usuário (autenticada) para importar biblioteca
//! e da API da Loja (pública) para enriquecer metadados (reviews, conteúdo adulto).

use crate::constants::{REVIEW_API_URL, STEAMSPY_API_URL, STEAM_STORE_API_URL};
use crate::models::WishlistGame;
use crate::utils::http_client::HTTP_CLIENT;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::time::Duration;

// === API DE USUÁRIO - IMPORTAÇÃO DE BIBLIOTECA, CONQUISTAS E WISHLIST (Requer API Key) ===

// Estruturas auxiliares para deserializar respostas da API Steam

/// Estruturas auxiliares para representar um jogo na biblioteca Steam.
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

/// Estrutura auxiliares para obter conquistas de um jogo.
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct SteamAchievement {
    pub apiname: String,
    pub achieved: i32,
    pub unlocktime: i64,
    pub name: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
struct PlayerStats {
    achievements: Option<Vec<SteamAchievement>>,
}

#[derive(Debug, Deserialize)]
struct PlayerStatsResponse {
    playerstats: PlayerStats,
}

#[derive(Debug, Deserialize)]
struct RecentGamesResponse {
    response: RecentGamesData,
}

#[derive(Debug, Deserialize)]
struct RecentGamesData {
    games: Option<Vec<SteamGame>>,
}

/// Estruturas auxiliares para importar wishlist de um usuário Steam.
#[derive(Debug, Deserialize)]
struct WishlistEntry {
    name: String,
    capsule: String, // Capa pequena (header image)
    review_score: Option<i32>,
    review_desc: Option<String>,
    release_string: Option<String>,
    added: i64,                     // Timestamp Unix
    subs: Option<Vec<WishlistSub>>, // Informações de preço/pacote
    #[serde(default)]
    priority: i32,
    background: Option<String>,
}

#[derive(Debug, Deserialize)]
struct WishlistSub {
    id: u32,
    price: Option<String>, // Cuidado: Steam retorna "1999" (centavos) ou string vazia
    discount_block: Option<String>, // HTML com desconto
    discount_pct: Option<i32>,
}

// Funções da API de Usuário

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

/// Busca jogos jogados nas últimas 2 semanas
pub async fn get_recently_played_games(
    api_key: &str,
    steam_id: &str,
) -> Result<Vec<SteamGame>, String> {
    let url = format!(
        "https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key={}&steamid={}&format=json&count=10",
        api_key, steam_id
    );

    let res = crate::utils::http_client::HTTP_CLIENT
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Erro Steam Recent Games: {}", res.status()));
    }

    let data: RecentGamesResponse = res.json().await.map_err(|e| e.to_string())?;
    Ok(data.response.games.unwrap_or_default())
}

/// Busca conquistas do jogador num jogo específico
pub async fn get_player_achievements(
    api_key: &str,
    steam_id: &str,
    app_id: u32,
) -> Result<Vec<SteamAchievement>, String> {
    // Usamos l=brazilian para tentar pegar nomes traduzidos se disponíveis
    let url = format!(
        "https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid={}&key={}&steamid={}&l=brazilian",
        app_id, api_key, steam_id
    );

    let res = crate::utils::http_client::HTTP_CLIENT
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    // Jogos sem conquistas retornam 400 ou erro, então tratamos como lista vazia
    if !res.status().is_success() {
        return Ok(vec![]);
    }

    let data: Result<PlayerStatsResponse, _> = res.json().await;
    match data {
        Ok(d) => Ok(d.playerstats.achievements.unwrap_or_default()),
        Err(_) => Ok(vec![]), // Falha no parse (jogo sem conquistas públicas)
    }
}

/// Busca a lista de desejos pública de um perfil Steam.
///
/// Retorna um vetor de `WishlistGame` pronto para o banco de dados.
pub async fn fetch_wishlist(steam_id: &str) -> Result<Vec<WishlistGame>, String> {
    let url = format!(
        "https://store.steampowered.com/wishlist/profiles/{}/wishlistdata/?p=0",
        steam_id
    );

    let res = crate::utils::http_client::HTTP_CLIENT
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!(
            "Erro ao acessar Wishlist (Status {}). Verifique se o perfil e a lista de desejos estão PÚBLICOS na Steam.",
            res.status()
        ));
    }

    // O JSON é um Map: { "appid": { dados... }, "appid2": { ... } }
    let json_map: HashMap<String, WishlistEntry> = res.json().await.map_err(|e| {
        format!(
            "Falha ao ler JSON da Steam. O perfil pode estar privado. Detalhes: {}",
            e
        )
    })?;

    let mut wishlist_games = Vec::new();

    for (app_id, entry) in json_map {
        // Tenta extrair preço
        let (price, final_price, discount) = if let Some(subs) = &entry.subs {
            if let Some(sub) = subs.first() {
                // Preço vem em centavos como string "1999" -> 19.99
                // Se for grátis ou não lançado, pode vir vazio ou nulo
                let normal = sub
                    .price
                    .as_ref()
                    .and_then(|p| p.parse::<f64>().ok())
                    .map(|p| p / 100.0)
                    .unwrap_or(0.0);

                let pct = sub.discount_pct.unwrap_or(0) as f64;

                // Calcula preço final baseado no desconto
                let current = if pct > 0.0 {
                    normal * (1.0 - (pct / 100.0))
                } else {
                    normal
                };

                (Some(normal), Some(current), pct > 0.0)
            } else {
                (None, None, false)
            }
        } else {
            (None, None, false)
        };

        // Formata data de adição
        let added_at = chrono::DateTime::from_timestamp(entry.added, 0)
            .map(|dt| dt.to_rfc3339())
            .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());

        let game = WishlistGame {
            id: app_id.clone(),
            name: entry.name,
            cover_url: Some(entry.capsule), // Usa a imagem 'capsule' (padrão da lista)
            store_url: Some(format!("https://store.steampowered.com/app/{}", app_id)),
            store_platform: Some("Steam".to_string()),
            itad_id: None, // Será preenchido depois se integrarmos IsThereAnyDeal
            current_price: final_price,
            normal_price: price,
            lowest_price: final_price, // Inicialmente assume o atual como menor
            currency: Some("BRL".to_string()), // Assumindo BRL por enquanto (a API retorna na moeda do IP do servidor)
            on_sale: discount,
            voucher: None,
            added_at: Some(added_at),
        };

        wishlist_games.push(game);
    }

    // Ordena pelos mais recentemente adicionados
    wishlist_games.sort_by(|a, b| b.added_at.cmp(&a.added_at));

    Ok(wishlist_games)
}

//  === API DA LOJA - METADADOS, REVIEWS E CONTEÚDO ADULTO (Pública) ===

// Estruturas auxiliares para deserializar respostas da API da Loja Steam

/// Detalhes da loja Steam para um aplicativo (jogo).
#[derive(Debug, Clone, Serialize, Deserialize)]
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentDescriptors {
    pub ids: Vec<u32>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: u32,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Genre {
    pub id: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SteamReviewSummary {
    pub review_score: u32,
    pub review_score_desc: String,
    pub total_positive: u32,
    pub total_negative: u32,
    pub total_reviews: u32,
}

// Funções da API da Loja

/// Busca detalhes da loja (Conteúdo adulto, descrição, imagens)
///
/// Retorna Option porque o jogo pode não existir na loja (removido/banido).
pub async fn get_app_details(app_id: &str) -> Result<Option<SteamStoreData>, String> {
    // Filtra apenas os campos necessários
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

/// Detecta conteúdo explícito (sexual) baseado exclusivamente em critérios da Steam
///
/// Retorna:
/// - bool: se é conteúdo explícito
/// - Vec<String>: flags descritivas encontradas
pub fn detect_adult_content(data: &SteamStoreData) -> (bool, Vec<String>) {
    let mut flags = Vec::new();
    let mut is_explicit = false;

    // 1. Content Descriptors (fonte mais confiável)
    for id in &data.content_descriptors.ids {
        match id {
            // Sexual Content
            2 => {
                is_explicit = true;
                flags.push("sexual content".to_string());
            }

            // Nudity
            3 => {
                is_explicit = true;
                flags.push("nudity".to_string());
            }

            // Informativos (não explícitos)
            1 => flags.push("violence".to_string()),
            4 => flags.push("gore".to_string()),
            5 => flags.push("adult themes".to_string()),

            _ => {}
        }
    }

    // 2. Notes (geralmente usadas para Adult Only Sexual Content)
    if let Some(notes) = &data.content_descriptors.notes {
        let notes_lower = notes.to_lowercase();

        let explicit_keywords = [
            "adult only sexual content",
            "explicit sexual",
            "pornographic",
            "sexual acts",
            "graphic sexual",
        ];

        for keyword in explicit_keywords {
            if notes_lower.contains(keyword) {
                is_explicit = true;
                flags.push(keyword.to_string());
            }
        }
    }

    // 3. Tags / gêneros como fallback fraco
    for genre in &data.genres {
        let desc = genre.description.to_lowercase();

        let explicit_genre_keywords = [
            "hentai",
            "nsfw",
            "eroge",
            "porn",
            "sexual content",
            "adult only",
        ];

        for keyword in explicit_genre_keywords {
            if desc.contains(keyword) {
                is_explicit = true;
                flags.push(keyword.to_string());
            }
        }
    }

    // 4. Normalização
    flags.sort();
    flags.dedup();

    (is_explicit, flags)
}

// === STEAMSPY (API não oficial) - ESTATÍSTICAS DE JOGO (Pública) ===

#[derive(Debug, Deserialize)]
struct SteamSpyResponse {
    median_forever: u32,
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
