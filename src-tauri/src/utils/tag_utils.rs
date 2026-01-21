//! Utilities para manipulação de tags de jogos
//!
//! **Estruturas e Funções:**
//! - `TagCategory`: Enumeração das categorias de tags.
//! - `GameTag`: Estrutura representando uma tag de jogo com relevância.
//! - `TagMetadata`: Estrutura para metadados de tags.
//! - `TagKey`: Estrutura auxiliar para uso no sistema de recomendação.
//! - `category_multiplier`: Função que retorna um multiplicador de peso baseado na categoria da tag.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum TagCategory {
    Mode,
    Narrative,
    Theme,
    Gameplay,
    Meta,
    Technical,
    Input,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameTag {
    pub slug: String,
    pub name: String,
    pub category: TagCategory,
    pub relevance: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagMetadata {
    pub slug: String,
    pub name: String,
    pub category: TagCategory,
    pub relevance: u8,
    pub visible: bool,
}

/// Para uso no sistema de recomendação
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct TagKey {
    pub category: TagCategory,
    pub slug: String,
}

impl TagKey {
    pub fn new(category: TagCategory, slug: String) -> Self {
        Self { category, slug }
    }
}

/// Helper para pesos por categoria
pub fn category_multiplier(category: &TagCategory) -> f32 {
    match category {
        TagCategory::Mode => 1.4,
        TagCategory::Narrative => 1.3,
        TagCategory::Theme => 1.0,
        TagCategory::Gameplay => 0.9,
        TagCategory::Meta => 0.7,
        TagCategory::Technical => 0.0,
        TagCategory::Input => 0.0,
    }
}
