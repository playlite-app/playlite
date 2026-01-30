//! Comandos Tauri expostos ao frontend.
//!
//! Cada função aqui é invocável via `invoke()` no JavaScript/TypeScript.
//! Todos os comandos lidam com erros e os convertem para 'strings' amigáveis.
//!
//! **Módulos:**
//! - `achievements`: Comandos para buscar conquistas recentes de jogos via Steam API.
//! - `ai_translation`: Comandos para tradução de descrições usando IA.
//! - `caches`: Comandos para gerenciar o cache de metadados.
//! - `games`: Comandos CRUD para a biblioteca de jogos.
//! - `metadata`: Comandos para enriquecimento, atualização e busca de metadados via RAWG/Steam API.
//! - `plataforms`: Comandos para gerenciar plataformas de jogos.
//! - `recommendations`: Comandos para sistema de recomendação de jogos.
//! - `settings`: Comandos para gerenciar configurações e segredos do usuário.
//! - `version`: Comandos para gerenciar informações de versão da aplicação.
//! - `wishlist`: Comandos para gerenciar a lista de desejos com 'tracking' de preços.

pub(crate) mod achievements;
pub(crate) mod ai_translation;
pub mod caches;
pub mod games;
pub mod metadata;
pub mod plataforms;
pub mod recommendations;
pub mod settings;
pub mod version;
pub mod wishlist;
