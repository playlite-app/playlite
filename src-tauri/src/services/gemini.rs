//! Serviço para interagir com a API Gemini da Google para tradução de texto.
//!
//! Utiliza o modelo Gemini 2.5 para traduções de descrições de jogos.
//! **Função Principal:**
//! - `translate_text`: Traduz texto para português brasileiro mantendo termos técnicos de jogos em inglês.

use crate::constants::GEMINI_API_URL;
use crate::utils::http_client::HTTP_CLIENT;
use serde::Deserialize;
use serde_json::json;
use tracing::{error, info};

#[derive(Deserialize, Debug)]
struct GeminiResponse {
    candidates: Option<Vec<Candidate>>,
    error: Option<GeminiError>, // Captura erros da API
}

#[derive(Deserialize, Debug)]
struct GeminiError {
    message: String,
}

#[derive(Deserialize, Debug)]
struct Candidate {
    content: Option<Content>,
    #[serde(rename = "finishReason")]
    finish_reason: Option<String>, // Útil para saber se foi bloqueado
}

#[derive(Deserialize, Debug)]
struct Content {
    parts: Vec<Part>,
}

#[derive(Deserialize, Debug)]
struct Part {
    text: String,
}

pub async fn translate_text(api_key: &str, text: &str) -> Result<String, String> {
    info!("Iniciando tradução no Gemini (Modelo 2.5)...");

    let url = format!("{}?key={}", GEMINI_API_URL, api_key);

    let prompt = format!(
        "Translate the following game description to Brazilian Portuguese (PT-BR). \
        Maintain the tone (exciting, narrative). \
        Keep technical gaming terms in English if they are commonly used by brazilian gamers (e.g., 'Roguelike', 'Metroidvania', 'Permadeath', 'Loot', 'Crafting'). \
        Output ONLY the translated text, without preambles or markdown code blocks:\n\n{}",
        text
    );

    // Adiciona Safety Settings para permitir descrições de jogos (Violência, etc)
    let body = json!({
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "safetySettings": [
            { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" },
            { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" },
            { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE" },
            { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" }
        ]
    });

    let res = HTTP_CLIENT
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Erro de rede Gemini: {}", e))?;

    // Se o status não for 200, tentamos ler o corpo do erro para debug
    if !res.status().is_success() {
        let status = res.status();
        let error_body = res.text().await.unwrap_or_default();
        error!("Erro API Gemini ({}): {}", status, error_body);
        return Err(format!(
            "A API retornou erro {}: Verifique sua chave ou cota.",
            status
        ));
    }

    let data: GeminiResponse = res
        .json()
        .await
        .map_err(|e| format!("Erro ao ler JSON Gemini: {}", e))?;

    // Verifica se a API retornou um erro estruturado
    if let Some(api_error) = data.error.as_ref() {
        error!("Gemini API Error: {:?}", api_error);
        return Err(format!("Gemini: {}", api_error.message));
    }

    // Tenta extrair o texto
    if let Some(candidates) = data.candidates.as_ref() {
        if let Some(first_candidate) = candidates.first() {
            // Verifica se foi bloqueado por segurança (caso o BLOCK_NONE falhe)
            if let Some(reason) = &first_candidate.finish_reason {
                if reason != "STOP" {
                    error!("Gemini bloqueou conteúdo. Motivo: {}", reason);
                    return Err(format!(
                        "Tradução bloqueada pelo filtro de segurança: {}",
                        reason
                    ));
                }
            }

            if let Some(content) = &first_candidate.content {
                if let Some(part) = content.parts.first() {
                    info!("Tradução concluída com sucesso.");
                    return Ok(part.text.trim().to_string());
                }
            }
        }
    }

    error!("Resposta Gemini inesperada: {:?}", data);
    Err("A IA não retornou nenhuma tradução válida.".to_string())
}
