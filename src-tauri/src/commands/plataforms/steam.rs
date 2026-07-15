//! Importa a biblioteca completa de jogos Steam do usuário.
//!
//! Obtém jogos de múltiplas fontes: instalados via arquivos VDF locais do Steam, não instalados
//! via librarycache do Steam e usa como fallback a API para jogos não encontrados localmente.

use crate::commands::plataforms::core::persist_source_games;
use crate::database::AppState;
use crate::errors::AppError;
use crate::sources::steam;
use tauri::{AppHandle, Emitter, State};
use tracing::info;

#[tauri::command]
pub async fn import_steam_library(
    app: AppHandle,
    state: State<'_, AppState>,
    api_key: String,
    steam_id: String,
    steam_root: String,
) -> Result<String, AppError> {
    use crate::sources::providers::GameSource; // Importa o Trait

    // 1. Instancia o provedor baseado no novo modelo de Trait
    let source = steam::SteamSource {
        steam_root,
        api_key,
        steam_id,
    };

    // 2. Busca os jogos (VDF + Cache + API)
    let games = source.fetch_games().await?;

    if games.is_empty() {
        return Ok("Nenhum jogo encontrado na Steam.".to_string());
    }

    // 3. Persiste usando a função genérica otimizada
    let (inserted, updated) = persist_source_games(&state, games).await?;
    let message = format!("Steam: {} adicionados, {} atualizados", inserted, updated);
    info!("{}", message);

    // Notifica o frontend
    let _ = app.emit("library_updated", ());

    Ok(message)
}
