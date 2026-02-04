//! Módulos para integração com serviços externos.
//!
//! Fornece funcionalidades para interagir com APIs e serviços de terceiros.
//! Cada módulo encapsula a lógica necessária para comunicação com um serviço específico,
//! facilitando a manutenção e expansão do código.
//!
//! **Módulos:**
//!
//! - `gamerpower`: Integração com a API GamerPower para busca de jogos grátis.
//! - `gemini`: Integração com a API Gemini para funcionalidade de tradução com IA.
//! - `itad`: Integração com a API IsThereAnyDeal para 'tracking' de preços e ofertas.
//! - `rawg`: Integração com a API RAWG para busca de jogos e tendências.
//! - `steam`: Integração com a API Steam para obter detalhes e conquistas dos jogos.
//! - `steamspy`: Integração com a API SteamSpy para estatísticas de jogos (median playtime).

pub mod gamerpower;
pub mod gemini;
pub mod itad;
pub mod rawg;
pub mod steam_api;
pub mod steamspy;
