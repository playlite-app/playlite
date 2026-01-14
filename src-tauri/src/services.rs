//! Serviços para interagir com APIs externas e fornecer funcionalidades ao aplicativo.
//!
//! **Módulos:**
//! - `itad`: Integração com a API IsThereAnyDeal para 'tracking' de preços e ofertas.
//! - `rawg`: Integração com a API RAWG para busca de jogos e tendências.
//! - `recommendation`: Sistema de recomendação de jogos baseado em preferências do usuário.
//! - `steam`: Integração com a API Steam para importar jogos e obter detalhes.
//! - `metadata_unified`: Serviço unificado de busca de metadados com múltiplas fontes.

pub mod itad;
pub mod metadata_unified;
pub mod rawg;
pub mod recommendation;
pub mod steam;
mod steam_test;
