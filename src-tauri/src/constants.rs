// Constantes da aplicação para facilitar manutenção

// URLs e endpoints
pub const STEAM_CDN_URL: &str = "https://cdn.cloudflare.steamstatic.com";
#[allow(dead_code)]
pub const STEAM_STORE_API_URL: &str = "https://store.steampowered.com/api/appdetails";
#[allow(dead_code)]
pub const STEAM_PLAYER_API_URL: &str =
    "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001";
#[allow(dead_code)]
pub const RAWG_API_URL: &str = "https://api.rawg.io/api/games";

// Valores padrão
#[allow(dead_code)]
pub const DEFAULT_PLATFORM_MANUAL: &str = "Manual";

// Limites de validação
pub const MAX_NAME_LENGTH: usize = 200;
pub const MAX_PLATFORM_LENGTH: usize = 100;
pub const MAX_URL_LENGTH: usize = 500;
pub const MAX_PLAYTIME: i32 = 1_000_000;
pub const MIN_RATING: i32 = 1;
pub const MAX_RATING: i32 = 5;

// Rate limiting
pub const RAWG_RATE_LIMIT_MS: u64 = 1000;
pub const RAWG_REQUISITIONS_PER_BATCH: u32 = 20;
#[allow(dead_code)]
pub const RAWG_PAGE_SIZE: u32 = 15;

// Configuração de banco de dados
#[allow(dead_code)]
pub const DB_FILENAME_LIBRARY: &str = "library.db";
pub const DB_FILENAME_SECRETS: &str = "secrets.db";
#[allow(dead_code)]
pub const DB_JOURNAL_MODE: &str = "WAL";
