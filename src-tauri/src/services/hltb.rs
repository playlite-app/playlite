//! Serviço de integração com HowLongToBeat (HLTB)
//! Adaptado para manter sessão persistente e evitar erro 403/Session Expired.

use once_cell::sync::Lazy;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tokio::sync::OnceCell;
// Usamos o OnceCell do Tokio para operações async

// User-Agent moderno para evitar bloqueios
static USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// URL da API
const API_URL: &str = "https://howlongtobeat.com/api/search";
const BASE_URL: &str = "https://howlongtobeat.com/";

/// Client global reutilizado (cookies + sessão)
static HLTB_CLIENT: Lazy<Client> = Lazy::new(|| {
    Client::builder()
        .cookie_store(true) // Importante: mantêm os cookies entre requisições
        .user_agent(USER_AGENT)
        .build()
        .expect("Falha ao criar HLTB Client")
});

/// Garante que a sessão seja inicializada apenas uma vez
static HLTB_SESSION_READY: OnceCell<()> = OnceCell::const_new();

fn get_client() -> &'static Client {
    &HLTB_CLIENT
}

/// Acessa a Home Page uma única vez para obter o cookie de sessão
async fn ensure_hltb_session() -> Result<(), String> {
    HLTB_SESSION_READY
        .get_or_try_init(|| async {
            let client = get_client();

            // Faz o "Handshake" com a Home Page
            let res = client
                .get(BASE_URL)
                .header("Referer", "https://google.com")
                .send()
                .await
                .map_err(|e| format!("Erro de conexão inicial: {}", e))?;

            if !res.status().is_success() {
                return Err(format!("Falha ao acessar Home HLTB: {}", res.status()));
            }

            Ok(())
        })
        .await
        .map(|_| ())
}

// --- Estruturas de Dados ---

#[derive(Debug, Deserialize)]
pub struct HltbResponse {
    pub data: Vec<HltbGameRaw>,
}

// Estrutura crua que vem da API (em segundos)
#[derive(Debug, Deserialize)]
pub struct HltbGameRaw {
    #[serde(rename = "game_name")]
    pub game_name: String,
    #[serde(rename = "comp_main")]
    pub comp_main: i32, // Segundos
    #[serde(rename = "comp_plus")]
    pub comp_plus: i32,
    #[serde(rename = "comp_100")]
    pub comp_100: i32,
}

// Estrutura processada que o seu App espera (em horas)
#[derive(Debug, Serialize)]
pub struct HltbResult {
    pub main_story: i32,
    pub main_extra: i32,
    pub completionist: i32,
}

/// Busca dados no HowLongToBeat
/// Retorna Option<HltbResult> para manter compatibilidade com seu metadata.rs
pub async fn search(game_name: &str) -> Result<Option<HltbResult>, String> {
    // 1. Garante que temos sessão válida (executa apenas na 1ª vez)
    ensure_hltb_session().await?;

    let payload = serde_json::json!({
        "searchType": "games",
        "searchTerms": [game_name],
        "searchPage": 1,
        "size": 5,
        "searchOptions": {
            "games": {
                "userId": 0,
                "platform": "",
                "sortCategory": "popular",
                "rangeCategory": "main",
                "rangeTime": { "min": 0, "max": 0 }
            }
        }
    });

    let client = get_client();

    // 2. Faz a busca na API
    let res = client
        .post(API_URL)
        .header("Content-Type", "application/json")
        .header("Referer", BASE_URL)
        .header("Origin", "https://howlongtobeat.com")
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        let body = res.text().await.unwrap_or_default();
        return Err(format!("Erro HLTB API ({}): {}", res.status(), body));
    }

    // 3. Processa o JSON
    let response: HltbResponse = res
        .json()
        .await
        .map_err(|e| format!("Erro ao ler JSON: {}. API pode ter mudado.", e))?;

    // 4. Converte o primeiro resultado para Horas (compatibilidade com Playlite)
    if let Some(game) = response.data.into_iter().next() {
        Ok(Some(HltbResult {
            main_story: (game.comp_main as f32 / 3600.0).round() as i32,
            main_extra: (game.comp_plus as f32 / 3600.0).round() as i32,
            completionist: (game.comp_100 as f32 / 3600.0).round() as i32,
        }))
    } else {
        Ok(None)
    }
}
