//! Scraper - EA Play
//!
//! Reutiliza o catálogo do Game Pass PC (mesma API da Microsoft),
//! filtrando apenas os jogos com IsEAPlay = true.

use crate::scrapers::game_pass::{fetch_game_pass_pc_catalog, GamePassGame};

pub async fn fetch_ea_play_catalog() -> Result<Vec<GamePassGame>, String> {
    // include_ea_play = false no parâmetro original significa "excluir EA Play"
    // Este modulo faz o oposto: busca TUDO e filtra só EA Play
    let all_games = fetch_game_pass_pc_catalog(false).await?;

    Ok(all_games.into_iter().filter(|g| g.is_ea_play).collect())
}
