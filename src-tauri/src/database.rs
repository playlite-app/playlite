//! Módulo de gerenciamento do banco de dados da aplicação.
//!
//! Gerencia a criação e inicialização do banco SQLite para a biblioteca de jogos e wishlist,
//! além do armazenamento seguro de secrets (API keys, tokens) com criptografia.
//!
//! # Bancos de Dados
//! - library.db: armazena a biblioteca de jogos e wishlist do usuário.
//! - secrets.db: armazena secrets encriptados com AES-256-GCM.
//!
//! # Funcionalidades
//! - Inicialização do banco de dados com tabelas e índices otimizados.
//! - Comandos Tauri para manipulação dos dados de jogos e lista de ddesejos (CRUD).
//! - Armazenamento seguro de secrets com encriptação e decriptação.
//!
//! # Uso
//! As funções deste módulo são expostas como comandos Tauri
//! e podem ser invocadas do frontend para interagir com o banco de dados.
//!
//! # Exemplo
//! ```no_run
//! let result = app_handle.invoke::<String>("init_db", ());
//! match result {
//!   Ok(msg) => println!("Banco inicializado: {}", msg),
//! Err(err) => eprintln!("Erro ao inicializar banco: {}", err),
//! }
//! ```
//! # Nota
//! Este módulo deve ser inicializado durante o setup da aplicação
//! para garantir que os bancos estejam prontos antes do uso.
//!
//! # Segurança
//! O módulo utiliza o sistema de segurança definido em `security.rs`.
//! Este módulo armazena dados sensíveis em SQLite com criptografia AES-256-GCM.
//! Todos os valores são encriptados antes de serem salvos e decriptados ao recuperar.

use crate::constants::DB_FILENAME_SECRETS;
use crate::security;
use rusqlite::{params, Connection};
use std::sync::Mutex;
use tauri::State;
use tauri::{AppHandle, Manager};

/// Define o estado global da aplicação
pub struct AppState {
    pub db: Mutex<Connection>,
}

// === BANCO DE DADOS PARA GERENCIAMENTO DE JOGOS ===

/// Inicializa o banco de dados de gerenciamento de jogos.
///
/// Cria as tabelas `games` e `wishlist` se não existirem,
/// além de índices otimizados para consultas frequentes.
///
/// # Erros
/// - Se não conseguir adquirir o lock do mutex do banco
/// - Se qualquer comando SQL falhar
///
/// # Retorna
/// - `Ok(String)` com mensagem de sucesso
/// - `Err(String)` com mensagem de erro
///
/// # Tabelas Criadas
/// - `games`: Armazena a biblioteca de jogos do usuário.
/// - `wishlist`: Armazena a lista de desejos com tracking de preços.
///
/// # Índices Criados
/// - `idx_favorite`: Índice para filtrar jogos favoritos.
/// - `idx_name`: Índice para busca case-insensitive por nome de jogo.
/// - `idx_platform`: Índice para filtrar por plataforma.
/// - `idx_wishlist_added`: Índice para ordenação por data de adição na wishlist.
///
/// # Uso
/// Esta função é exposta como comando Tauri e pode ser chamada do frontend
/// para garantir que o banco de dados esteja inicializado antes do uso.
///
/// # Exemplo
/// ```no_run
/// let result = app_handle.invoke::<String>("init_db", ());
/// match result {
///    Ok(msg) => println!("Banco inicializado: {}", msg),
///   Err(err) => eprintln!("Erro ao inicializar banco: {}", err),
/// }
/// ```
///
/// # Nota
/// Esta função deve ser chamada apenas uma vez durante a inicialização da aplicação.
/// Chamar múltiplas vezes é seguro, mas desnecessário.
#[tauri::command]
pub fn init_db(state: State<AppState>) -> Result<String, String> {
    let conn = state.db.lock().map_err(|_| "Falha ao bloquear mutex")?;

    // === TABELAS BÁSICAS ===

    // Tabela da Biblioteca de Jogos
    conn.execute(
        "CREATE TABLE IF NOT EXISTS games (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            genre TEXT,
            platform TEXT,
            cover_url TEXT,
            playtime INTEGER DEFAULT 0,
            rating INTEGER,
            favorite BOOLEAN DEFAULT FALSE
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    // Tabela da Lista de Desejos
    conn.execute(
        "CREATE TABLE IF NOT EXISTS wishlist (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            cover_url TEXT,
            store_url TEXT,
            current_price REAL,
            lowest_price REAL,
            on_sale BOOLEAN DEFAULT 0,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            localized_price REAL,
            localized_currency TEXT,
            steam_app_id INTEGER
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    // === ÍNDICES OTIMIZADOS ===

    // Índice para filtro de favoritos
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_favorite ON games(favorite)",
        [],
    )
    .map_err(|e| e.to_string())?;

    // Índice para busca case-insensitive por nome
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_name ON games(name COLLATE NOCASE)",
        [],
    )
    .map_err(|e| e.to_string())?;

    // Índice para filtro por plataforma
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_platform ON games(platform)",
        [],
    )
    .map_err(|e| e.to_string())?;

    // Índice para ordenação por data de adição na wishlist
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_wishlist_added ON wishlist(added_at)",
        [],
    )
    .map_err(|e| e.to_string())?;

    Ok("Banco inicializado com sucesso!".to_string())
}

// === BANCO DE DADOS PARA GERENCIAMENTO DE APIs KEYS  ===

/// Obtém conexão com o banco de secrets e garante que a tabela existe.
///
/// Cria automaticamente a tabela `encrypted_keys` se não existir.
/// O banco é armazenado em `app_data_dir/{DB_FILENAME_SECRETS}`.
///
/// # Erros
/// - Se `app_data_dir` não puder ser resolvido
/// - Se não conseguir abrir/criar o arquivo SQLite
/// - Se a criação da tabela falhar
fn db(app: &AppHandle) -> Result<Connection, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app_data_dir não encontrado: {}", e))?;

    let conn = Connection::open(app_dir.join(DB_FILENAME_SECRETS)).map_err(|e| e.to_string())?;

    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS encrypted_keys (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
        "#,
        [],
    )
    .map_err(|e| e.to_string())?;

    Ok(conn)
}

/// Salva um secret encriptado no banco.
///
/// Se a chave já existir, o valor é substituído (upsert).
/// O valor é automaticamente encriptado antes de ser armazenado.
///
/// # Argumentos
/// * `key_name` - Identificador único do secret (ex: "steam_api_key")
/// * `value` - Valor em texto plano a ser encriptado e salvo
///
/// # Erros
/// - Se o banco não puder ser acessado
/// - Se a operação de insert/update falhar
///
/// # Exemplo
/// ```no_run
/// set_secret(&app, "appx_api_key", "ABC123XYZ")?;
/// ```
pub fn set_secret(app: &AppHandle, key_name: &str, value: &str) -> Result<(), String> {
    let conn = db(app)?;
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
/// Isso permite verificar se um secret está configurado sem tratamento especial.
///
/// # Argumentos
/// * `key_name` - Identificador do secret a recuperar
///
/// # Retorna
/// - `Ok(String)` - Valor decriptado, ou string vazia se não existir
/// - `Err(String)` - Se houver erro de banco ou decriptação
///
/// # Erros
/// - Se o banco não puder ser acessado
/// - Se a decriptação falhar (dados corrompidos ou chave inválida)
/// - Outros erros de SQLite (exceto "não encontrado")
///
/// # Exemplo
/// ```no_run
/// let api_key = get_secret(&app, "steam_api_key")?;
/// if api_key.is_empty() {
///     println!("API key não configurada");
/// }
/// ```
pub fn get_secret(app: &AppHandle, key_name: &str) -> Result<String, String> {
    let conn = db(app)?;

    let result: Result<String, _> = conn.query_row(
        "SELECT value FROM encrypted_keys WHERE key = ?1",
        params![key_name],
        |row| row.get(0),
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
///
/// É uma operação silenciosa - não retorna erro se a chave não existir.
///
/// # Argumentos
/// * `key_name` - Identificador do secret a remover
///
/// # Erros
/// - Se o banco não puder ser acessado
/// - Se a operação DELETE falhar
pub fn delete_secret(app: &AppHandle, key_name: &str) -> Result<(), String> {
    let conn = db(app)?;

    conn.execute(
        "DELETE FROM encrypted_keys WHERE key = ?1",
        params![key_name],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// Retorna lista de chaves de secrets suportadas pela aplicação.
///
/// Útil para validação e geração de UI de configurações.
/// Adicione novas chaves aqui quando integrar novos serviços.
///
/// # Retorna
/// Vetor com identificadores de todos os secrets esperados:
/// - `"steam_id"` - Steam User ID (público)
/// - `"steam_api_key"` - Steam Web API Key
/// - `"rawg_api_key"` - RAWG.io API Key
pub fn list_supported_keys() -> Vec<&'static str> {
    vec!["steam_id", "steam_api_key", "rawg_api_key"]
}
