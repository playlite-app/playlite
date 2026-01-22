//! Comandos Tauri expostos ao frontend.
//!
//! Cada função aqui é invocável via `invoke()` no JavaScript/TypeScript.
//! Todos os comandos lidam com erros e os convertem para ‘strings’ amigáveis.
//!
//! **Módulos:**
//! - `achievements`: Comandos para buscar conquistas recentes de jogos via Steam API.
//! - `ai_translation`: Comandos para tradução de descrições usando IA.
//! - `backup`: Comandos relacionados a ‘backup’ e restauração de dados.
//! - `cache_commands`: Comandos para gerenciar o cache de metadados.
//! - `games`: Comandos CRUD para a biblioteca de jogos.
//! - `metadata_enrichment`: Comandos para enriquecer metadados de jogos via RAWG API.
//! - `metadata_search`: Comandos para busca de jogos via RAWG API.
//! - `plataforms`: Comandos para gerenciar plataformas de jogos.
//! - `recommendations`: Comandos para sistema de recomendação de jogos.
//! - `settings`: Comandos para gerenciar configurações e segredos do usuário.
//! - `wishlist`: Comandos para gerenciar a lista de desejos com ‘tracking’ de preços.

pub(crate) mod achievements;
pub(crate) mod ai_translation;
pub mod backup;
pub mod cache;
pub mod cover_enrichment;
pub(crate) mod enrichment_shared;
pub mod games;
pub mod metadata_enrichment;
pub mod metadata_reflesh;
pub mod metadata_search;
pub mod plataforms;
pub mod recommendations;
pub mod settings;
pub mod wishlist;
