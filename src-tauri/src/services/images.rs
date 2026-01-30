//! Serviço para gerenciar cache de imagens (capas de jogos)
//! Fornece comandos Tauri para baixar, armazenar e limpar imagens localmente.
//! Utiliza o diretório de dados do aplicativo para armazenar as imagens em cache.

use crate::errors::AppError;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Helper: Garante que o diretório de capas existe e retorna o caminho
fn get_covers_dir(app: &AppHandle) -> Result<PathBuf, AppError> {
    // Busca o diretório de dados do app (ex: %APPDATA%/br.com.playlite/ no Windows)
    let app_data_dir = app.path().app_data_dir().map_err(|e| {
        AppError::IoError(
            std::io::Error::new(std::io::ErrorKind::NotFound, e.to_string()).to_string(),
        )
    })?;

    let covers_dir = app_data_dir.join("covers");

    // Se a pasta não existir, cria
    if !covers_dir.exists() {
        fs::create_dir_all(&covers_dir).map_err(|e| AppError::IoError(e.to_string()))?;
    }

    Ok(covers_dir)
}

/// Comando: Baixa uma imagem e salva localmente
///
/// Retorna o caminho do arquivo salvo
#[tauri::command]
pub async fn cache_cover_image(
    app: AppHandle,
    url: String,
    game_id: String,
) -> Result<String, AppError> {
    // 1. Prepara o caminho
    let covers_dir = get_covers_dir(&app)?;
    // Salva .jpg para simplificar
    let file_name = format!("{}.jpg", game_id);
    let file_path = covers_dir.join(&file_name);

    // 2. Se já existe, retorna o caminho (Cache Hit)
    if file_path.exists() {
        return Ok(file_path.to_string_lossy().to_string());
    }

    // 3. Download (Cache Miss)
    // Usa reqwest para baixar os bytes
    let response = reqwest::get(&url)
        .await
        .map_err(|e| AppError::NetworkError(e.to_string()))?;

    let bytes = response
        .bytes()
        .await
        .map_err(|e| AppError::NetworkError(e.to_string()))?;

    // 4. Salva no disco
    fs::write(&file_path, bytes).map_err(|e| AppError::IoError(e.to_string()))?;

    Ok(file_path.to_string_lossy().to_string())
}

/// Comando: Verifica se existe capa local para um jogo
///
/// Retorna o caminho absoluto se existir, ou None
#[tauri::command]
pub fn check_local_cover(app: AppHandle, game_id: String) -> Option<String> {
    let covers_dir = get_covers_dir(&app).ok()?;
    let path = covers_dir.join(format!("{}.jpg", game_id));

    if path.exists() {
        Some(path.to_string_lossy().to_string())
    } else {
        None
    }
}

/// Comando: Limpa todo o cache de imagens
#[tauri::command]
pub fn clear_cover_cache(app: AppHandle) -> Result<String, AppError> {
    let covers_dir = get_covers_dir(&app)?;

    // Remove a pasta inteira e recria vazia
    if covers_dir.exists() {
        fs::remove_dir_all(&covers_dir).map_err(|e| AppError::IoError(e.to_string()))?;
        fs::create_dir_all(&covers_dir).map_err(|e| AppError::IoError(e.to_string()))?;
    }

    Ok("Cache de imagens limpo com sucesso.".to_string())
}
