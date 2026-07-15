//! Configuração genérica de provedores OAuth2 e funções de troca/renovação de token.
//!
//! Cada plataforma (GOG, Battle.net, EA, Amazon Games) fornece um `OAuthProviderConfig`
//! e reaproveita estas funções em vez de reimplementar o fluxo.

use crate::errors::AppError;
use crate::utils::http_client::HTTP_CLIENT;
use crate::utils::oauth::core::PkceChallenge;
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use url::Url;

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum TokenRequestMethod {
    Post,
    Get,
}

/// Configuração de um provedor OAuth2.
#[derive(Debug, Clone)]
pub struct OAuthProviderConfig {
    pub provider_id: &'static str,
    pub client_id: String,
    pub client_secret: Option<String>,
    pub authorize_endpoint: String,
    pub token_endpoint: String,
    pub redirect_uri: String,
    pub scopes: Vec<String>,
    pub uses_pkce: bool,
    pub extra_params: Vec<(String, String)>,
    pub token_request_method: TokenRequestMethod,
}

/// Resposta bruta do endpoint de token do provedor.
#[derive(Debug, Deserialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub refresh_token: Option<String>,
    #[serde(default)]
    pub expires_in: Option<u64>, // segundos
    #[serde(default)]
    pub token_type: Option<String>,
    #[serde(default)]
    pub scope: Option<String>,
}

/// Forma persistida do token (o que vai encriptado pro secrets.db).
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OAuthToken {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: Option<i64>, // timestamp unix; None = expiração desconhecida
    pub scope: Option<String>,
}

impl From<TokenResponse> for OAuthToken {
    fn from(resp: TokenResponse) -> Self {
        let expires_at = resp.expires_in.map(|secs| now_unix() + secs as i64);
        Self {
            access_token: resp.access_token,
            refresh_token: resp.refresh_token,
            expires_at,
            scope: resp.scope,
        }
    }
}

impl OAuthToken {
    /// Considera expirado 60s antes do prazo real, pra dar margem de segurança contra latência de rede durante uma chamada de API.
    pub fn is_expired(&self) -> bool {
        match self.expires_at {
            Some(exp) => now_unix() >= exp - 60,
            None => false,
        }
    }
}

fn now_unix() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}

/// Monta a URL de autorização para abrir no navegador do sistema.
pub fn build_authorize_url(
    config: &OAuthProviderConfig,
    pkce: Option<&PkceChallenge>,
    state: &str,
) -> Result<Url, AppError> {
    let mut url = Url::parse(&config.authorize_endpoint)
        .map_err(|e| AppError::OAuthConfigError(format!("URL de autorização inválida: {e}")))?;

    {
        let mut query = url.query_pairs_mut();
        query
            .append_pair("client_id", &config.client_id)
            .append_pair("redirect_uri", &config.redirect_uri)
            .append_pair("response_type", "code")
            .append_pair("state", state);

        if !config.scopes.is_empty() {
            query.append_pair("scope", &config.scopes.join(" "));
        }

        if config.uses_pkce {
            let pkce = pkce.ok_or_else(|| {
                AppError::OAuthConfigError(
                    "uses_pkce=true mas nenhum PkceChallenge foi fornecido".into(),
                )
            })?;
            query
                .append_pair("code_challenge", &pkce.challenge)
                .append_pair("code_challenge_method", "S256");
        }

        for (key, value) in &config.extra_params {
            query.append_pair(key, value);
        }
    }

    Ok(url)
}

/// Troca o `code` recebido no callback por um access_token.
pub async fn exchange_code_for_token(
    config: &OAuthProviderConfig,
    code: &str,
    pkce_verifier: Option<&str>,
) -> Result<TokenResponse, AppError> {
    let mut params = vec![
        ("grant_type", "authorization_code".to_string()),
        ("code", code.to_string()),
        ("redirect_uri", config.redirect_uri.clone()),
        ("client_id", config.client_id.clone()),
    ];
    if let Some(secret) = &config.client_secret {
        params.push(("client_secret", secret.clone()));
    }
    if let Some(verifier) = pkce_verifier {
        params.push(("code_verifier", verifier.to_string()));
    }

    let request = match config.token_request_method {
        TokenRequestMethod::Get => HTTP_CLIENT.get(&config.token_endpoint).query(&params),
        TokenRequestMethod::Post => HTTP_CLIENT.post(&config.token_endpoint).form(&params),
    };
    let response = request.send().await?;

    parse_token_response(response, config.provider_id, "exchange").await
}

/// Renova o access_token usando o refresh_token salvo.
pub async fn refresh_access_token(
    config: &OAuthProviderConfig,
    refresh_token: &str,
) -> Result<TokenResponse, AppError> {
    let mut params = vec![
        ("grant_type", "refresh_token".to_string()),
        ("refresh_token", refresh_token.to_string()),
        ("client_id", config.client_id.clone()),
    ];
    if let Some(secret) = &config.client_secret {
        params.push(("client_secret", secret.clone()));
    }

    let request = match config.token_request_method {
        TokenRequestMethod::Get => HTTP_CLIENT.get(&config.token_endpoint).query(&params),
        TokenRequestMethod::Post => HTTP_CLIENT.post(&config.token_endpoint).form(&params),
    };
    let response = request.send().await?;

    parse_token_response(response, config.provider_id, "refresh").await
}

async fn parse_token_response(
    response: reqwest::Response,
    provider_id: &str,
    stage: &str,
) -> Result<TokenResponse, AppError> {
    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(AppError::OAuthTokenExchangeError(format!(
            "[{provider_id}] falha em '{stage}': HTTP {status} - {body}"
        )));
    }

    response.json::<TokenResponse>().await.map_err(|e| {
        AppError::OAuthTokenExchangeError(format!(
            "[{provider_id}] resposta inesperada em '{stage}': {e}"
        ))
    })
}
