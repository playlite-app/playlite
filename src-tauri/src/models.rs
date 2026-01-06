//! Tipos de dados principais da aplicação.
//!
//! Define structs para jogos, wishlist, perfil do usuário e sistema de erros.

use serde::{Deserialize, Serialize};

/// Jogo na biblioteca do usuário.
///
/// Representa um jogo adicionado à biblioteca pessoal, com metadados
/// importados do Steam/RAWG e dados de progresso do usuário.
///
/// # Campos
/// * `id` - ID único (Steam App ID ou RAWG ID convertido para string)
/// * `playtime` - Tempo jogado em horas
/// * `favorite` - Se o usuário marcou como favorito (usado para filtragem)
#[derive(Debug, Serialize, Deserialize)]
pub struct Game {
    pub id: String,
    pub name: String,
    pub genre: Option<String>,
    pub platform: Option<String>,
    pub cover_url: Option<String>,
    pub playtime: i32,
    pub rating: Option<i32>,
    pub favorite: bool,
}

/// Jogo na lista de desejos (wishlist) com tracking de preços.
///
/// Armazena jogos que o usuário deseja comprar e monitora preços via Steam Store API.
/// Preços são atualizados sob demanda com `refresh_prices()`.
///
/// # Campos de Preço
/// * `current_price` - Preço atual em USD (pode ser `None` se região não suportada)
/// * `lowest_price` - Menor preço já registrado (histórico)
/// * `localized_price`/`localized_currency` - Preço na moeda local do usuário
/// * `on_sale` - `true` se o jogo está em promoção atualmente
///
/// # Nota
/// `steam_app_id` pode ser `None` para jogos adicionados via RAWG que não
/// têm correspondência no Steam.
#[derive(Debug, Serialize, Deserialize)]
pub struct WishlistGame {
    pub id: String,
    pub name: String,
    pub cover_url: Option<String>,
    pub store_url: Option<String>,
    pub current_price: Option<f64>,
    pub lowest_price: Option<f64>,
    pub on_sale: bool,
    pub localized_price: Option<f64>,
    pub localized_currency: Option<String>,
    pub steam_app_id: Option<i32>,
    pub added_at: Option<String>,
}

/// Erros tipados da aplicação para tratamento granular.
///
/// Usado internamente no Rust. É serializado para JSON quando enviado ao frontend.
/// O atributo `#[serde(tag = "type")]` gera `{"type": "DatabaseError", "message": "..."}`.
///
/// # Conversão Automática
/// Implementa `From<rusqlite::Error>` para conversão automática de erros SQLite.
#[allow(dead_code)]
#[derive(Debug, Serialize)]
#[serde(tag = "type", content = "message")]
pub enum AppError {
    /// Erro em operações SQLite (leitura, escrita, constraints)
    DatabaseError(String),
    /// Dados inválidos fornecidos pelo usuário (ex: API key vazia)
    ValidationError(String),
    /// Falha em chamadas HTTP (Steam/RAWG API timeout, 401, 500, etc.)
    NetworkError(String),
    /// Recurso solicitado não existe (jogo, secret, etc.)
    NotFound(String),
    /// Falha ao adquirir lock em recurso compartilhado (raro)
    MutexError,
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AppError::DatabaseError(msg) => write!(f, "Erro de banco de dados: {}", msg),
            AppError::ValidationError(msg) => write!(f, "Erro de validação: {}", msg),
            AppError::NetworkError(msg) => write!(f, "Erro de rede: {}", msg),
            AppError::NotFound(msg) => write!(f, "Não encontrado: {}", msg),
            AppError::MutexError => {
                write!(f, "Erro interno: falha ao acessar recurso compartilhado")
            }
        }
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(err: rusqlite::Error) -> Self {
        AppError::DatabaseError(err.to_string())
    }
}

/// Pontuação de gênero no perfil do usuário.
///
/// Usado para calcular gênero favorito baseado em tempo jogado e quantidade
/// de jogos. O algoritmo de score considera tanto variedade quanto dedicação.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GenreScore {
    pub name: String,
    /// Score calculado (0.0-100.0) baseado em playtime e quantidade
    pub score: f32,
    /// Número de jogos desse gênero na biblioteca
    pub game_count: i32,
}

/// Perfil agregado do usuário com estatísticas da biblioteca.
///
/// Gerado sob demanda analisando todos os jogos na biblioteca.
/// Usado para exibir dashboard e recomendações personalizadas.
#[derive(Debug, Serialize, Deserialize)]
pub struct UserProfile {
    /// Top 5 gêneros ordenados por score (descendente)
    pub top_genres: Vec<GenreScore>,
    /// Tempo total jogado em todas as bibliotecas (horas)
    pub total_playtime: i32,
    /// Número total de jogos na biblioteca
    pub total_games: i32,
}
