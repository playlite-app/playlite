//! Módulo de gerenciamento da biblioteca de jogos.
//!
//! Implementa operações CRUD (Create, Read, Update, Delete) para jogos,
//! incluindo validações de dados e gerenciamento de favoritos.

use crate::constants;
use crate::database::AppState;
use crate::models;
use rusqlite::params;
use tauri::State;
use url::Url;

use serde::Deserialize;

/// Dados de entrada para criar ou atualizar um jogo.
///
/// Usado tanto em `add_game` quanto em `update_game`.
/// Campos opcionais permitem flexibilidade na entrada de dados.
#[derive(Debug, Deserialize)]
pub struct GameInput {
    pub id: String,
    pub name: String,
    pub genre: Option<String>,
    pub platform: Option<String>,
    #[serde(rename = "coverUrl")]
    pub cover_url: Option<String>,
    pub playtime: Option<i32>,
    pub rating: Option<i32>,
}

/// Adiciona um novo jogo à biblioteca.
///
/// Realiza validações dos dados antes da inserção e verifica
/// duplicação de ID para evitar conflitos.
///
/// # Validações Realizadas
/// - **Nome**: Não vazio, máximo 200 caracteres
/// - **URL da capa**: Formato válido, apenas HTTP/HTTPS, máximo 500 caracteres
/// - **Gênero**: Máximo 100 caracteres
/// - **Plataforma**: Máximo 50 caracteres
/// - **Playtime**: Não negativo, máximo 999999 minutos
/// - **Rating**: Entre 1 e 5 estrelas
/// - **ID único**: Não pode existir outro jogo com mesmo ID
///
/// # Retorna
/// * `Ok(())` - Jogo adicionado com sucesso
/// * `Err(String)` - Erro de validação ou duplicação
///
/// # Exemplo de Uso
/// ```rust
/// // Chamado via Tauri invoke do frontend
/// invoke('add_game', {
///     game: {
///         id: '730',
///         name: 'Counter-Strike 2',
///         genre: 'FPS, Action',
///         platform: 'Steam',
///         coverUrl: 'https://...',
///         playtime: 1200,
///         rating: 5
///     }
/// })
/// ```
#[tauri::command]
pub fn add_game(state: State<AppState>, game: GameInput) -> Result<(), String> {
    if game.name.trim().is_empty() {
        return Err("Nome do jogo não pode ser vazio".to_string());
    }

    if game.name.len() > constants::MAX_NAME_LENGTH {
        return Err(format!(
            "Nome do jogo muito longo (máximo {} caracteres)",
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
        let url = Url::parse(url_str).map_err(|_| "URL inválida ou mal formatada.")?;
        if url.scheme() != "http" && url.scheme() != "https" {
            return Err("A URL deve ser HTTP ou HTTPS.".to_string());
        }
    }

    if let Some(ref g) = game.genre {
        if g.len() > constants::MAX_GENRE_LENGTH {
            return Err(format!(
                "Gênero muito longo (máximo {} caracteres)",
                constants::MAX_GENRE_LENGTH
            ));
        }
    }

    if let Some(ref p) = game.platform {
        if p.len() > constants::MAX_PLATFORM_LENGTH {
            return Err(format!(
                "Plataforma muito longa (máximo {} caracteres)",
                constants::MAX_PLATFORM_LENGTH
            ));
        }
    }

    if let Some(time) = game.playtime {
        if time < 0 {
            return Err("Tempo jogado não pode ser negativo".to_string());
        }
        if time > constants::MAX_PLAYTIME {
            return Err(format!(
                "Tempo jogado inválido (máximo {} horas)",
                constants::MAX_PLAYTIME
            ));
        }
    }

    if let Some(r) = game.rating {
        if !(constants::MIN_RATING..=constants::MAX_RATING).contains(&r) {
            return Err(format!(
                "Avaliação deve estar entre {} e {}",
                constants::MIN_RATING,
                constants::MAX_RATING
            ));
        }
    }

    let conn = state
        .library_db
        .lock()
        .map_err(|_| "Falha ao bloquear mutex")?;

    let exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM games WHERE id = ?1)",
            params![game.id],
            |row| row.get(0),
        )
        .map_err(|e| format!("Erro ao verificar duplicata: {}", e))?;

    if exists {
        return Err("Já existe um jogo com este ID".to_string());
    }

    conn.execute(
        "INSERT INTO games (id, name, genre, platform, cover_url, playtime, rating) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![game.id, game.name, game.genre, game.platform, game.cover_url, game.playtime, game.rating],
    )
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Recupera todos os jogos da biblioteca.
///
/// Retorna a lista completa de jogos ordenada conforme armazenada no banco.
/// Inclui todos os campos, inclusive o status de favorito.
///
/// # Retorna
/// * `Ok(Vec<Game>)` - Lista de todos os jogos
/// * `Err(String)` - Erro ao acessar banco ou mapear dados
///
/// # Exemplo de Uso
/// ```rust
/// // Chamado via Tauri invoke do frontend
/// let games = await invoke('get_games');
/// console.log(`Total de jogos: ${games.length}`);
/// ```
#[tauri::command]
pub fn get_games(state: State<AppState>) -> Result<Vec<models::Game>, String> {
    let conn = state
        .library_db
        .lock()
        .map_err(|_| "Falha ao bloquear mutex")?;

    let mut stmt = conn
        .prepare(
            "SELECT id, name, genre, platform, cover_url, playtime, rating, favorite FROM games",
        )
        .map_err(|e| e.to_string())?;

    let games = stmt
        .query_map([], |row| {
            Ok(models::Game {
                id: row.get(0)?,
                name: row.get(1)?,
                genre: row.get(2)?,
                platform: row.get(3)?,
                cover_url: row.get(4)?,
                playtime: row.get(5)?,
                rating: row.get(6)?,
                favorite: row.get(7)?,
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
/// # Nota
/// - Não retorna erro se o ID não existir (UPDATE silencioso)
/// - Operação idempotente: pode ser chamada múltiplas vezes
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

/// Remove permanentemente um jogo da biblioteca.
///
/// # Retorna
/// * `Ok(())` - Jogo deletado com sucesso
/// * `Err(String)` - Erro ao acessar banco
///
/// # Exemplo de Uso
/// ```rust
/// // Chamado via Tauri invoke do frontend
/// await invoke('delete_game', { id: '730' });
/// ```
///
/// # Nota
/// - Não retorna erro se o ID não existir (DELETE silencioso)
/// - Esta operação é irreversível. Para recuperar, certifique-se de ter ‘backup’ antes de deletar.
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

/// Atualiza informações de um jogo existente.
///
/// Sobrescreve todos os campos (exceto ID) com os novos valores fornecidos.
/// Realiza as mesmas validações de `add_game`.
///
/// # Retorna
/// * `Ok(())` - Jogo atualizado com sucesso
/// * `Err(String)` - Erro de validação ou banco
///
/// # Exemplo de Uso
/// ```rust
/// // Chamado via Tauri invoke do frontend
/// await invoke('update_game', {
///     game: {
///         id: '730',
///         name: 'CS2 - Updated',
///         genre: 'FPS',
///         playtime: 1500,
///         rating: 5
///     }
/// });
/// ```
///
/// # Nota
/// - Não retorna erro se ID não existe (UPDATE silencioso)
/// - Todos os campos são substituídos (não faz merge parcial)
/// - Campo `favorite` não é alterado por esta função
#[tauri::command]
pub fn update_game(state: State<AppState>, game: GameInput) -> Result<(), String> {
    if game.name.trim().is_empty() {
        return Err("Nome do jogo não pode ser vazio".to_string());
    }

    if game.name.len() > constants::MAX_NAME_LENGTH {
        return Err(format!(
            "Nome do jogo muito longo (máximo {} caracteres)",
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
        let url = Url::parse(url_str).map_err(|_| "URL inválida ou mal formatada.")?;
        if url.scheme() != "http" && url.scheme() != "https" {
            return Err("A URL deve ser HTTP ou HTTPS.".to_string());
        }
    }

    if let Some(ref g) = game.genre {
        if g.len() > constants::MAX_GENRE_LENGTH {
            return Err(format!(
                "Gênero muito longo (máximo {} caracteres)",
                constants::MAX_GENRE_LENGTH
            ));
        }
    }

    if let Some(ref p) = game.platform {
        if p.len() > constants::MAX_PLATFORM_LENGTH {
            return Err(format!(
                "Plataforma muito longa (máximo {} caracteres)",
                constants::MAX_PLATFORM_LENGTH
            ));
        }
    }

    if let Some(time) = game.playtime {
        if time < 0 {
            return Err("Tempo jogado não pode ser negativo".to_string());
        }
        if time > constants::MAX_PLAYTIME {
            return Err(format!(
                "Tempo jogado inválido (máximo {} horas)",
                constants::MAX_PLAYTIME
            ));
        }
    }

    if let Some(r) = game.rating {
        if !(constants::MIN_RATING..=constants::MAX_RATING).contains(&r) {
            return Err(format!(
                "Avaliação deve estar entre {} e {}",
                constants::MIN_RATING,
                constants::MAX_RATING
            ));
        }
    }

    let conn = state
        .library_db
        .lock()
        .map_err(|_| "Falha ao bloquear mutex")?;

    conn.execute(
        "UPDATE games SET name = ?1, genre = ?2, platform = ?3, cover_url = ?4, playtime = ?5, rating = ?6 WHERE id = ?7",
        params![game.name, game.genre, game.platform, game.cover_url, game.playtime, game.rating, game.id],
    )
        .map_err(|e| e.to_string())?;

    Ok(())
}
