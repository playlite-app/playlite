//! Utilitários para manipulação de Strings em nomes de jogos, séries e tags.

// === CONSTANTS ===

const EDITION_SUFFIXES: &[&str] = &[
    "Collector's Edition",
    "Collectors Edition",
    "Complete Edition",
    "Game of the Year Edition",
    "Definitive Edition",
    "Special Edition",
    "Deluxe Edition",
    "Premium Edition",
    "Enhanced Edition",
    "GOTY Edition",
    "GOTY",
    "Ultimate Edition",
];

/// Remove símbolos de marca registrada, preservando capitalização e conteúdo.
/// Uso: limpar nome antes de persistir (import), exibição.
pub fn strip_trademark_symbols(name: &str) -> String {
    name.chars()
        .filter(|c| !matches!(c, '™' | '®' | '©'))
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

/// Normaliza para comparação/matching: minúsculo, sem símbolos, sem pontuação de separador.
/// Uso: cache keys, dedup, series matching, comparação com resultado de busca externa.
pub fn normalize_for_matching(name: &str) -> String {
    strip_trademark_symbols(name)
        .to_lowercase()
        .replace(':', "")
        .trim()
        .to_string()
}

/// Heurística por palavra-chave para identificar nomes que provavelmente
/// não são o jogo-base (DLC, edição especial, trilha sonora, demo, pré-venda).
/// Não é definitivo — é um filtro barato para descartar candidatos óbvios
/// antes de aplicar critérios mais confiáveis (match exato, dados estruturados).
pub fn is_likely_non_base_game(name: &str) -> bool {
    let lower = name.to_lowercase();
    let keywords = [
        "season pass",
        " dlc",
        "demo",
        "add-on",
        "addon",
        "expansion",
        "pre-order",
        "preorder",
        "pre order",
        "starter pack",
        " pack",
        "soundtrack",
        "artbook",
        "art book",
        "playtest",
        "goodie",
    ];
    keywords.iter().any(|kw| lower.contains(kw))
}

/// Remove sufixo de edição conhecido do final do nome, se houver.
/// Usado como segunda tentativa de match quando o nome completo (com edição) não bate.
pub fn strip_edition_suffix(name: &str) -> String {
    let trimmed = name.trim();
    for suffix in EDITION_SUFFIXES {
        if let Some(rest) = trimmed.to_lowercase().strip_suffix(&suffix.to_lowercase()) {
            return trimmed[..rest.len()]
                .trim_end_matches(['-', ':', ',', ' '])
                .trim()
                .to_string();
        }
    }
    trimmed.to_string()
}
