//! Sistema de Recomendação v2.0 - Content-Based Filtering Avançado
//!
//! Features:
//! - Usa dados de game_details (genres, tags, series)
//! - Penaliza jogos antigos (decaimento temporal)
//! - Sistema de pesos balanceado
//! - Sem compatibilidade com sistema v1 (código limpo)

use crate::models::Game;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// === CONFIGURAÇÃO DE PESOS DO ALGORITMO ===

/// Peso base por hora jogada (limitado a 100h para evitar outliers)
const WEIGHT_PLAYTIME_HOUR: f32 = 1.5;

/// Bônus para jogos marcados como favoritos
const WEIGHT_FAVORITE: f32 = 40.0;

/// Peso por estrela de avaliação do usuário (1-5 estrelas)
const WEIGHT_USER_RATING: f32 = 8.0;

/// Multiplicador para gêneros (peso padrão)
const WEIGHT_GENRE: f32 = 1.0;

/// Multiplicador para tags (peso menor que gênero)
const WEIGHT_TAG: f32 = 0.5;

/// Multiplicador para séries (peso moderado - evita viés excessivo)
const WEIGHT_SERIES: f32 = 1.2;

/// Decaimento por ano (0.95 = 5% de redução por ano de idade)
/// Jogos de 10 anos atrás terão score multiplicado por ~0.60
const AGE_DECAY_FACTOR: f32 = 0.95;

/// Idade máxima considerada para decaimento (anos)
/// Jogos mais velhos que isso não sofrem decaimento adicional
const MAX_AGE_PENALTY: i32 = 15;

// === ESTRUTURAS DE DADOS ===

/// Detalhes completos de um jogo (união de Game + GameDetails)
#[derive(Debug, Clone)]
pub struct GameWithDetails {
    pub game: Game,
    pub genres: Vec<String>,
    pub tags: Vec<String>,
    pub series: Option<String>,
    pub release_year: Option<i32>,
}

/// Vetor de preferências do usuário com múltiplas dimensões
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserPreferenceVector {
    /// Scores acumulados por gênero
    pub genres: HashMap<String, f32>,

    /// Scores acumulados por tag
    pub tags: HashMap<String, f32>,

    /// Scores acumulados por série de jogos
    pub series: HashMap<String, f32>,

    /// Metadados estatísticos
    #[serde(rename = "totalPlaytime")]
    pub total_playtime: i32,

    #[serde(rename = "totalGames")]
    pub total_games: i32,
}

// ===  FUNÇÃO PRINCIPAL - CÁLCULO DE PERFIL ===

/// Calcula o perfil completo do usuário baseado na sua biblioteca
///
/// IMPORTANTE: Espera que GameWithDetails já tenha sido montado pela
/// camada de comandos Tauri, fazendo JOIN com game_details
///
/// Usa `games` slice para agregar scores por dimensão (gêneros, tags, séries)
/// e retorna um `UserPreferenceVector` com os scores normalizados.
pub fn calculate_user_profile(games: &[GameWithDetails]) -> UserPreferenceVector {
    let mut profile = UserPreferenceVector {
        genres: HashMap::new(),
        tags: HashMap::new(),
        series: HashMap::new(),
        total_playtime: 0,
        total_games: games.len() as i32,
    };

    for game_with_details in games {
        // Calcula o peso base do jogo
        let weight = calculate_game_weight(&game_with_details.game);

        profile.total_playtime += game_with_details.game.playtime.unwrap_or(0);

        // Processamento de gêneros
        for genre in &game_with_details.genres {
            if genre.is_empty() || genre == "Desconhecido" {
                continue;
            }
            *profile.genres.entry(genre.clone()).or_insert(0.0) += weight * WEIGHT_GENRE;
        }

        // Processamento de tags
        for tag in &game_with_details.tags {
            if tag.is_empty() {
                continue;
            }
            *profile.tags.entry(tag.clone()).or_insert(0.0) += weight * WEIGHT_TAG;
        }

        // Processamento de séries - Prioriza series do banco, fallback para detecção
        if let Some(series) = get_series_name(game_with_details) {
            *profile.series.entry(series).or_insert(0.0) += weight * WEIGHT_SERIES;
        }
    }

    profile
}

/// Calcula o peso/importância de um jogo individual
///
/// Combina múltiplos fatores:
/// - Tempo jogado (até 100h)
/// - Status de favorito
/// - Avaliação do usuário (1-5 estrelas)
///
/// # Retorna
/// Score base do jogo (tipicamente 1.0 a 250.0)
fn calculate_game_weight(game: &Game) -> f32 {
    let mut weight = 1.0;

    // Fator tempo de jogo (limitado a 100h)
    if let Some(playtime) = game.playtime {
        let hours = (playtime as f32 / 60.0).min(100.0);
        weight += hours * WEIGHT_PLAYTIME_HOUR;
    }

    // Bônus de favorito
    if game.favorite {
        weight += WEIGHT_FAVORITE;
    }

    // Fator avaliação do usuário
    if let Some(rating) = game.user_rating {
        weight += (rating as f32) * WEIGHT_USER_RATING;
    }

    weight
}

// === DETECÇÃO INTELIGENTE DE SÉRIES (Fallback) ===

/// Obtém o nome da série para um jogo, priorizando dados do banco, fallback para detecção
fn get_series_name(game: &GameWithDetails) -> Option<String> {
    if let Some(ref series) = game.series {
        if !series.is_empty() {
            Some(series.clone())
        } else {
            detect_game_series(&game.game.name)
        }
    } else {
        detect_game_series(&game.game.name)
    }
}

/// Detecta automaticamente se um jogo pertence a uma série conhecida
///
/// Usado apenas como FALLBACK quando game_details.series está vazio
fn detect_game_series(game_name: &str) -> Option<String> {
    // Lista expandida de séries conhecidas
    let known_series = [
        "The Witcher",
        "Dark Souls",
        "Elden Ring",
        "Elder Scrolls",
        "Fallout",
        "Mass Effect",
        "Dragon Age",
        "Assassin's Creed",
        "Far Cry",
        "Grand Theft Auto",
        "GTA",
        "Red Dead",
        "Borderlands",
        "BioShock",
        "Metro",
        "S.T.A.L.K.E.R.",
        "Deus Ex",
        "Dishonored",
        "Doom",
        "Wolfenstein",
        "Tomb Raider",
        "Hitman",
        "Final Fantasy",
        "Resident Evil",
        "Silent Hill",
        "Dead Space",
        "Halo",
        "Gears of War",
        "Uncharted",
        "The Last of Us",
        "God of War",
        "Horizon",
        "Persona",
        "Kingdom Hearts",
        "Metal Gear",
        "Souls",
        "Crysis",
        "Call of Duty",
        "Battlefield",
        "Portal",
        "Half-Life",
        "Left 4 Dead",
        "Dying Light",
        "Watch Dogs",
        "Just Cause",
        "Saints Row",
        "Batman Arkham",
        "Middle-earth",
        "Monster Hunter",
    ];

    let name_lower = game_name.to_lowercase();

    for series in &known_series {
        if name_lower.contains(&series.to_lowercase()) {
            return Some(series.to_string());
        }
    }

    // Tenta detectar padrão "Nome X"
    extract_base_name(game_name)
}

/// Extrai o nome base de um jogo removendo números e subtítulos
fn extract_base_name(game_name: &str) -> Option<String> {
    let patterns = [
        " II", " III", " IV", " V", " VI", " VII", " VIII", " 2", " 3", " 4", " 5", " 6", " 7",
        " 8", ":", " -", " –", " —",
    ];

    for pattern in &patterns {
        if let Some(pos) = game_name.find(pattern) {
            let base = game_name[..pos].trim();
            if base.len() > 3 {
                return Some(base.to_string());
            }
        }
    }

    None
}

// === SISTEMA DE SCORING COM PENALIZAÇÃO POR IDADE ===

/// Calcula o score de afinidade entre o perfil do usuário e um jogo candidato
///
/// Considera:
/// - Gêneros em comum
/// - Tags em comum
/// - Pertencer à mesma série
/// - **Penaliza jogos antigos** (decaimento temporal)
pub fn score_game(profile: &UserPreferenceVector, game: &GameWithDetails) -> f32 {
    let mut score = 0.0;

    // Score de gêneros
    for genre in &game.genres {
        if let Some(&genre_score) = profile.genres.get(genre) {
            score += genre_score;
        }
    }

    // Score de tags
    for tag in &game.tags {
        if let Some(&tag_score) = profile.tags.get(tag) {
            score += tag_score;
        }
    }

    // Bônus de série (prioriza series do banco, fallback para detecção)
    if let Some(series) = get_series_name(game) {
        if let Some(&series_score) = profile.series.get(&series) {
            score += series_score * 1.5; // Peso extra para séries
        }
    }

    // Jogos mais antigos recebem score reduzido
    if let Some(release_year) = game.release_year {
        let current_year = 2025; // Você pode obter dinamicamente se preferir
        let age = (current_year - release_year).max(0).min(MAX_AGE_PENALTY);

        if age > 0 {
            // Aplica decaimento exponencial: score * (0.95^age)
            let age_multiplier = AGE_DECAY_FACTOR.powi(age);
            score *= age_multiplier;
        }
    }

    score
}

/// Ranqueia uma lista de jogos candidatos baseado no perfil do usuário
pub fn rank_games(
    profile: &UserPreferenceVector,
    candidates: &[GameWithDetails],
) -> Vec<(GameWithDetails, f32)> {
    let mut ranked: Vec<_> = candidates
        .iter()
        .map(|g| (g.clone(), score_game(profile, g)))
        .collect();

    // Ordena por score decrescente
    ranked.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

    ranked
}

// === UTILITÁRIOS ===

/// Parse de ano a partir de data ISO 8601 (YYYY-MM-DD)
pub fn parse_release_year(date_str: &str) -> Option<i32> {
    date_str.split('-').next()?.parse().ok()
}
