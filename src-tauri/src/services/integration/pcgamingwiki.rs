//! Módulo com funções referentes a integraão com PCGamingWiki
//!
//! **Módulos:**
//!
//! - `client` - Conexão com a API do PCGamingWiki para busca de informações sobre jogos.
//! - `db` - Gerenciamento dos dados do PCGamingWiki usando SQLite.
//! - `fetch` - Busca e tratamento de dados do PCGamingWiki, incluindo formatação.
//! - `parsers` - Auxilia com parsing e dados relacionados ao PCGamingWiki, como plataformas, requisitos, etc.

pub use self::client::{search_pcgw_by_name, PcgwSearchResult};
pub use self::db::{get_pcgw_data, invalidate_pcgw_data, save_pcgw_data};
pub use self::fetch::fetch_pcgw_data;

pub mod client;
mod db;
mod fetch;
mod parsers;
