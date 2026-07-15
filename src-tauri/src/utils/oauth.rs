//! Utilitários para fluxo OAuth2 com PKCE.
//!
//! **Módulos:**
//!
//! - Config: Configuração genérica de provedores OAuth2 e funções de troca/renovação de token.
//! - Core: Funcionalidades centrais para geração de desafios PKCE e captura de códigos de autorização.
//! - TokenStore: Armazenamento persistente de tokens OAuth2.
pub mod config;
pub mod core;
pub mod token_store;
