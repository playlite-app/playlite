//! Módulos utilitários para diversas funcionalidades auxiliares.
//!
//! **Módulos:**
//! - `http_client`: Cliente HTTP configurado com timeout e headers padrão.
//! - `logger`: Configuração e inicialização do sistema de logging.
//! - `oauth`: Funções auxiliares para autenticação OAuth.
//! - `series`: Funções auxiliares para manipulação de séries de jogos.
//! - `status_logic`: Funções utilitárias relacionadas à lógica de status dos jogos.
//! - `tag_utils`: Funções auxiliares para manipulação e categorização de tags.

pub mod http_client;
pub mod logger;
pub mod oauth;
pub(crate) mod series;
pub mod status_logic;
pub(crate) mod tag_utils;
