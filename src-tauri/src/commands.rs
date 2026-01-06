//! Comandos Tauri expostos ao frontend.
//!
//! Cada função aqui é invocável via `invoke()` no JavaScript/TypeScript.
//! Todos os comandos lidam com erros e os convertem para strings amigáveis.
//!
//! # Módulos
//! - `backup`: Comandos relacionados a backup e restauração de dados.
//! - `games`: Comandos CRUD para a biblioteca de jogos.
//! - `integrations`: Comandos para integração com APIs externas (Steam, RAWG).
//! - `recommendations`: Comandos para sistema de recomendação de jogos.
//! - `settings`: Comandos para gerenciar configurações e segredos do usuário.
//! - `wishlist`: Comandos para gerenciar a lista de desejos com tracking de preços.

pub mod backup;
pub mod games;
pub mod integrations;
pub mod recommendations;
pub mod settings;
pub mod wishlist;
