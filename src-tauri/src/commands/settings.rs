//! Módulo de gerenciamento de configurações e secrets.
//!
//! Fornece interface de alto nível para armazenar e recuperar credenciais
//! sensíveis (API keys, IDs) de forma segura usando criptografia.
//!
//! # Segurança
//! Todos os secrets são criptografados usando AES-256-GCM antes de serem
//! armazenados no banco de dados. A chave de criptografia é derivada de
//! características únicas da máquina via `security::init_security()`.
//!
//! # Secrets Suportados
//! - `steam_id`: Steam ID do usuário (SteamID64)
//! - `steam_api_key`: Steam Web API Key
//! - `rawg_api_key`: RAWG API Key

use crate::database;
use serde::Serialize;
use tauri::AppHandle;

/// Lote de todas as API keys configuradas no sistema.
///
/// Usado para retornar múltiplos secrets de uma vez para o frontend,
/// útil para preencher formulários de configuração.
#[derive(Serialize)]
pub struct KeysBatch {
    /// Steam ID do usuário
    pub steam_id: String,
    /// Steam Web API Key
    pub steam_api_key: String,
    /// RAWG API Key
    pub rawg_api_key: String,
}

/// Recupera todos os secrets configurados em lote.
///
/// Busca e descriptografa todas as credenciais armazenadas,
/// retornando strings vazias para secrets não configurados.
///
/// # Parâmetros
/// * `app` - Handle da aplicação Tauri
///
/// # Retorna
/// * `Ok(KeysBatch)` - Lote com todos os secrets (vazios se não configurados)
/// * `Err(String)` - Erro ao acessar banco ou descriptografar
///
/// # Exemplo de Uso
/// ```rust
/// // Chamado via Tauri invoke
/// const keys = await invoke('get_secrets');
/// if (keys.steam_api_key) {
///     console.log('Steam configurada ✓');
/// }
/// ```
#[tauri::command]
pub fn get_secrets(app: AppHandle) -> Result<KeysBatch, String> {
    Ok(KeysBatch {
        steam_id: database::get_secret(&app, "steam_id")?,
        steam_api_key: database::get_secret(&app, "steam_api_key")?,
        rawg_api_key: database::get_secret(&app, "rawg_api_key")?,
    })
}

/// Configura múltiplos secrets em uma única operação.
///
/// Permite atualizar várias credenciais simultaneamente. Valores vazios
/// ou compostos apenas de whitespace deletam o secret correspondente.
///
/// # Comportamento
/// - **String vazia/whitespace**: Remove o secret do banco
/// - **String com conteúdo**: Criptografa e armazena
/// - **None**: Não altera o secret existente
///
/// # Parâmetros
/// * `app` - Handle da aplicação Tauri
/// * `steam_id` - Novo Steam ID (opcional)
/// * `steam_api_key` - Nova Steam API Key (opcional)
/// * `rawg_api_key` - Nova RAWG API Key (opcional)
///
/// # Retorna
/// * `Ok(())` - Operação concluída com sucesso
/// * `Err(String)` - Erro ao acessar banco ou criptografar
///
/// # Validação
/// Apenas aplica trim() e verifica se vazio. Não valida formato das keys.
/// APIs retornarão erro específico se as keys forem inválidas.
///
/// # Exemplo de Uso
/// ```rust
/// // Atualiza apenas Steam keys, mantém RAWG inalterada
/// await invoke('set_secrets', {
///     steamId: '76561198012345678',
///     steamApiKey: 'XXXXXXXXXXXXXXX',
///     rawgApiKey: null  // Não altera
/// });
///
/// // Deleta Steam ID
/// await invoke('set_secrets', {
///     steamId: '',  // String vazia remove
///     steamApiKey: null,
///     rawgApiKey: null
/// });
/// ```
///
/// # Segurança
/// Os valores são criptografados antes de serem salvos. Nunca são
/// armazenados em texto plano no banco de dados.
#[tauri::command]
pub fn set_secrets(
    app: AppHandle,
    steam_id: Option<String>,
    steam_api_key: Option<String>,
    rawg_api_key: Option<String>,
) -> Result<(), String> {
    // Steam ID
    if let Some(id) = steam_id {
        let trimmed = id.trim();
        if trimmed.is_empty() {
            database::delete_secret(&app, "steam_id")?;
        } else {
            database::set_secret(&app, "steam_id", trimmed)?;
        }
    }

    // Steam API Key
    if let Some(key) = steam_api_key {
        let trimmed = key.trim();
        if trimmed.is_empty() {
            database::delete_secret(&app, "steam_api_key")?;
        } else {
            database::set_secret(&app, "steam_api_key", trimmed)?;
        }
    }

    // Rawg API Key
    if let Some(rawg) = rawg_api_key {
        let trimmed = rawg.trim();
        if trimmed.is_empty() {
            database::delete_secret(&app, "rawg_api_key")?;
        } else {
            database::set_secret(&app, "rawg_api_key", trimmed)?;
        }
    }

    Ok(())
}

/// Define um secret individual por nome de chave.
///
/// Versão genérica que permite configurar qualquer secret suportado
/// fornecendo nome e valor.
///
/// # Parâmetros
/// * `app` - Handle da aplicação Tauri
/// * `key_name` - Nome da chave (ex: "steam_api_key")
/// * `key_value` - Valor a ser armazenado
///
/// # Retorna
/// * `Ok(())` - Secret configurado com sucesso
/// * `Err(String)` - Valor vazio ou erro ao criptografar/salvar
///
/// # Validação
/// Rejeita valores vazios ou apenas whitespace.
///
/// # Exemplo de Uso
/// ```rust
/// await invoke('set_secret', {
///     keyName: 'steam_api_key',
///     keyValue: 'XXXXXXXXXXXXX'
/// });
/// ```
#[tauri::command]
pub fn set_secret(app: AppHandle, key_name: String, key_value: String) -> Result<(), String> {
    let trimmed_val = key_value.trim();

    if trimmed_val.is_empty() {
        return Err("Valor não pode ser vazio".to_string());
    }

    database::set_secret(&app, &key_name, trimmed_val)
}

/// Recupera um secret individual por nome de chave.
///
/// Busca e descriptografa uma credencial específica do banco.
///
/// # Parâmetros
/// * `app` - Handle da aplicação Tauri
/// * `key_name` - Nome da chave (ex: "steam_id")
///
/// # Retorna
/// * `Ok(String)` - Valor descriptografado (vazio se não configurado)
/// * `Err(String)` - Erro ao acessar banco ou descriptografar
///
/// # Exemplo de Uso
/// ```rust
/// const apiKey = await invoke('get_secret', {
///     keyName: 'rawg_api_key'
/// });
///
/// if (apiKey) {
///     // Usar API key...
/// }
/// ```
#[tauri::command]
pub fn get_secret(app: AppHandle, key_name: String) -> Result<String, String> {
    database::get_secret(&app, &key_name)
}

/// Remove permanentemente um secret do banco.
///
/// Deleta a credencial criptografada do banco de dados. Operação irreversível.
///
/// # Parâmetros
/// * `app` - Handle da aplicação Tauri
/// * `key_name` - Nome da chave a ser removida
///
/// # Retorna
/// * `Ok(())` - Secret removido com sucesso
/// * `Err(String)` - Erro ao acessar banco
///
/// # Comportamento
/// - Não retorna erro se o secret não existir (DELETE silencioso)
/// - Ideal para "desconectar" integrações
///
/// # Exemplo de Uso
/// ```rust
/// // Desconectar conta Steam
/// await invoke('delete_secret', {
///     keyName: 'steam_api_key'
/// });
/// await invoke('delete_secret', {
///     keyName: 'steam_id'
/// });
/// ```
#[tauri::command]
pub fn delete_secret(app: AppHandle, key_name: String) -> Result<(), String> {
    database::delete_secret(&app, &key_name)
}

/// Lista todos os nomes de secrets suportados pelo sistema.
///
/// Retorna lista com os nomes de todas as credenciais que podem
/// ser configuradas, útil para validação no frontend.
///
/// # Retorna
/// * `Ok(Vec<String>)` - Lista de nomes suportados
/// * `Err(String)` - Nunca retorna erro (operação local)
///
/// # Exemplo de Uso
/// ```rust
/// const supported = await invoke('list_secrets');
/// console.log('Secrets disponíveis:', supported);
/// // Output: ["steam_id", "steam_api_key", "rawg_api_key"]
/// ```
#[tauri::command]
pub fn list_secrets() -> Result<Vec<String>, String> {
    Ok(database::list_supported_keys()
        .into_iter()
        .map(|s| s.to_string())
        .collect())
}
