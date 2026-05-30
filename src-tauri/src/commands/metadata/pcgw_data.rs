//! Comandos Tauri para obtenção e atualização de dados técnicos de jogos via PCGamingWiki.
//!
//! Implementa um fluxo **offline-first**: dados são servidos do cache SQLite sempre
//! que disponíveis, e buscados online apenas quando necessário. Falhas de rede são
//! tratadas graciosamente — o frontend recebe `None` em vez de um erro.
//!
//! # Comandos disponíveis
//! - [`get_or_fetch_pcgw_data`] — retorna dados do cache ou busca online
//! - [`refresh_pcgw_data`]      — invalida o cache e força nova busca
//! - [`search_pcgw_games`]      — busca candidatos por nome de jogo

use crate::errors::AppError;
use crate::models::PcgwData;
use crate::services::integration::pcgamingwiki::client::{search_pcgw_by_name, PcgwSearchResult};
use crate::services::integration::pcgamingwiki::db::{
    get_pcgw_data, invalidate_pcgw_data, save_pcgw_data,
};
use crate::services::integration::pcgamingwiki::fetch::fetch_pcgw_data;
use crate::services::integration::pcgamingwiki::scraper::save_scraped_data;
use chrono::Utc;
use rusqlite::Connection;
use tracing::{debug, info, warn};
// === Comandos Tauri ===

/// Retorna dados do PCGamingWiki para um jogo.
///
/// Fluxo offline-first:
/// 1. Se existe no banco → retorna imediatamente (sem rede)
/// 2. Se não existe → busca online e persiste
/// 3. Se offline e sem dados → retorna erro tratável pelo frontend
///
/// O frontend deve tratar `AppError::NetworkError` exibindo a seção de
/// dados técnicos como indisponível, sem quebrar o resto da view do jogo.
#[tauri::command]
pub async fn get_or_fetch_pcgw_data(
    steam_app_id: String,
    conn: tauri::State<'_, std::sync::Mutex<Connection>>,
) -> Result<Option<PcgwData>, String> {
    // 1. Tenta banco local primeiro
    {
        let db = conn.lock().map_err(|e| e.to_string())?;
        if let Some(data) = get_pcgw_data(&db, &steam_app_id) {
            debug!("pcgw_data: cache hit para {}", steam_app_id);
            return Ok(Some(data));
        }
    }

    // 2. Não encontrado — busca online
    debug!(
        "pcgw_data: cache miss para {}, buscando online",
        steam_app_id
    );
    match fetch_pcgw_data(&steam_app_id).await {
        Ok((data, scraped)) => {
            let db = conn.lock().map_err(|e| e.to_string())?;
            save_pcgw_data(&db, &data).map_err(|e| e.to_string())?;
            if let Some(scraped_data) = scraped {
                save_scraped_data(&db, &data.steam_app_id, &scraped_data)
                    .map_err(|e| e.to_string())?;
            }
            info!("pcgw_data: salvo para {}", steam_app_id);
            Ok(Some(data))
        }
        // Jogo não existe na PCGW — persiste linha vazia para não tentar novamente
        Err(AppError::NotFound(msg)) => {
            warn!(
                "pcgw_data: jogo {} não encontrado na PCGW — {}",
                steam_app_id, msg
            );
            let empty = PcgwData {
                steam_app_id: steam_app_id.clone(),
                fetched_at: Some(Utc::now().to_rfc3339()),
                ..Default::default()
            };
            let db = conn.lock().map_err(|e| e.to_string())?;
            save_pcgw_data(&db, &empty).map_err(|e| e.to_string())?;
            Ok(None)
        }
        // Falha de rede — não persiste nada, frontend trata graciosamente
        Err(AppError::NetworkError(msg)) => {
            warn!("pcgw_data: falha de rede para {} — {}", steam_app_id, msg);
            Ok(None)
        }
        Err(e) => Err(e.to_string()),
    }
}

/// Força a re-busca dos dados do PCGamingWiki para um jogo.
///
/// Invalida o cache existente e dispara nova busca online imediatamente.
/// Útil quando o usuário quer atualizar manualmente (ex.: após um patch grande).
#[tauri::command]
pub async fn refresh_pcgw_data(
    steam_app_id: String,
    conn: tauri::State<'_, std::sync::Mutex<Connection>>,
) -> Result<Option<PcgwData>, String> {
    {
        let db = conn.lock().map_err(|e| e.to_string())?;
        invalidate_pcgw_data(&db, &steam_app_id).map_err(|e| e.to_string())?;
    }

    // Reutiliza o fluxo completo de busca
    get_or_fetch_pcgw_data(steam_app_id, conn).await
}

/// Busca candidatos no PCGamingWiki por nome de jogo.
///
/// Retorna até 5 resultados ordenados por relevância para o usuário confirmar
/// o jogo correto — útil quando o Steam AppID não está disponível ou a busca
/// por AppID não retornou resultados.
///
/// # Erros
/// Retorna `Err(String)` em caso de falha de rede ou resposta inesperada da API.
#[tauri::command]
pub async fn search_pcgw_games(game_name: String) -> Result<Vec<PcgwSearchResult>, String> {
    search_pcgw_by_name(&game_name)
        .await
        .map_err(|e| e.to_string())
}
