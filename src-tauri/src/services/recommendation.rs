//! Módulo de sistema de recomendação personalizado.
//!
//! Implementa algoritmo de análise de perfil baseado em múltiplos fatores:
//! tempo de jogo, avaliações, favoritos e gêneros preferidos.
//!
//! O sistema calcula scores ponderados para cada gênero e gera um perfil
//! do usuário que pode ser usado para ranquear e recomendar novos jogos.

use crate::models::{Game, GenreScore, UserProfile};
use std::collections::HashMap;

// === Configuração de Pesos do Algoritmo ===

/// Pontos atribuídos por hora jogada.
///
/// Cada hora de jogo adiciona 2 pontos ao score do jogo, limitado a 100 horas para evitar outliers.
const WEIGHT_PLAYTIME_HOUR: f32 = 2.0;

/// Pontos de bônus para jogos marcados como favorito.
///
/// Jogos favoritos recebem 50 pontos adicionais, indicando preferência do usuário.
const WEIGHT_FAVORITE: f32 = 50.0;

/// Pontos atribuídos por estrela de avaliação.
///
/// Sistema de 5 estrelas onde cada estrela vale 10 pontos.
const WEIGHT_RATING_STAR: f32 = 10.0;

/// Fator de decaimento temporal para jogos antigos (não implementado).
///
/// Planejado para reduzir gradualmente a influência de títulos jogados há muito tempo.
/// Valor de 0,95 - para 5% de redução por período definido.
#[allow(dead_code)]
const DECAY_FACTOR: f32 = 0.95;

/// Calcula o perfil de preferências do usuário.
///
/// Analisa a biblioteca de jogos do usuário e gera um perfil baseado em:
/// - **Tempo de jogo**: Maior peso para jogos mais jogados (até 100h)
/// - **Favoritos**: Bônus significativo para jogos marcados
/// - **Avaliações**: Score baseado em estrelas atribuídas
/// - **Gêneros**: Distribuição dos scores pelos gêneros dos jogos
///
/// # Algoritmo
///
/// Para cada jogo:
/// 1. Calcula score base: `(horas * 2) + (favorito * 50) + (estrelas * 10)`
/// 2. Distribui esse score entre todos os gêneros do jogo
/// 3. Acumula scores e contadores por gênero
///
/// # Parâmetros
/// * `games` - Slice de jogos da biblioteca do usuário
///
/// # Retorna
/// `UserProfile` contendo:
/// - `top_genres`: Gêneros ordenados por score (maior → menor)
/// - `total_playtime`: Soma total de minutos jogados
/// - `total_games`: Quantidade de jogos analisados
///
/// # Exemplo
/// ```rust
/// let profile = calculate_user_profile(&user_games);
///
/// println!("Gênero favorito: {}", profile.top_genres[0].name);
/// println!("Score do gênero: {}", profile.top_genres[0].score);
/// println!("Total de horas: {}", profile.total_playtime / 60);
/// ```
pub fn calculate_user_profile(games: &[Game]) -> UserProfile {
    let mut genre_scores: HashMap<String, (f32, i32)> = HashMap::new();
    let mut total_playtime = 0;

    for game in games {
        total_playtime += game.playtime;

        // Calcular o Score Base do Jogo (Game Score)
        let mut game_score = 0.0;

        // Fator Tempo de Jogo (limitado a 100h para não distorcer demais)
        let hours = (game.playtime as f32 / 60.0).min(100.0);
        game_score += hours * WEIGHT_PLAYTIME_HOUR;

        // Fator Favorito
        if game.favorite {
            game_score += WEIGHT_FAVORITE;
        }

        // Fator Rating (Se tiver avaliação)
        if let Some(rating) = game.rating {
            game_score += (rating as f32) * WEIGHT_RATING_STAR;
        }

        // Distribuir o Score para os Gêneros do Jogo
        if let Some(genre_str) = &game.genre {
            let genres: Vec<&str> = genre_str.split(',').map(|s| s.trim()).collect();

            for genre in genres {
                if genre.is_empty() || genre == "Desconhecido" {
                    continue;
                }

                let entry = genre_scores.entry(genre.to_string()).or_insert((0.0, 0));
                entry.0 += game_score; // Soma pontuação
                entry.1 += 1; // Conta ocorrência
            }
        }
    }

    // Converter HashMap para Vetor Ordenado
    let mut top_genres: Vec<GenreScore> = genre_scores
        .into_iter()
        .map(|(name, (score, count))| GenreScore {
            name,
            score,
            game_count: count,
        })
        .collect();

    // Ordenar do maior score para o menor
    top_genres.sort_by(|a, b| {
        b.score
            .partial_cmp(&a.score)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    UserProfile {
        top_genres,
        total_playtime,
        total_games: games.len() as i32,
    }
}

// TODO: Implementar sistema de ranqueamento de novos jogos
//
// Funcionalidade planejada para cruzar o perfil do usuário com
// uma lista de jogos candidatos (ex: lançamentos futuros, jogos em promoção)
// e ranqueá-los por compatibilidade com as preferências do usuário.
//
// Estratégias a considerar:
// - Matching de gêneros com weights do perfil
// - Boost para jogos de desenvolvedoras favoritas
// - Penalidade para gêneros que o usuário evita
// - Integração com ratings externos (Metacritic, Steam)
//
// pub fn rank_games(profile: &UserProfile, candidates: Vec<Game>) -> Vec<Game> {
//     // Implementação futura
// }
