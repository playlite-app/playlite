//! Módulo de comandos relacionados a metadados de jogos
//!
//! Agrupa funcionalidades de enriquecimento, atualização e busca
//! de metadados de APIs externas (RAWG, Steam)
//!
//! Módulos:
//! - `covers`: Comandos para baixar capas de jogos
//! - `enrichment`: Comandos para buscar e atualizar metadados de jogos
//! - `refresh`: Comandos para atualizar preços e reviwews de jogos
//! - `search`: Comandos para buscar metadados externos
//! - `shared`: Funções e estruturas compartilhadas entre os módulos de metadados

pub mod covers;
pub mod enrichment;
pub mod refresh;
pub mod search;
mod shared;
