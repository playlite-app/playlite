//! Módulo de comandos Tauri para sistema de recomendação.
//!
//! Camada de apresentação (Command Layer) que expõe funcionalidades
//! do motor de recomendações para o frontend via IPC.
//!
//! # Arquitetura
//! Este módulo segue o padrão de três camadas:
//! 1. **Command Layer** (este arquivo) - Interface Tauri
//! 2. **Service Layer** (`services::recommendation`) - Lógica de negócio
//! 3. **Data Layer** (`database`) - Acesso a dados
//!
//! # Separação de Responsabilidades
//! - Commands: Comunicação com frontend, validação de entrada/saída
//! - Services: Algoritmos de cálculo e processamento
//! - Database: Persistência e queries SQL

use crate::database::AppState;
use crate::models::{Game, UserProfile};
use crate::services::recommendation;
use tauri::State;

/// Gera o perfil de preferências do usuário baseado na biblioteca.
///
/// Analisa todos os jogos da biblioteca e calcula um perfil detalhado
/// das preferências do usuário, incluindo gêneros favoritos com scores
/// ponderados e estatísticas gerais de uso.
///
/// # Fluxo de Dados
/// ```text
/// 1. Database Layer: Busca jogos do SQLite
///    └─> SELECT * FROM games
///
/// 2. Service Layer: Processa dados
///    └─> recommendation::calculate_user_profile(games)
///        ├─> Calcula scores por gênero
///        ├─> Pondera por playtime, rating, favoritos
///        └─> Ordena gêneros por relevância
///
/// 3. Command Layer: Retorna para frontend
///    └─> JSON serializado via Tauri IPC
/// ```
///
/// # Retorna
/// `UserProfile` contendo:
/// - **top_genres**: Lista ordenada de gêneros com scores
///   - Ordem decrescente (mais relevante primeiro)
///   - Cada gênero tem: nome, score calculado, quantidade de jogos
/// - **total_playtime**: Soma de minutos jogados em todos os jogos
/// - **total_games**: Quantidade total de jogos na biblioteca
///
/// # Exemplo de Uso (Frontend)
/// ```javascript
/// const profile = await invoke('get_user_profile');
///
/// console.log(`Gênero favorito: ${profile.top_genres[0].name}`);
/// console.log(`Score: ${profile.top_genres[0].score}`);
/// console.log(`Total de horas jogadas: ${profile.total_playtime / 60}`);
/// ```
///
/// # Exemplo de Resposta
/// ```json
/// {
///   "top_genres": [
///     { "name": "RPG", "score": 450.5, "game_count": 15 },
///     { "name": "Action", "score": 320.0, "game_count": 22 },
///     { "name": "Strategy", "score": 180.0, "game_count": 8 }
///   ],
///   "total_playtime": 125400,
///   "total_games": 150
/// }
/// ```
///
/// # Algoritmo de Score
/// Para cada jogo, o score é calculado como:
/// ```text
/// score = (horas_jogadas * 2)           // Max 100h = 200 pts
///       + (é_favorito * 50)              // Favorito = +50 pts
///       + (rating_estrelas * 10)         // 5★ = 50 pts
///
/// Esse score é distribuído entre todos os gêneros do jogo.
/// ```
///
/// # Parâmetros
/// * `state` - Estado compartilhado da aplicação com conexão do banco
///
/// # Erros
/// * `Err(String)` - Falha ao acessar banco de dados ou processar jogos
///   - "Falha ao bloquear mutex" - Problema de concorrência
///   - Erros SQL - Problemas na query
///   - Erros de mapeamento - Dados corrompidos no banco
///
/// # Uso Futuro
/// Este perfil pode ser usado para:
/// - Recomendar novos jogos compatíveis
/// - Filtrar listas de lançamentos
#[tauri::command]
pub fn get_user_profile(state: State<AppState>) -> Result<UserProfile, String> {
    // Busca todos os jogos do banco (Database Layer)
    let games = {
        let conn = state.db.lock().map_err(|_| "Falha ao bloquear mutex")?;
        let mut stmt = conn
            .prepare("SELECT id, name, genre, platform, cover_url, playtime, rating, favorite FROM games")
            .map_err(|e| e.to_string())?;

        let games_iter = stmt
            .query_map([], |row| {
                Ok(Game {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    genre: row.get(2)?,
                    platform: row.get(3)?,
                    cover_url: row.get(4)?,
                    playtime: row.get(5)?,
                    rating: row.get(6)?,
                    favorite: row.get(7)?,
                })
            })
            .map_err(|e| e.to_string())?;

        games_iter
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?
    };

    // Passa para o Motor de Recomendação (Service Layer)
    let profile = recommendation::calculate_user_profile(&games);

    Ok(profile)
}
