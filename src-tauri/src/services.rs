//! Serviços para interagir com APIs externas e fornecer funcionalidades ao aplicativo.
//!
//! **Módulos:**
//! - `gemini`: Integração com a API Gemini para funcionalidades de IA.
//! - `itad`: Integração com a API IsThereAnyDeal para 'tracking' de preços e ofertas.
//! - `metadata_cache`: Cache de metadados para respostas de APIs externas.
//! - `playtime_estimator`: Estimador inteligente de duração de jogos.
//! - `rawg`: Integração com a API RAWG para busca de jogos e tendências.
//! - `recommendation`: Sistema de recomendação de jogos baseado em preferências do usuário.
//! - `steam`: Integração com a API Steam para importar jogos e obter detalhes.
//! - `tag_service`: Serviço para classificação e gerenciamento de tags de jogos.

pub(crate) mod gemini;
pub mod itad;
pub(crate) mod metadata_cache;
pub(crate) mod playtime_estimator;
pub mod rawg;
pub mod recommendation;
pub mod steam;
pub(crate) mod tag_service;
