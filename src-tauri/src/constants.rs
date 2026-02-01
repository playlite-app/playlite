// === ARQUIVO CENTRALIZADO COM CONSTANTES DO BACKEND ===

// === URLs e ENDPOINTS ===
pub const STEAM_CDN_URL: &str = "https://cdn.cloudflare.steamstatic.com";
pub const STEAM_STORE_API_URL: &str = "https://store.steampowered.com/api/appdetails";
pub(crate) const REVIEW_API_URL: &str = "https://store.steampowered.com/appreviews";
pub(crate) const STEAMSPY_API_URL: &str = "https://steamspy.com/api.php";
pub const ITAD_API_URL: &str = "https://api.isthereanydeal.com";
pub(crate) const GEMINI_API_URL: &str =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// === VALORES PADRÕES E LIMITES ===
pub const MAX_NAME_LENGTH: usize = 200;
pub const MAX_PLATFORM_LENGTH: usize = 100;
pub const MAX_URL_LENGTH: usize = 500;
pub const MAX_PLAYTIME: i32 = 1_000_000;
pub const MIN_RATING: i32 = 1;
pub const MAX_RATING: i32 = 5;

// === LIMITES DE REQUISIÇÕES A SERVIÇOS EXTERNOS ===
pub const RAWG_RATE_LIMIT_MS: u64 = 1000;
pub const RAWG_REQUISITIONS_PER_BATCH: u32 = 20;
pub const RAWG_SEARCH_PAGE_SIZE: u32 = 10;
pub const RAWG_TRENDING_PAGE_SIZE: u32 = 20;
pub const RAWG_UPCOMING_PAGE_SIZE: u32 = 10;

// === TIMEOUTS DE REQUISIÇÕES HTTP (em segundos) ===
pub const HTTP_REQUEST_TIMEOUT_SECS: u64 = 30;
pub const HTTP_CONNECT_TIMEOUT_SECS: u64 = 10;
pub const STEAM_STORE_TIMEOUT_SECS: u64 = 10;
pub const STEAM_REVIEWS_TIMEOUT_SECS: u64 = 5;

// === USER AGENTS ===
pub const USER_AGENT_DEFAULT: &str = "GameManager/0.1.0";
pub const USER_AGENT_STEAM: &str = "Valve/Steam HTTP Client 1.0";

// === TIMEOUTS DE AUTENTICAÇÃO OAuth (em segundos) ===
pub const OAUTH_CALLBACK_TIMEOUT_SECS: u64 = 120;

// === DELAYS DE INICIALIZAÇÃO E BACKGROUND TASKS (em segundos) ===
pub const STARTUP_DELAY_SECS: u64 = 5;
pub const BACKGROUND_TASK_INTERVAL_SECS: u64 = 2;

// === TTL DE CACHE (Time To Live em dias) ===
pub const CACHE_RAWG_GAME_TTL_DAYS: i64 = 30;
pub const CACHE_RAWG_LIST_TTL_DAYS: i64 = 1; // Trending/Upcoming/Giveaways
pub const CACHE_STEAM_STORE_TTL_DAYS: i64 = 30;
pub const CACHE_STEAM_REVIEWS_TTL_DAYS: i64 = 7;
pub const CACHE_STEAM_PLAYTIME_TTL_DAYS: i64 = 15;

// === NOMES DE ARQUIVOS E CONFIGURAÇÕES DE BANCO DE DADOS ===
pub const DB_FILENAME_LIBRARY: &str = "library.db";
pub const DB_FILENAME_SECRETS: &str = "secrets.db";
pub const DB_FILENAME_METADATA: &str = "metadata.db";
pub const DB_JOURNAL_MODE: &str = "WAL";
