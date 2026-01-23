// === ARQUIVO CENTRALIZADO COM CONSTANTES DO BACKEND ===

// === URLs e ENDPOOINTS ===
pub const STEAM_CDN_URL: &str = "https://cdn.cloudflare.steamstatic.com";
#[allow(dead_code)]
pub const STEAM_STORE_API_URL: &str = "https://store.steampowered.com/api/appdetails";
#[allow(dead_code)]
pub const STEAM_PLAYER_API_URL: &str =
    "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001";
pub(crate) const REVIEW_API_URL: &str = "https://store.steampowered.com/appreviews";
pub(crate) const STEAMSPY_API_URL: &str = "https://steamspy.com/api.php";
pub const ITAD_API_URL: &str = "https://api.isthereanydeal.com";
#[allow(dead_code)]
pub(crate) const GEMINI_API_URL: &str =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// === VALOORES PADRÕES E LIMITES ===
#[allow(dead_code)]
pub const DEFAULT_PLATFORM_MANUAL: &str = "Manual";
pub const MAX_NAME_LENGTH: usize = 200;
pub const MAX_PLATFORM_LENGTH: usize = 100;
pub const MAX_URL_LENGTH: usize = 500;
pub const MAX_PLAYTIME: i32 = 1_000_000;
pub const MIN_RATING: i32 = 1;
pub const MAX_RATING: i32 = 5;

// === LIMITES DE REQUISIÇÕES A SERVIÇOS EXTERNOS ===
pub const RAWG_RATE_LIMIT_MS: u64 = 1000;
pub const RAWG_REQUISITIONS_PER_BATCH: u32 = 20;
#[allow(dead_code)]
pub const RAWG_PAGE_SIZE: u32 = 15;

// === NOMES DE ARQUIVOS E CONFIGURAÇÕES DE BANCO DE DADOS ===
#[allow(dead_code)]
pub const DB_FILENAME_LIBRARY: &str = "library.db";
pub const DB_FILENAME_SECRETS: &str = "secrets.db";
pub const DB_FILENAME_METADATA: &str = "metadata.db";
#[allow(dead_code)]
pub const DB_JOURNAL_MODE: &str = "WAL";
