//! Serviço para classificação e gerenciamento de tags de jogos
//!
//! Usa regras definidas em `tag_metadata.json` para classificar e filtrar tags obtidas da API RAWG.

use crate::utils::tag_utils::{GameTag, TagMetadata};
use once_cell::sync::Lazy;
use serde::Serialize;
use serde_json;
use std::collections::{HashMap, HashSet};
use tauri::{AppHandle, Manager};

const TAG_METADATA_JSON: &str = include_str!("../data/tag_metadata.json");

// Estrutura para estatísticas de tags
#[derive(Debug, Serialize)]
pub struct TagStats {
    pub total: usize,
    pub visible: usize,
    pub hidden: usize,
    pub by_category: HashMap<String, usize>,
}

#[derive(Debug, Serialize)]
struct AnalysisReport {
    timestamp: String,
    stats: TagStats,
    unknown_tags_count: usize,
    unknown_tags: Vec<String>, // Lista das tags que não estão no seu JSON
}

// Cache estático das regras de tags
static TAG_METADATA: Lazy<HashMap<String, TagMetadata>> = Lazy::new(|| {
    load_tag_metadata().unwrap_or_else(|e| {
        eprintln!("Erro ao carregar tag_metadata.json: {}", e);
        HashMap::new()
    })
});

/// Carrega o metadata a partir da string embutida
fn load_tag_metadata() -> Result<HashMap<String, TagMetadata>, Box<dyn std::error::Error>> {
    // Parse direto da constante, sem IO de disco
    let tags: Vec<TagMetadata> = serde_json::from_str(TAG_METADATA_JSON)?;

    let map = tags
        .into_iter()
        .map(|tag| (tag.slug.clone(), tag))
        .collect();

    Ok(map)
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

/// Recebe um conjunto de TODAS as tags (slugs) encontradas durante o enriquecimento,
/// gera um relatório e salva num arquivo JSON na pasta de logs do aplicativo.
pub fn generate_analysis_report(
    app: &AppHandle,
    encountered_slugs: HashSet<String>,
) -> Result<String, String> {
    // 1. Calcula estatísticas gerais (já existentes)
    let stats = get_tag_stats();

    // 2. Filtra quais das tags encontradas são desconhecidas
    let mut unknown_tags: Vec<String> = encountered_slugs
        .into_iter()
        .filter(|slug| !TAG_METADATA.contains_key(slug))
        .collect();

    // Ordena para facilitar a leitura
    unknown_tags.sort();

    // 3. Monta o relatório
    let report = AnalysisReport {
        timestamp: chrono::Local::now().to_rfc3339(),
        stats,
        unknown_tags_count: unknown_tags.len(),
        unknown_tags,
    };

    // 4. Define o caminho do arquivo
    // Em Dev: Salva na pasta de logs do app (ex: AppData/Local/com.game-manager.dev/logs/tag_report.json)
    let log_dir = app.path().app_log_dir().map_err(|e| e.to_string())?;
    let file_path = log_dir.join("tag_analysis_report.json");

    // 5. Salva no disco
    let json = serde_json::to_string_pretty(&report).map_err(|e| e.to_string())?;
    std::fs::write(&file_path, json).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().to_string())
}
