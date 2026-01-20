//! Comando Tauri para traduzir descrições de jogos usando o serviço Gemini AI.
//!
//! **Fluxo:**
//! 1. Recupera a chave API do banco de dados seguro.
//! 2. Chama o serviço Gemini para traduzir o texto.
//! 3. Salva a tradução no banco de dados local para evitar custos futuros.

use crate::database;
use crate::database::AppState;
use crate::services::gemini;
use rusqlite::params;
use tauri::{AppHandle, Manager, State};
use tracing::{error, info};

/// Traduz a descrição de um jogo
#[tauri::command]
pub async fn translate_description(
    app: AppHandle,
    game_id: String,
    text: String,
) -> Result<String, String> {
    info!("Comando de tradução recebido para jogo ID: {}", game_id);

    // 1. Busca a chave no banco seguro
    let api_key = database::get_secret(&app, "gemini_api_key").map_err(|e| {
        error!("Falha ao ler banco de secrets: {}", e);
        "Erro interno de banco de dados".to_string()
    })?;

    if api_key.is_empty() {
        error!("Chave Gemini não encontrada no banco!");
        return Err("API Key do Gemini não configurada. Vá em Configurações.".to_string());
    }

    // 2. Chama o serviço de tradução
    let translated_text = gemini::translate_text(&api_key, &text).await?;

    // 3. Salva a tradução no banco para não gastar cota depois
    let state: State<AppState> = app.state();
    let conn = state
        .library_db
        .lock()
        .map_err(|_| "Falha ao acessar banco")?;

    conn.execute(
        "UPDATE game_details SET description_ptbr = ?1 WHERE game_id = ?2",
        params![translated_text, game_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(translated_text)
}
