//! Estimador de tempo de jogo baseado em heurísticas.
//!
//! Aplica multiplicadores baseados em Gênero e Tags sobre a mediana do SteamSpy
//! para corrigir a distorção causada por jogadores que abandonam o jogo cedo.

use crate::models::GameTag;

/// Estima o tempo de jogo baseado em horas base, gêneros e tags.
pub fn estimate_playtime(
    base_hours: Option<u32>, // Recebe horas (u32)
    genres: &[String],
    tags: &[GameTag],
) -> Option<i32> {
    let hours = base_hours?; // Se for None, retorna None

    if hours == 0 {
        return None;
    }

    let base = hours as f32;

    // Fatores de multiplicação baseados em gênero
    let mut multiplier = 2.5; // Base default (Adventure/General)

    // Helper para verificar presença de termo (case insensitive)
    let has_term = |term: &str| -> bool {
        genres.iter().any(|g| g.to_lowercase().contains(term))
            || tags.iter().any(|t| t.slug.contains(term))
    };

    // 1. Aplica a heurística de Gênero/Tag
    if has_term("rpg") || has_term("role-playing") {
        multiplier = 3.5;
    } else if has_term("open-world") || has_term("sandbox") {
        multiplier = 3.2;
    } else if has_term("strategy") || has_term("rts") || has_term("grand-strategy") {
        multiplier = 3.0;
    } else if has_term("action") || has_term("shooter") || has_term("fps") {
        multiplier = 2.8;
    } else if has_term("adventure") {
        multiplier = 2.5;
    } else if has_term("indie") && (has_term("narrative") || has_term("story")) {
        multiplier = 2.2;
    } else if has_term("linear") || has_term("short") {
        multiplier = 1.8;
    }

    // 2. Correção para jogos com mediana muito baixa (provável abandono alto)
    if base < 2.0 {
        multiplier += 1.0;
    } else if base < 5.0 {
        multiplier += 0.5;
    }

    let estimated = base * multiplier;

    Some(estimated.round() as i32)
}
