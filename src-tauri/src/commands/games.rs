//! Módulo de gerenciamento da biblioteca de jogos.
//!
//! Implementa operações CRUD para jogos.
//! Inclui validações robustas e manipulação de erros para garantir integridade dos dados.

use crate::constants;
use crate::database::AppState;
use crate::models;
use chrono::Utc;
use rusqlite::params;
use serde::Deserialize;
use tauri::State;
use url::Url;

/// Dados de entrada para criar ou atualizar um jogo.
///
/// Reflete os campos da ‘interface’ de adição/edição de jogos.
#[derive(Debug, Deserialize)]
pub struct GameInput {
    pub id: String,
    pub name: String,
    pub platform: Option<String>,
    #[serde(rename = "coverUrl")]
    pub cover_url: Option<String>,
    pub playtime: Option<i32>,
    #[serde(rename = "userRating")]
    pub user_rating: Option<i32>,
    pub status: Option<String>,
    #[serde(rename = "installPath")]
    pub install_path: Option<String>,
    #[serde(rename = "executablePath")]
    pub executable_path: Option<String>,
    #[serde(rename = "launchArgs")]
    pub launch_args: Option<String>,
}

/// Função auxiliar privada para validar dados de entrada.
///
/// Evita duplicação de código entre add e ‘update’.
/// Valida nome, URL da capa, plataforma, tempo jogado e avaliação.
fn validate_input(game: &GameInput) -> Result<(), String> {
    if game.name.trim().is_empty() {
        return Err("Nome do jogo não pode ser vazio".to_string());
    }

    if game.name.len() > constants::MAX_NAME_LENGTH {
        return Err(format!(
            "Nome muito longo (max {})",
            constants::MAX_NAME_LENGTH
        ));
    }

    if let Some(ref url_str) = game.cover_url {
        if url_str.len() > constants::MAX_URL_LENGTH {
            return Err(format!(
                "URL da capa muito longa (máximo {} caracteres)",
                constants::MAX_URL_LENGTH
            ));
        }
        // Validação básica de URL
        if !url_str.starts_with("http") && !url_str.starts_with("asset://") {
            // Aceita asset:// para imagens locais na v2.0
            let url = Url::parse(url_str).map_err(|_| "URL inválida.")?;
            if url.scheme() != "http" && url.scheme() != "https" {
                return Err("A URL deve ser HTTP, HTTPS ou Asset local.".to_string());
            }
        }
    }

    if let Some(ref p) = game.platform {
        if p.len() > constants::MAX_PLATFORM_LENGTH {
            return Err(format!(
                "Plataforma muito longa (max {})",
                constants::MAX_PLATFORM_LENGTH
            ));
        }
    }

    if let Some(time) = game.playtime {
        if time < 0 {
            return Err("Tempo jogado não pode ser negativo".to_string());
        }
        if time > constants::MAX_PLAYTIME {
            return Err("Tempo jogado excessivo".to_string());
        }
    }

    if let Some(r) = game.user_rating {
        if !(constants::MIN_RATING..=constants::MAX_RATING).contains(&r) {
            return Err(format!(
                "Avaliação deve estar entre {} e {}",
                constants::MIN_RATING,
                constants::MAX_RATING
            ));
        }
    }

    Ok(())
}

/// Adiciona um novo jogo à biblioteca.
///
/// Insere dados na tabela 'games' após as validações necessárias.
#[tauri::command]
pub fn add_game(state: State<AppState>, game: GameInput) -> Result<(), String> {
    // ADICIONE ISTO PARA DEBUG:
    println!("PAYLOAD RECEBIDO NO RUST: {:?}", game);

    validate_input(&game)?;

    let conn = state
        .library_db
        .lock()
        .map_err(|_| "Falha ao bloquear mutex")?;

    // Verifica duplicidade
    let exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM games WHERE id = ?1)",
            params![game.id],
            |row| row.get(0),
        )
        .map_err(|e| format!("Erro SQL: {}", e))?;

    if exists {
        return Err("Já existe um jogo com este ID".to_string());
    }

    // Lógica Automática de Status
    let final_status = game.status.unwrap_or_else(|| {
        let minutes = game.playtime.unwrap_or(0);
        if minutes == 0 {
            "backlog".to_string()
        } else if minutes < 120 {
            // menos de 2 horas
            "abandoned".to_string()
        } else if minutes < 1800 {
            // menos de 30 horas
            "playing".to_string()
        } else {
            "completed".to_string()
        }
    });

    let added_at = Utc::now().to_rfc3339();
    let platform = game.platform.unwrap_or("Manual".to_string());

    conn.execute(
        "INSERT INTO games (
            id, name, cover_url, platform, platform_id,
            install_path, executable_path, launch_args,
            user_rating, status, playtime, added_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![
            game.id,
            game.name,
            game.cover_url,
            platform,
            Option::<String>::None, // Platform ID null para manual
            game.install_path,
            game.executable_path,
            game.launch_args,
            game.user_rating,
            final_status,
            game.playtime,
            added_at
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// Atualiza informações de um jogo existente.
///
/// Atualiza os campos, preservando added_at e favorite, com os novos valores fornecidos.
/// Realiza as mesmas validações de 'add_game'.
///
/// **Nota:** Não retorna erro se ‘ID’ não existe (‘update’ silencioso).
#[tauri::command]
pub fn update_game(state: State<AppState>, game: GameInput) -> Result<(), String> {
    // ADICIONE ISTO PARA DEBUG:
    println!("PAYLOAD RECEBIDO NO RUST: {:?}", game);

    validate_input(&game)?;

    let conn = state
        .library_db
        .lock()
        .map_err(|_| "Falha ao bloquear mutex")?;

    conn.execute(
        "UPDATE games SET
            name = ?1,
            cover_url = ?2,
            platform = ?3,
            playtime = ?4,
            user_rating = ?5,
            status = ?6,
            install_path = ?7,
            executable_path = ?8,
            launch_args = ?9
         WHERE id = ?10",
        params![
            game.name,
            game.cover_url,
            game.platform,
            game.playtime,
            game.user_rating,
            game.status,
            game.install_path,
            game.executable_path,
            game.launch_args,
            game.id
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// Recupera todos os jogos da biblioteca.
///
/// Retorna a lista completa de jogos ordenada conforme armazenada no banco.
/// Inclui todos os campos, inclusive o status de favorito.
#[tauri::command]
pub fn get_games(state: State<AppState>) -> Result<Vec<models::Game>, String> {
    let conn = state
        .library_db
        .lock()
        .map_err(|_| "Falha ao bloquear mutex")?;

    let mut stmt = conn
        .prepare(
            "SELECT
            id, name, cover_url, platform, platform_id,
            install_path, executable_path, launch_args,
            user_rating, favorite, status, playtime, last_played, added_at
         FROM games",
        )
        .map_err(|e| e.to_string())?;

    let games = stmt
        .query_map([], |row| {
            Ok(models::Game {
                id: row.get(0)?,
                name: row.get(1)?,
                cover_url: row.get(2)?,
                platform: row.get(3)?,
                platform_id: row.get(4)?,
                install_path: row.get(5)?,
                executable_path: row.get(6)?,
                launch_args: row.get(7)?,
                user_rating: row.get(8)?,
                favorite: row.get(9)?,
                status: row.get(10)?,
                playtime: row.get(11)?,
                last_played: row.get(12)?,
                added_at: row.get(13)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(games)
}

/// Alterna o status de favorito de um jogo.
///
/// Inverte o valor booleano do campo `favorite` usando NOT lógico.
/// Se era favorito, deixa de ser; se não era, passa a ser.
///
/// **Nota:** Esta operação é idempotente e não retorna erro se o ID não existir.
#[tauri::command]
pub fn toggle_favorite(state: State<AppState>, id: String) -> Result<(), String> {
    let conn = state
        .library_db
        .lock()
        .map_err(|_| "Falha ao bloquear mutex")?;

    conn.execute(
        "UPDATE games SET favorite = NOT favorite WHERE id = ?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// Define o status de um jogo na biblioteca.
///
/// Altera o campo `status` para a condição fornecida para o jogo.
/// Não há validação do valor; espera-se que o frontend envie valores válidos.
/// A lista de status possíveis inclui "completed", "playing", "backlog" e "abandoned".
#[tauri::command]
pub fn set_game_status(state: State<AppState>, id: String, status: String) -> Result<(), String> {
    let conn = state.library_db.lock().map_err(|_| "Falha no mutex")?;
    conn.execute(
        "UPDATE games SET status = ?1 WHERE id = ?2",
        params![status, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Define a avaliação pessoal de um jogo.
///
/// Atualiza o campo `user_rating` com o valor fornecido.
/// Aceita valores de 0 a 5, onde 0 remove a avaliação (define como NULL).
#[tauri::command]
pub fn set_game_rating(state: State<AppState>, id: String, rating: i32) -> Result<(), String> {
    // Validação rápida
    if !(0..=5).contains(&rating) {
        return Err("Rating inválido".to_string());
    }

    let conn = state.library_db.lock().map_err(|_| "Falha no mutex")?;

    // Se rating for 0, remove a avaliação (NULL)
    let val = if rating == 0 { None } else { Some(rating) };

    conn.execute(
        "UPDATE games SET user_rating = ?1 WHERE id = ?2",
        params![val, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Remove permanentemente um jogo da biblioteca.
///
/// **Nota:** Esta ação é irreversível e exclui todos os dados relacionados ao jogo.
#[tauri::command]
pub fn delete_game(state: State<AppState>, id: String) -> Result<(), String> {
    let conn = state
        .library_db
        .lock()
        .map_err(|_| "Falha ao bloquear mutex")?;

    conn.execute("DELETE FROM games WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

// Rascunho mental para o futuro
// pub fn update_metadata(id: String, igdb_data: IgdbData) {
// UPDATE game_details SET genre = ?, description = ? ... WHERE game_id = ?
// }
