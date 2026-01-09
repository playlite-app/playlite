// Constantes da aplicação para facilitar manutenção

// URLs e endpoints
pub const STEAM_CDN_URL: &str = "https://cdn.cloudflare.steamstatic.com";
#[allow(dead_code)]
pub const STEAM_STORE_API_URL: &str = "https://store.steampowered.com/api/appdetails";
#[allow(dead_code)]
pub const STEAM_PLAYER_API_URL: &str =
    "http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001";
#[allow(dead_code)]
pub const RAWG_API_URL: &str = "https://api.rawg.io/api/games";

// Valores padrão
pub const DEFAULT_GENRE: &str = "Desconhecido";
#[allow(dead_code)]
pub const DEFAULT_PLATFORM_MANUAL: &str = "Manual";
pub const DEFAULT_PLATFORM_STEAM: &str = "Steam";

// Limites de validação
pub const MAX_NAME_LENGTH: usize = 200;
pub const MAX_GENRE_LENGTH: usize = 100;
pub const MAX_PLATFORM_LENGTH: usize = 100;
pub const MAX_URL_LENGTH: usize = 500;
pub const MAX_PLAYTIME: i32 = 1_000_000;
pub const MIN_RATING: i32 = 1;
pub const MAX_RATING: i32 = 5;

// Rate limiting
pub const STEAM_RATE_LIMIT_MS: u64 = 500;
// Rate limiting para RAWG (1 requisição por segundo)
pub const RAWG_RATE_LIMIT_MS: u64 = 1000;
// Limite de requisições para RAWG
pub const RAWG_REQUISITIONS_PER_BATCH: u32 = 20;
// Tamanho da página para requisições RAWG
#[allow(dead_code)]
pub const RAWG_PAGE_SIZE: u32 = 15;

// Configuração de banco de dados
#[allow(dead_code)]
pub const DB_FILENAME_LIBRARY: &str = "library.db";
pub const DB_FILENAME_SECRETS: &str = "secrets.db";
#[allow(dead_code)]
pub const DB_JOURNAL_MODE: &str = "WAL";
