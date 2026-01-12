//! Serviços para interagir com APIs externas e fornecer funcionalidades ao aplicativo.
//!
//! **Módulos:**
//! - `hltb`: Integração com a API HowLongToBeat para obter tempos estimados de jogo.
//! - `itad`: Integração com a API IsThereAnyDeal para ‘tracking’ de preços e ofertas.
//! - `rawg`: Integração com a API RAWG para busca de jogos e tendências.
//! - `recommendation`: Sistema de recomendação de jogos baseado em preferências do usuário.
//! - `steam`: Integração com a API Steam para importar jogos e obter detalhes.

pub mod hltb;
pub mod itad;
pub mod rawg;
pub mod recommendation;
pub mod steam;
