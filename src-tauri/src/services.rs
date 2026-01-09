//! Serviços para interagir com APIs externas e fornecer funcionalidades ao aplicativo.
//!
//! **Módulos:**
//! - `rawg`: Integração com a API RAWG para busca de jogos e tendências.
//! - `steam`: Integração com a API Steam para importar jogos e obter detalhes.
//! - `recommendation`: Sistema de recomendação de jogos baseado em preferências do usuário.

pub mod rawg;
pub mod recommendation;
pub mod steam;
