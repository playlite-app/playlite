//! Serviços para interagir com APIs externas e fornecer funcionalidades ao aplicativo.
//!
//! **Módulos:**
//!
//! - `cache`: Cache de metadados para respostas de APIs externas.
//! - `cf_aggregator`: Agregador de ofertas de jogos de várias fontes.
//! - `gamerpower`: Integração com a API GamerPower para busca de jogos grátis.
//! - `gemini`: Integração com a API Gemini para funcionalidades de IA.
//! - `images`: Serviço de download e cache de imagens de capas de jogos.
//! - `itad`: Integração com a API IsThereAnyDeal para 'tracking' de preços e ofertas.
//! - `playtime`: Estimador inteligente de duração de jogos.
//! - `rawg`: Integração com a API RAWG para busca de jogos e tendências.
//! - `recommendation`: Sistema de recomendação de jogos v4.0 (modular e refatorado).
//! - `steam`: Integração com a API Steam para importar jogos e obter detalhes.
//! - `tags`: Serviço para classificação e gerenciamento de tags de jogos.

pub mod cache;
pub mod cf_aggregator;
pub mod gamerpower;
pub mod gemini;
pub mod images;
pub mod itad;
pub mod playtime;
pub mod rawg;
pub mod recommendation;
pub mod steam;
pub mod tags;
