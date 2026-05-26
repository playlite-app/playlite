//! This module contains functions for scraping game catalogs from various platforms.
//! Each platform has its own submodule that implements the specific scraping logic for that platform.
//!
//! **Módulos:**
//!
//! - Amazon Luna
//! - Game Pass PC
//! - Ubisoft+

pub mod amazon_luna;
pub mod game_pass;
pub mod ubisoft_plus;

pub use amazon_luna::{fetch_amazon_luna_catalog, LunaGame};
pub use game_pass::{fetch_game_pass_pc_catalog, GamePassGame};
pub use ubisoft_plus::{fetch_ubisoft_plus_catalog, UbisoftGame};
