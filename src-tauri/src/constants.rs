// === ARQUIVO CENTRALIZADO COM CONSTANTES DO BACKEND ===

// === URLs e ENDPOINTS ===
pub const STEAM_CDN_URL: &str = "https://cdn.cloudflare.steamstatic.com";
pub const STEAM_CDN_AKAMAI_URL: &str = "https://cdn.akamai.steamstatic.com";
pub const STEAM_STORE_URL: &str = "https://store.steampowered.com";
pub const STEAM_STORE_API_URL: &str = "https://store.steampowered.com/api/appdetails";
pub(crate) const REVIEW_API_URL: &str = "https://store.steampowered.com/appreviews";
pub(crate) const STEAMSPY_API_URL: &str = "https://steamspy.com/api.php";
pub const ITAD_API_URL: &str = "https://api.isthereanydeal.com";
pub(crate) const GEMINI_API_URL: &str =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// === CAMINHOS DE IMAGENS DA STEAM ===
pub const STEAM_HEADER_IMAGE_PATH: &str = "steam/apps/{}/header.jpg";
pub const STEAM_LIBRARY_IMAGE_PATH: &str = "steam/apps/{}/library_600x900.jpg";

// === FORMATOS E EXTENSÕES ===
pub const COVER_IMAGE_FORMAT: &str = "jpg";
pub const COVER_IMAGE_EXTENSION: &str = ".jpg";

// === DIRETÓRIOS ===
pub const COVERS_DIR_NAME: &str = "covers";
pub const EPIC_MANIFEST_PATH_WINDOWS: &str =
    r"C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests";

// === DATA FILES ===
pub const TAG_METADATA_JSON_PATH: &str = "../data/tag_metadata.json";
pub const KNOWN_SERIES_JSON_PATH: &str = "../data/known_series.json";
pub const COLLABORATIVE_INDEX_JSON_PATH: &str = "../../data/collaborative_index.json";

// === VALORES PADRÕES E LIMITES ===
pub const MAX_NAME_LENGTH: usize = 200;
pub const MAX_URL_LENGTH: usize = 500;
pub const MAX_PLAYTIME: i32 = 1_000_000;
pub const MIN_RATING: i32 = 1;
pub const MAX_RATING: i32 = 5;

// === LIMITES DO SCANNER DE JOGOS LOCAIS ===
pub const SCANNER_MAX_DEPTH: usize = 4;
pub const SCANNER_MAX_FILES_PER_DIR: usize = 1000;
pub const SCANNER_MAX_TOTAL_FILES: usize = 10000;
pub const SCANNER_MIN_FILE_SIZE_MB: u64 = 5;

// === CONVERSÕES ===
pub const BYTES_PER_MB: u64 = 1024 * 1024;
pub const MINUTES_PER_HOUR: i32 = 60;
pub const SECONDS_PER_MINUTE: i64 = 60;
pub const MINUTES_PER_HOUR_F32: f32 = 60.0;
pub const SECONDS_PER_HOUR: i64 = 3600;
pub const SECONDS_PER_DAY: i64 = 86400;

// === PESOS DO SISTEMA DE RECOMENDAÇÃO ===
pub const RECOMMENDATION_MAX_TAG_CONTRIBUTION: f32 = 300.0;
pub const RECOMMENDATION_WEIGHT_GENRE: f32 = 3.0;
pub const RECOMMENDATION_WEIGHT_PLAYTIME_HOUR: f32 = 1.2;
pub const RECOMMENDATION_WEIGHT_FAVORITE: f32 = 30.0;
pub const RECOMMENDATION_WEIGHT_USER_RATING: f32 = 8.0;
pub const RECOMMENDATION_WEIGHT_SERIES: f32 = 1.0;
pub const RECOMMENDATION_MAX_PLAYTIME_HOURS: i32 = 100;

// === CONFIGURAÇÕES PADRÃO DE RECOMENDAÇÃO ===
pub const RECOMMENDATION_DEFAULT_CONTENT_WEIGHT: f32 = 0.65;
pub const RECOMMENDATION_DEFAULT_COLLABORATIVE_WEIGHT: f32 = 0.35;
pub const RECOMMENDATION_DEFAULT_AGE_DECAY: f32 = 0.98;

// === MOEDAS ===
pub const DEFAULT_CURRENCY: &str = "BRL";

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
pub const CACHE_DEFAULT_TTL_DAYS: i64 = 7;

// === NOMES DE ARQUIVOS E CONFIGURAÇÕES DE BANCO DE DADOS ===
pub const DB_FILENAME_LIBRARY: &str = "library.db";
pub const DB_FILENAME_SECRETS: &str = "secrets.db";
pub const DB_FILENAME_METADATA: &str = "metadata.db";
pub const DB_JOURNAL_MODE: &str = "WAL";
pub const DB_SCHEMA_VERSION: u32 = 3;
