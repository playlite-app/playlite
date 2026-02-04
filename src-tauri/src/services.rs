//! Serviços para interagir com APIs externas e fornecer funcionalidades ao aplicativo.
//!
//! **Módulos:**
//!
//! - `cache`: Cache de metadados para respostas de APIs externas.
//! - `cf_aggregator`: Agregador de ofertas de jogos de várias fontes.
//! - `images`: Serviço de download e cache de imagens de capas de jogos.
//! - `integration`: Módulos para integração com serviços externos (ITAD, Steam, RAWG, etc.).
//! - `playtime`: Estimador inteligente de duração de jogos.
//! - `recommendation`: Sistema de recomendação de jogos v4.0 (modular e refatorado).
//! - `tags`: Serviço para classificação e gerenciamento de tags de jogos.

pub mod cache;
pub mod cf_aggregator;
pub mod images;
pub mod integration;
pub mod playtime;
pub mod recommendation;
pub mod tags;
