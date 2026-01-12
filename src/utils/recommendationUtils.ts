import { UserPreferenceVector } from '@/types';

/**
 * Calcula score de afinidade para jogos EXTERNOS (ex: RAWG)
 * usando o perfil calculado pelo Rust.
 */
export function calculateAffinity(
  profile: UserPreferenceVector | null,
  genres: string[],
  tags: string[] = [],
  series: string | null = null
): number {
  if (!profile) return 0;

  let score = 0;

  // 1. Gêneros
  genres.forEach(g => {
    if (profile.genres[g]) score += profile.genres[g];
  });

  // 2. Tags
  tags.forEach(t => {
    if (profile.tags[t]) score += profile.tags[t] * 0.5;
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
) {
  if (!profile || !profile.series) return [];

  return Object.entries(profile.series)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([name]) => ({ name }));
}

/**
 * Verifica se uma série é favorita
 */
export function isFavoriteSeries(
  profile: UserPreferenceVector | null,
  series: string | undefined
) {
  if (!profile || !series) return false;

  return (profile.series[series] || 0) > 50; // Threshold arbitrário
}
