//! Módulo utilitário para fornecer um cliente HTTP configurado.
//!
//! Utiliza `reqwest` para criar um cliente com timeout e headers padrão.
//!
//! # Exemplo no Frontend
//! ```js
//! import { invoke } from '@tauri-apps/api/tauri';
//! invoke('some_command_that_uses_http_client')
//! ```
//!
//! # Uso//!
//! - O cliente HTTP pode ser acessado via `HTTP_CLIENT`.
//! - Use em outros módulos para fazer requisições HTTP.
//!
//! ```rust
//! let response = HTTP_CLIENT.get("https://api.example.com/data")
//!     .send()
//!     .await?;
//! ```
//!
//! # Erros
//! - Se a criação do cliente falhar, o programa irá panic com uma mensagem de erro

use reqwest::Client;
use std::time::Duration;

lazy_static::lazy_static! {
    pub static ref HTTP_CLIENT: Client = create_client();
}

fn create_client() -> Client {
    Client::builder()
        .timeout(Duration::from_secs(30))
        .connect_timeout(Duration::from_secs(10))
        .user_agent("GameManager/0.1.0")
        .build()
        .expect("Failed to create HTTP client")
}
