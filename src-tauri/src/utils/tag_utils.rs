//! Utilities para manipulação de tags de jogos
//!
//! **Estruturas e Funções:**
//! - `TagCategory`: Enumeração das categorias de tags.
//! - `TagRole`: Enumeração dos papéis/funções das tags no sistema.
//! - `GameTag`: Estrutura representando uma tag de jogo com relevância e role.
//! - `TagMetadata`: Estrutura para metadados de tags.
//! - `TagKey`: Estrutura auxiliar para uso no sistema de recomendação.
//! - `category_multiplier`: Função que retorna um multiplicador de peso baseado na categoria da tag.
//! - `role_multiplier`: Função que retorna um multiplicador de peso baseado no papel da tag.

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

/// Papel/função da tag no sistema de recomendação
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum TagRole {
    /// Tags de afinidade - principal motor de recomendação
    /// Representam o tipo de experiência que o jogador gosta
    /// Ex: Story Rich, Horror, RPG, Roguelike
    Affinity,

    /// Tags de contexto - refinamento e desempate
    /// Características que explicam o jogo mas não definem preferência
    /// Ex: Singleplayer, Multiplayer, Indie, Pixel Art
    Context,

    /// Tags de filtro - gatekeeping (inclui/exclui)
    /// Não contribuem para score, apenas decidem elegibilidade
    /// Ex: Sexual Content, NSFW, VR
    Filter,

    /// Tags de diversificação - quebram monotonia
    /// Sugerem mudança de ritmo, não aumentam relevância
    /// Ex: Relaxing, Cute, Comedy, Short
    Diversity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameTag {
    pub slug: String,
    pub name: String,
    pub category: TagCategory,
    pub role: TagRole,
    pub relevance: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagMetadata {
    pub slug: String,
    pub name: String,
    pub category: TagCategory,
    pub role: TagRole,
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
///
/// Multiplica o peso base da tag baseado em sua categoria.
/// Categorias mais relevantes para experiência de jogo têm multiplicadores maiores.
pub fn category_multiplier(category: &TagCategory) -> f32 {
    match category {
        TagCategory::Mode => 0.3,      // Contexto do modo de jogo
        TagCategory::Narrative => 1.5, // Narrativa é muito importante
        TagCategory::Theme => 1.2,     // Tema/ambientação também
        TagCategory::Gameplay => 1.0,  // Mecânicas de gameplay (peso base)
        TagCategory::Meta => 0.7,      // Metadados e características visuais
        TagCategory::Technical => 0.0, // Aspectos técnicos não influenciam
        TagCategory::Input => 0.0,     // Tipo de controle não influencia score
    }
}

/// Helper para pesos por role (papel da tag no sistema)
///
/// Define quanto uma tag contribui para o score baseado em seu papel:
/// - Affinity: peso completo (1.0) - motor principal
/// - Context: peso reduzido (0.15) - apenas refinamento
/// - Filter: peso zero (0.0) - não entra no score
/// - Diversity: peso muito baixo (0.05) - apenas quebra monotonia
pub fn role_multiplier(role: &TagRole) -> f32 {
    match role {
        TagRole::Affinity => 1.0,  // Peso completo - motor de recomendação
        TagRole::Context => 0.25,  // 25% - apenas refinamento/desempate
        TagRole::Filter => 0.0,    // Não entra no score - apenas gatekeeping
        TagRole::Diversity => 0.1, // 10% - quebra monotonia sem dominar
    }
}

/// Calcula o multiplicador combinado de categoria e role
///
/// Isso permite que o sistema aplique ambos os conceitos:
/// - Category: "que tipo de informação é esta?"
/// - Role: "como esta tag deve ser usada?"
///
/// Exemplo:
/// - Tag "Story Rich" (Narrative + Affinity): 1.5 * 1.0 = 1.5
/// - Tag "Singleplayer" (Mode + Context): 0.3 * 0.15 = 0.045
/// - Tag "NSFW" (Meta + Filter): 0.7 * 0.0 = 0.0
pub fn combined_multiplier(category: &TagCategory, role: &TagRole) -> f32 {
    category_multiplier(category) * role_multiplier(role)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_role_multipliers() {
        assert_eq!(role_multiplier(&TagRole::Affinity), 1.0);
        assert_eq!(role_multiplier(&TagRole::Context), 0.15);
        assert_eq!(role_multiplier(&TagRole::Filter), 0.0);
        assert_eq!(role_multiplier(&TagRole::Diversity), 0.05);
    }

    #[test]
    fn test_category_multipliers() {
        assert_eq!(category_multiplier(&TagCategory::Narrative), 1.5);
        assert_eq!(category_multiplier(&TagCategory::Theme), 1.2);
        assert_eq!(category_multiplier(&TagCategory::Gameplay), 1.0);
        assert_eq!(category_multiplier(&TagCategory::Mode), 0.3);
        assert_eq!(category_multiplier(&TagCategory::Meta), 0.7);
        assert_eq!(category_multiplier(&TagCategory::Technical), 0.0);
        assert_eq!(category_multiplier(&TagCategory::Input), 0.0);
    }

    #[test]
    fn test_combined_multiplier() {
        // Story Rich: Narrative + Affinity
        assert_eq!(
            combined_multiplier(&TagCategory::Narrative, &TagRole::Affinity),
            1.5
        );

        // Singleplayer: Mode + Context
        assert_eq!(
            combined_multiplier(&TagCategory::Mode, &TagRole::Context),
            0.045
        );

        // NSFW: Meta + Filter
        assert_eq!(
            combined_multiplier(&TagCategory::Meta, &TagRole::Filter),
            0.0
        );
    }
}
