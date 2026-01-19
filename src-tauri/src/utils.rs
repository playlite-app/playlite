//! Módulos utilitários para diversas funcionalidades auxiliares.
//!
//! **Módulos:**
//! - `game_logic`: Funções utilitárias relacionadas à lógica de status dos jogos.
//! - `http_client`: Cliente HTTP configurado com timeout e headers padrão.
//! - `logger`: Configuração e inicialização do sistema de logging.
//! - `oauth`: Funções auxiliares para autenticação OAuth.
//! - `series`: Funções auxiliares para manipulação de séries de jogos.

pub mod game_logic;
pub mod http_client;
pub mod logger;
pub mod oauth;
pub(crate) mod series;
