import { CATEGORY_MULTIPLIERS, UserPreferenceVector } from '@/types';

// Interface auxiliar para aceitar GameTag (local) ou RawgTag (API)
interface TagWithSlug {
  slug: string;
  category?: string;
}

/**
 * Calcula afinidade entre perfil do usuário e características de um jogo
 *
 * @param profile - Perfil de preferências do usuário
 * @param genres - Lista de gêneros do jogo
 * @param tags - Lista de tags do jogo (com categoria opcional)
 * @param series - Nome da série do jogo (opcional)
 * @returns Score de afinidade
 */
export function calculateAffinity(
  profile: UserPreferenceVector | null,
  genres: string[],
  tags: TagWithSlug[] = [],
  series: string | null = null
): number {
  if (!profile) return 0;

  let score = 0;

  // 1. Gêneros
  genres.forEach(g => {
    const key = g.toLowerCase();

    if (profile.genres[g]) {
      score += profile.genres[g];
    } else if (profile.genres[key]) {
      score += profile.genres[key];
    }
  });

  // 2. Tags - Busca em todas as possíveis chaves
  tags.forEach(tag => {
    // O backend agora usa o formato "CategoryEnum:slug" (ex: "Gameplay:rpg")
    // Mas o RawgGame pode não ter category, então tentamos vários formatos

    const slug = tag.slug.toLowerCase();
    let found = false;

    // Tenta encontrar a tag no perfil
    // O perfil tem chaves no formato "Gameplay:rpg", "Narrative:story", etc.
    Object.keys(profile.tags).forEach(profileKey => {
      // profileKey está no formato "Gameplay:rpg"
      const [profileCategory, profileSlug] = profileKey.split(':');

      if (profileSlug && profileSlug.toLowerCase() === slug) {
        // Encontrou! Usa o multiplicador da categoria do perfil
        const category = profileCategory.toLowerCase();
        const multiplier =
          CATEGORY_MULTIPLIERS[category as keyof typeof CATEGORY_MULTIPLIERS] ||
          0.5;
        score += profile.tags[profileKey] * multiplier;
        found = true;
      }
    });

    // Se não encontrou e tem categoria no tag, tenta o formato direto
    if (!found && tag.category) {
      const category = tag.category.toLowerCase();
      const tagKey = `${category}:${slug}`;

      if (profile.tags[tagKey]) {
        const multiplier =
          CATEGORY_MULTIPLIERS[category as keyof typeof CATEGORY_MULTIPLIERS] ||
          0.5;
        score += profile.tags[tagKey] * multiplier;
      }
    }
  });

  // 3. Séries
  if (series && profile.series[series]) {
    score += profile.series[series] * 1.5;
  }

  return score;
}

/**
 * Extrai as top séries do perfil para exibir na UI
 */
export function getFavoriteSeries(
  profile: UserPreferenceVector | null,
  limit = 5
): string[] {
  if (!profile || !profile.series) return [];

  return Object.entries(profile.series)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([name]) => name);
}
