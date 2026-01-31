//! Comandos de Recomendação
//!
//! Este módulo agrupa todos os comandos Tauri relacionados ao sistema de recomendação.
//!
//! **Estrutura:**
//! - `core`: Comandos principais de recomendação (híbrido, CB, CF)
//! - `analysis`: Comandos para análise e debug do sistema

pub mod analysis;
pub mod core;

// Reexportar os comandos principais para uso direto
pub use analysis::generate_recommendation_analysis;
pub use core::{
    get_user_profile, recommend_collaborative_library, recommend_from_library,
    recommend_hybrid_library,
};

// Reexportar os comandos Tauri para o tauri::generate_handler!
pub use analysis::__cmd__generate_recommendation_analysis;
pub use core::{
    __cmd__get_user_profile, __cmd__recommend_collaborative_library, __cmd__recommend_from_library,
    __cmd__recommend_hybrid_library,
};
