//! Módulo de gerenciamento do banco de dados da aplicação.
//!
//! Gerencia a criação e inicialização do banco SQLite para a biblioteca de jogos e wishlist,
//! além do armazenamento seguro de secrets (API keys, tokens) com criptografia.
//!
//! **Bancos de Dados:**
//! - library.db: armazena a biblioteca de jogos e wishlist do usuário.
//! - secrets.db: armazena secrets encriptados com AES-256-GCM.

use crate::constants::{DB_FILENAME_LIBRARY, DB_FILENAME_SECRETS, DB_JOURNAL_MODE};
use crate::security;
use rusqlite::{params, Connection};
use std::sync::Mutex;
use tauri::State;
use tauri::{AppHandle, Manager};

/// Define o estado global da aplicação com ambas as conexões
pub struct AppState {
    pub library_db: Mutex<Connection>,
    pub secrets_db: Mutex<Connection>,
}

// === INICIALIZAÇÃO CENTRALIZADA ===

/// Inicializa ambos os bancos de dados e retorna o estado da aplicação
///
/// **Erros:**
/// - Se não conseguir criar os diretórios
/// - Se não conseguir abrir as conexões
/// - Se falhar ao configurar WAL mode
pub fn initialize_databases(app: &AppHandle) -> Result<AppState, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Falha ao obter app_data_dir: {}", e))?;

    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Falha ao criar diretório: {}", e))?;

    // Conexão para library.db
    let library_path = app_data_dir.join(DB_FILENAME_LIBRARY);
    let library_conn = Connection::open(&library_path)
        .map_err(|e| format!("Erro ao abrir {}: {}", DB_FILENAME_LIBRARY, e))?;

    library_conn
        .pragma_update(None, "journal_mode", DB_JOURNAL_MODE)
        .map_err(|e| format!("Erro ao configurar WAL no library.db: {}", e))?;

    tracing::info!(
        "Banco {} inicializado em: {:?}",
        DB_FILENAME_LIBRARY,
        library_path
    );

    // Conexão para secrets.db
    let secrets_path = app_data_dir.join(DB_FILENAME_SECRETS);
    let secrets_conn = Connection::open(&secrets_path)
        .map_err(|e| format!("Erro ao abrir {}: {}", DB_FILENAME_SECRETS, e))?;

    secrets_conn
        .pragma_update(None, "journal_mode", DB_JOURNAL_MODE)
        .map_err(|e| format!("Erro ao configurar WAL no secrets.db: {}", e))?;

    tracing::info!(
        "Banco {} inicializado em: {:?}",
        DB_FILENAME_SECRETS,
        secrets_path
    );

    Ok(AppState {
        library_db: Mutex::new(library_conn),
        secrets_db: Mutex::new(secrets_conn),
    })
}

// === BANCO DE DADOS PARA GERENCIAMENTO DE JOGOS (library.db) ===

/// Inicializa o banco de dados de gerenciamento de jogos.
///
/// Cria as tabelas `games`, `games_details` e `wishlist` se não existirem, e índices otimizados para consultas frequentes.
///
/// **Erros:**
/// - Se falhar ao bloquear o mutex do banco de dados.
/// - Se falhar ao executar comandos SQL.
#[tauri::command]
pub fn init_db(state: State<AppState>) -> Result<String, String> {
    let conn = state
        .library_db
        .lock()
        .map_err(|_| "Falha ao bloquear mutex do library_db")?;

    // === TABELAS BÁSICAS ===

    // Tabela da Biblioteca de Jogos
    conn.execute(
        "CREATE TABLE IF NOT EXISTS games (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            cover_url TEXT,
            platform TEXT NOT NULL,
            platform_id TEXT,
            install_path TEXT,
            executable_path TEXT,
            launch_args TEXT,
            user_rating INTEGER,
            favorite BOOLEAN DEFAULT 0,
            status TEXT,
            playtime INTEGER,
            last_played TEXT,
            added_at TEXT NOT NULL
        );",
        [],
    )
    .map_err(|e| e.to_string())?;

    // Tabela de Detalhes dos Jogos
    conn.execute(
        "CREATE TABLE IF NOT EXISTS game_details (
            game_id TEXT PRIMARY KEY,
            steam_app_id TEXT,
            description TEXT,
            developer TEXT,
            publisher TEXT,
            release_date TEXT,
            genres TEXT,
            tags TEXT,
            series TEXT,
            age_rating TEXT,
            background_image TEXT,
            critic_score INTEGER,
            users_score REAL,
            website_url TEXT,
            igdb_url TEXT,
            rawg_url TEXT,
            pcgamingwiki_url TEXT,
            hltb_main_story INTEGER,
            hltb_main_extra INTEGER,
            hltb_completionist INTEGER,
            FOREIGN KEY(game_id) REFERENCES games(id) ON DELETE CASCADE
        );",
        [],
    )
    .map_err(|e| e.to_string())?;

    // Tabela da Lista de Desejos (Wishlist)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS wishlist (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            cover_url TEXT,
            store_url TEXT,
            store_platform TEXT,
            current_price REAL,
            normal_price REAL,
            lowest_price REAL,
            currency TEXT,
            on_sale BOOLEAN DEFAULT 0,
            added_at TEXT
        );",
        [],
    )
    .map_err(|e| e.to_string())?;

    // === ÍNDICES OTIMIZADOS ===

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_favorite ON games(favorite)",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_name ON games(name COLLATE NOCASE)",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_platform ON games(platform)",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_wishlist_added ON wishlist(added_at)",
        [],
    )
    .map_err(|e| e.to_string())?;

    Ok("Banco de jogos inicializado com sucesso!".to_string())
}

// === BANCO DE DADOS PARA GERENCIAMENTO DE API KEYS (secrets.db) ===

/// Obtém conexão com o banco de secrets a partir do AppState.
///
/// Cria automaticamente a tabela `encrypted_keys` se não existir.
///
/// **Erros:**
/// - Se falhar ao bloquear o mutex do banco de dados.
/// - Se falhar ao executar comandos SQL.
fn get_secrets_connection<'a>(
    state: &'a State<AppState>,
) -> Result<std::sync::MutexGuard<'a, Connection>, String> {
    let conn = state
        .secrets_db
        .lock()
        .map_err(|_| "Falha ao bloquear mutex do secrets_db".to_string())?;

    // Garante que a tabela existe
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS encrypted_keys (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
        "#,
        [],
    )
    .map_err(|e: rusqlite::Error| e.to_string())?;

    Ok(conn)
}

/// Salva um secret encriptado no banco.
///
/// Se a chave já existir, o valor é substituído (upsert).
/// O valor é encriptado antes de ser armazenado.
pub fn set_secret(app: &AppHandle, key_name: &str, value: &str) -> Result<(), String> {
    let state: tauri::State<AppState> = app.state();
    let conn = get_secrets_connection(&state)?;

    let encrypted = security::encrypt(value);

    conn.execute(
        "INSERT OR REPLACE INTO encrypted_keys (key, value) VALUES (?1, ?2)",
        params![key_name, encrypted],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// Recupera e decripta um secret do banco.
///
/// Se a chave não existir, retorna string vazia ao invés de erro.
pub fn get_secret(app: &AppHandle, key_name: &str) -> Result<String, String> {
    let state: tauri::State<AppState> = app.state();
    let conn = get_secrets_connection(&state)?;

    let result: Result<String, rusqlite::Error> = conn.query_row(
        "SELECT value FROM encrypted_keys WHERE key = ?1",
        params![key_name],
        |row| row.get::<_, String>(0),
    );

    match result {
        Ok(encrypted) => {
            let decrypted = security::decrypt(&encrypted)?;
            Ok(decrypted)
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(String::new()),
        Err(e) => Err(e.to_string()),
    }
}

/// Remove um secret do banco permanentemente.
pub fn delete_secret(app: &AppHandle, key_name: &str) -> Result<(), String> {
    let state: tauri::State<AppState> = app.state();
    let conn = get_secrets_connection(&state)?;

    conn.execute(
        "DELETE FROM encrypted_keys WHERE key = ?1",
        params![key_name],
    )
    .map_err(|e: rusqlite::Error| e.to_string())?;

    Ok(())
}

/// Retorna lista de chaves de secrets suportadas pela aplicação.
pub fn list_supported_keys() -> Vec<&'static str> {
    vec![
        "steam_id",
        "steam_api_key",
        "rawg_api_key",
        "igdb_client_id",
        "igdb_client_secret",
    ]
}
