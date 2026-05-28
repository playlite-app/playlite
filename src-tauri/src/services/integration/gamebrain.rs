//! Integracao com GameBrain API.
//!
//! Responsavel por busca semantica de jogos, descoberta e recomendacoes.
//!
//! Atualmente implementa:
//! - Busca por caracteristicas/texto
//! - Filtros (plataforma, genero, modo de jogo, preco, etc.)

mod cache;
mod helpers;
mod media;
mod models;
mod raw;
mod search;
mod similar;

pub use media::fetch_game_media;
pub use models::{
    GameBrainFilter, GameBrainFilterValue, GameBrainSearchParams, GameBrainSearchResult,
    GameBrainSort, GameBrainSortOrder, GameMedia, SimilarGame,
};
pub use search::{search_games_by_features, search_pc_games_by_features};
pub use similar::fetch_similar_games;
