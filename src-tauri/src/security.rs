//! Módulo de segurança para criptografia de dados sensíveis.
//!
//! Utiliza AES-256-GCM com chave derivada de dados únicos da máquina.
//! A chave é gerada uma vez por instalação e persiste entre sessões.

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use base64::Engine;
use once_cell::sync::OnceCell;
use rand::RngCore;
use sha2::{Digest, Sha256};
use std::fs;
use tauri::{AppHandle, Manager};
use tauri_plugin_machine_uid::MachineUidExt;

static MASTER_KEY: OnceCell<[u8; 32]> = OnceCell::new();

const SALT_FILE: &str = "crypto_salt.bin";

/// Inicializa o sistema de criptografia derivando chave mestre.
///
/// A chave é derivada de dados únicos da máquina (machine UID, username, app ID)
/// combinados com um salt persistido.
///
/// # Importante
/// Deve ser chamado EXATAMENTE UMA VEZ durante o startup.
///
/// # Erros
/// Retorna erro se: app_data_dir inacessível, falha I/O, machine UID indisponível,
/// ou se já foi inicializado anteriormente.
pub fn init_security(app: &AppHandle) -> Result<(), String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Não foi possível resolver app_data_dir: {}", e))?;

    fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;

    // Salt persistido
    let salt_path = app_dir.join(SALT_FILE);
    let salt = if salt_path.exists() {
        fs::read(&salt_path).map_err(|e| e.to_string())?
    } else {
        let mut s = vec![0u8; 16];
        rand::rng().fill_bytes(&mut s);
        fs::write(&salt_path, &s).map_err(|e| e.to_string())?;
        s
    };

    // Dados do ambiente
    let machine_uid_result = app
        .machine_uid()
        .get_machine_uid()
        .map_err(|e| e.to_string())?;

    let machine_uid = machine_uid_result.id.ok_or("Machine UID indisponível")?;
    let username = whoami::username().map_err(|e| e.to_string())?;
    let app_id = app.config().identifier.clone();

    // Derivação da chave usando SHA256
    let mut hasher = Sha256::new();
    hasher.update(machine_uid.as_bytes());
    hasher.update(username.as_bytes());
    hasher.update(app_id.as_bytes());
    hasher.update(salt);

    let key: [u8; 32] = hasher.finalize().into();
    MASTER_KEY.set(key).map_err(|_| "Chave já inicializada")?;

    Ok(())
}

fn cipher() -> Aes256Gcm {
    let key = MASTER_KEY
        .get()
        .expect("Security não inicializado. Chame init_security()");
    Aes256Gcm::new_from_slice(key).unwrap()
}

/// Encripta texto usando AES-256-GCM.
///
/// # Formato
/// Retorna `"ciphertext_base64:nonce_base64"`
///
/// # Panics
/// Se `init_security()` não foi chamado.
pub fn encrypt(data: &str) -> String {
    let cipher = cipher();

    let mut nonce_bytes = [0u8; 12];
    rand::rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher.encrypt(nonce, data.as_bytes()).unwrap();

    format!(
        "{}:{}",
        base64::engine::general_purpose::STANDARD.encode(ciphertext),
        base64::engine::general_purpose::STANDARD.encode(nonce_bytes)
    )
}

/// Decripta string encriptada por `encrypt()`.
///
/// # Erros
/// - Formato inválido (não contém `:`)
/// - Base64 inválido
/// - Falha na decriptação (chave incorreta/dados corrompidos)
/// - UTF-8 inválido
pub fn decrypt(data: &str) -> Result<String, String> {
    let cipher = cipher();

    let parts: Vec<&str> = data.split(':').collect();
    if parts.len() != 2 {
        return Err("Formato inválido".into());
    }

    let ciphertext = base64::engine::general_purpose::STANDARD
        .decode(parts[0])
        .map_err(|e| e.to_string())?;

    let nonce_bytes = base64::engine::general_purpose::STANDARD
        .decode(parts[1])
        .map_err(|e| e.to_string())?;

    let nonce = Nonce::from_slice(&nonce_bytes);

    let plain = cipher
        .decrypt(nonce, ciphertext.as_ref())
        .map_err(|e| e.to_string())?;

    String::from_utf8(plain).map_err(|e| e.to_string())
}
