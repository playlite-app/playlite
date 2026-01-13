//! Módulo para inferência de séries de jogos
//!
//! Baseado no nome do jogo, tenta identificar a série a que ele pertence.
//! Utiliza uma lista conhecida de séries e heurísticas simples para identificar a série correta.

use std::sync::OnceLock;

/// Carrega e cacheia a lista de séries do JSON
fn get_known_series() -> &'static Vec<String> {
    static SERIES_CACHE: OnceLock<Vec<String>> = OnceLock::new();
    SERIES_CACHE.get_or_init(|| {
        let json_content = include_str!("../data/known_series.json");
        let mut list: Vec<String> =
            serde_json::from_str(json_content).expect("Erro ao carregar known_series.json");
        // Ordena por tamanho (maior para menor) para prioridade correta
        list.sort_by(|a, b| b.len().cmp(&a.len()));
        list
    })
}

fn normalize_name(name: &str) -> String {
    name.to_lowercase()
        .replace(['™', '®', '©', ':'], "")
        .trim()
        .to_string()
}

/// Tenta identificar a série baseada no nome do jogo
pub fn infer_series(game_name: &str) -> Option<String> {
    let normalized_target = normalize_name(game_name);
    let known_list = get_known_series();

    // 1. Busca na lista conhecida
    for series in known_list {
        let normalized_series = normalize_name(series);
        if normalized_target.contains(&normalized_series) {
            return Some(series.clone());
        }
    }

    // 2. Heurística básica (se não achou na lista)
    // Ex: "Horizon Zero Dawn" -> Tenta pegar "Horizon" se houver separador
    let splitters = [":", " -", " –"];
    for pattern in splitters {
        if let Some(pos) = game_name.find(pattern) {
            let base = game_name[..pos].trim();
            if base.len() >= 3 {
                return Some(base.to_string());
            }
        }
    }

    None
}
