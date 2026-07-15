//! Módulo de importação de bibliotecas de plataformas externas (Steam, Epic, GOG).
//!
//! - **Core:** Módulo com funções genéricas para salvar jogos no banco de dados.
//! - **Epic:** Funções específicas para importar jogos da Epic Games.
//! - **GOG:** Funções específicas para importar jogos da GOG com OAuth.
//! - **Heroic:** Funções específicas para importar jogos do Heroic Launcher.
//! - **Legacy:** Funções específicas para importar jogos do Legacy Games Launcher.
//! - **Scanner:** Funções para importa jogos de pastas locais.
//! - **Steam:** Funções para importar jogos da Steam.
//! - **Ubisoft:** Funções para importar jogos da Ubisoft.

pub mod core;
pub mod epic;
pub mod gog;
pub mod heroic;
pub mod legacy;
pub mod scanner;
pub mod steam;
pub mod ubisoft;

// === REEXPORTS ===

// Mantêm o caminho `commands::plataforms::X` estável para quem consome (lib.rs, frontend via invoke, etc.).
pub use epic::import_epic_games;
pub use gog::{gog_is_authenticated, gog_login, gog_logout, import_gog_games};
pub use heroic::import_heroic_games;
pub use legacy::import_legacy_games;
pub use scanner::{add_game_from_scan, add_games_from_scan, scan_games_folder};
pub use steam::import_steam_library;
pub use ubisoft::import_ubisoft_games;
