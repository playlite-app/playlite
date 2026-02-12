use crate::errors::AppError;
use async_trait::async_trait;

#[derive(Debug, Clone)]
pub struct SourceGame {
    pub platform: String,
    pub platform_game_id: String,
    pub name: Option<String>,
    pub installed: bool,
    pub executable_path: Option<String>,
    pub install_path: Option<String>,
    pub playtime_minutes: Option<u32>,
    pub last_played: Option<i64>, // Unix timestamp
}

#[async_trait]
pub trait GameSource {
    async fn fetch_games(&self) -> Result<Vec<SourceGame>, AppError>;
}
