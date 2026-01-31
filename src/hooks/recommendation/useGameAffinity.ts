import { useMemo } from 'react';

import { RawgGame, UserPreferenceVector } from '@/types';
import { calculateAffinity, isFavoriteSeries } from '@/utils/recommendation.ts';

/**
 * Hook complementar ao useRecommendation
 *
 * - **useRecommendation**: Busca recomendações do backend (jogos da biblioteca)
 * - **useGameAffinity**: Calcula afinidade no frontend (jogos externos da RAWG)
 *
 * Este hook é usado para calcular afinidade para jogos que NÃO
 * passaram pelo sistema de recomendação do backend (ex: trending games, upcoming).
 *
 * @param profile - Perfil de preferências do usuário (obtido via useRecommendation)
 * @returns Função memoizada para calcular afinidade de um jogo
 */
export function useGameAffinityCalculator(
  profile: UserPreferenceVector | null
) {
  return useMemo(() => {
    const cache = new Map<string, ReturnType<typeof calculateGameAffinity>>();

    return (game: RawgGame) => {
      const cacheKey = `${game.id}`;

      if (cache.has(cacheKey)) {
        return cache.get(cacheKey)!;
      }

      const result = calculateGameAffinity(game, profile);
      cache.set(cacheKey, result);

      return result;
    };
  }, [profile]);
}

/**
 * Calcula afinidade e badge de um jogo com base no perfil do usuário.
 *
 * @param game - Jogo da RAWG
 * @param profile - Perfil de preferências do usuário (obtido via useRecommendation)
 * @returns Objeto com dados de afinidade e badge recomendado
 */
export function calculateGameAffinity(
  game: RawgGame,
  profile: UserPreferenceVector | null
): {
  genres: string[];
  tags: { slug: string }[];
  affinity: number;
  isFavSeries: boolean;
  badge?: string;
} {
  const genres = game.genres?.map(g => g.name) || [];
  const tags = game.tags?.map(t => ({ slug: t.name })) || [];
  const affinity = calculateAffinity(
    profile,
    genres,
    tags,
    game.series || null
  );
  const isFavSeries = isFavoriteSeries(profile, game.series || null);

  let badge: string | undefined;

  if (isFavSeries) {
    badge = 'SÉRIE FAVORITA';
  } else if (affinity > 80) {
    badge = 'TOP PICK';
  } else if (affinity > 50) {
    badge = 'PARA VOCÊ';
  }

  // Debug temporário
  if (badge) {
    console.log(
      `[DEBUG] Game: ${game.name}, Affinity: ${affinity}, Badge: ${badge}`
    );
  }

  return { genres, tags, affinity, isFavSeries, badge };
}

/**
 * Hook para ordenar jogos por afinidade com o perfil do usuário.
 *
 * @param games - Lista de jogos a ordenar
 * @param profile - Perfil de preferências do usuário
 * @returns Lista de jogos ordenada por afinidade (maior para menor)
 */
export function useSortedByAffinity(
  games: RawgGame[],
  profile: UserPreferenceVector | null
) {
  return useMemo(() => {
    if (!profile) return games;

    return [...games].sort((a, b) => {
      const genresA = a.genres?.map(g => g.name) || [];
      const genresB = b.genres?.map(g => g.name) || [];
      const tagsA = a.tags?.map(t => ({ slug: t.name })) || [];
      const tagsB = b.tags?.map(t => ({ slug: t.name })) || [];
      const scoreA = calculateAffinity(
        profile,
        genresA,
        tagsA,
        a.series || null
      );
      const scoreB = calculateAffinity(
        profile,
        genresB,
        tagsB,
        b.series || null
      );

      return scoreB - scoreA;
    });
  }, [games, profile]);
}
