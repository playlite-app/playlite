//! Módulo utilitário para fornecer um cliente HTTP configurado.
//!
//! Utiliza `reqwest` para criar um cliente com timeout e headers padrão.

use crate::constants::{HTTP_CONNECT_TIMEOUT_SECS, HTTP_REQUEST_TIMEOUT_SECS, USER_AGENT_DEFAULT};
use reqwest::Client;
use std::time::Duration;

lazy_static::lazy_static! {
    pub static ref HTTP_CLIENT: Client = create_client();
}

fn create_client() -> Client {
    Client::builder()
        .timeout(Duration::from_secs(HTTP_REQUEST_TIMEOUT_SECS))
        .connect_timeout(Duration::from_secs(HTTP_CONNECT_TIMEOUT_SECS))
        .user_agent(USER_AGENT_DEFAULT)
        .build()
        .expect("Failed to create HTTP client")
}
