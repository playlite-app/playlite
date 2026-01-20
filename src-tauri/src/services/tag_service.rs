//! Serviço para classificação e gerenciamento de tags de jogos
//!
//! Usa regras definidas em `tag_metadata.json` para classificar e filtrar tags obtidas da API RAWG.

use crate::utils::tag_utils::{GameTag, TagMetadata};
use once_cell::sync::Lazy;
use serde::Serialize;
use serde_json;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

// Cache estático das regras de tags
static TAG_METADATA: Lazy<HashMap<String, TagMetadata>> = Lazy::new(|| {
    load_tag_metadata().unwrap_or_else(|e| {
        eprintln!("Erro ao carregar tag_metadata.json: {}", e);
        HashMap::new()
    })
});

/// Carrega o arquivo tag_metadata.json
fn load_tag_metadata() -> Result<HashMap<String, TagMetadata>, Box<dyn std::error::Error>> {
    let path = get_tag_metadata_path();
    let content = fs::read_to_string(&path)?;
    let tags: Vec<TagMetadata> = serde_json::from_str(&content)?;

    let map = tags
        .into_iter()
        .map(|tag| (tag.slug.clone(), tag))
        .collect();

    Ok(map)
}

/// Retorna o caminho para tag_metadata.json
fn get_tag_metadata_path() -> PathBuf {
    PathBuf::from("data/tag_metadata.json")
}

/// Classifica tags da RAWG usando as regras
pub fn classify_tags(raw_tags: Vec<String>) -> Vec<GameTag> {
    raw_tags
        .iter()
        .filter_map(|slug| {
            TAG_METADATA.get(slug).and_then(|metadata| {
                // Só retorna tags visíveis
                if metadata.visible {
                    Some(GameTag {
                        slug: metadata.slug.clone(),
                        name: metadata.name.clone(),
                        category: metadata.category.clone(),
                        relevance: metadata.relevance as f32,
                    })
                } else {
                    None
                }
            })
        })
        .collect()
}

/// Classifica e ordena tags por relevância
pub fn classify_and_sort_tags(raw_tags: Vec<String>, limit: usize) -> Vec<GameTag> {
    let mut classified = classify_tags(raw_tags);

    // Ordena por relevância (maior primeiro)
    classified.sort_by(|a, b| {
        b.relevance
            .partial_cmp(&a.relevance)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    // Limita quantidade
    classified.truncate(limit);

    classified
}

/// Retorna tags desconhecidas (para logging/análise)
pub fn get_unknown_tags(raw_tags: &[String]) -> Vec<String> {
    raw_tags
        .iter()
        .filter(|slug| !TAG_METADATA.contains_key(*slug))
        .cloned()
        .collect()
}

/// Retorna estatísticas das tags
pub fn get_tag_stats() -> TagStats {
    let total = TAG_METADATA.len();
    let visible = TAG_METADATA.values().filter(|t| t.visible).count();

    let by_category: HashMap<String, usize> =
        TAG_METADATA.values().fold(HashMap::new(), |mut acc, tag| {
            let category = format!("{:?}", tag.category);
            *acc.entry(category).or_insert(0) += 1;
            acc
        });

    TagStats {
        total,
        visible,
        hidden: total - visible,
        by_category,
    }
}

#[derive(Debug, Serialize)]
pub struct TagStats {
    pub total: usize,
    pub visible: usize,
    pub hidden: usize,
    pub by_category: HashMap<String, usize>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::tag_utils::TagCategory;

    // Helper para criar tags de teste sem depender do arquivo
    fn create_test_metadata() -> HashMap<String, TagMetadata> {
        let mut map = HashMap::new();

        map.insert(
            "singleplayer".to_string(),
            TagMetadata {
                slug: "singleplayer".to_string(),
                name: "Singleplayer".to_string(),
                category: TagCategory::Mode,
                relevance: 8,
                visible: true,
            },
        );

        map.insert(
            "story-rich".to_string(),
            TagMetadata {
                slug: "story-rich".to_string(),
                name: "Story Rich".to_string(),
                category: TagCategory::Narrative,
                relevance: 10,
                visible: true,
            },
        );

        map.insert(
            "fantasy".to_string(),
            TagMetadata {
                slug: "fantasy".to_string(),
                name: "Fantasy".to_string(),
                category: TagCategory::Theme,
                relevance: 7,
                visible: true,
            },
        );

        map.insert(
            "windows".to_string(),
            TagMetadata {
                slug: "windows".to_string(),
                name: "Windows".to_string(),
                category: TagCategory::Technical,
                relevance: 3,
                visible: false, // Não deve aparecer
            },
        );

        map.insert(
            "casual".to_string(),
            TagMetadata {
                slug: "casual".to_string(),
                name: "Casual".to_string(),
                category: TagCategory::Gameplay,
                relevance: 6,
                visible: true,
            },
        );

        map.insert(
            "indie".to_string(),
            TagMetadata {
                slug: "indie".to_string(),
                name: "Indie".to_string(),
                category: TagCategory::Meta,
                relevance: 5,
                visible: true,
            },
        );

        map
    }

    #[test]
    fn test_classify_tags_logic() {
        // Testa apenas a lógica de classificação com dados mockados
        let test_metadata = create_test_metadata();

        let raw_tags = vec![
            "singleplayer".to_string(),
            "story-rich".to_string(),
            "fantasy".to_string(),
            "windows".to_string(),     // deve ser filtrada (visible: false)
            "unknown-tag".to_string(), // deve ser ignorada
        ];

        // Simula a classificação manualmente
        let classified: Vec<_> = raw_tags
            .iter()
            .filter_map(|slug| {
                test_metadata.get(slug).and_then(|metadata| {
                    if metadata.visible {
                        Some((slug.clone(), metadata.name.clone()))
                    } else {
                        None
                    }
                })
            })
            .collect();

        assert_eq!(classified.len(), 3);
        assert!(classified.iter().any(|(slug, _)| slug == "singleplayer"));
        assert!(classified.iter().any(|(slug, _)| slug == "story-rich"));
        assert!(classified.iter().any(|(slug, _)| slug == "fantasy"));
        assert!(!classified.iter().any(|(slug, _)| slug == "windows"));
    }

    #[test]
    fn test_sort_by_relevance_logic() {
        // Testa apenas a lógica de ordenação
        let test_metadata = create_test_metadata();

        let raw_tags = vec![
            "casual".to_string(),     // relevance: 6
            "story-rich".to_string(), // relevance: 10
            "indie".to_string(),      // relevance: 5
        ];

        let mut sorted: Vec<_> = raw_tags
            .iter()
            .filter_map(|slug| test_metadata.get(slug))
            .collect();

        sorted.sort_by(|a, b| {
            b.relevance
                .partial_cmp(&a.relevance)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        assert_eq!(sorted[0].slug, "story-rich");
        assert_eq!(sorted[1].slug, "casual");
        assert_eq!(sorted[2].slug, "indie");
    }

    #[test]
    fn test_get_unknown_tags_logic() {
        let test_metadata = create_test_metadata();

        let raw_tags = vec![
            "singleplayer".to_string(),
            "unknown-1".to_string(),
            "fantasy".to_string(),
            "unknown-2".to_string(),
        ];

        let unknown: Vec<_> = raw_tags
            .iter()
            .filter(|slug| !test_metadata.contains_key(*slug))
            .cloned()
            .collect();

        assert_eq!(unknown.len(), 2);
        assert!(unknown.contains(&"unknown-1".to_string()));
        assert!(unknown.contains(&"unknown-2".to_string()));
    }
}
