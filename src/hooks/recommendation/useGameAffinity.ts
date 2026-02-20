import { useMemo } from 'react';

import tagMetadata from '@/data/tag_metadata.json';
import { Giveaway, RawgGame, UserPreferenceVector } from '@/types';
import { calculateAffinity } from '@/utils/recommendation';

/**
 * Pré-processa os dados de tags para criar regexes de correspondência.
 */
const TAG_MATCHERS = tagMetadata
  .filter(tag => tag.visible)
  .map(tag => {
    const patterns = new Set<string>();

    if (tag.slug) patterns.add(tag.slug);

    if (tag.name) patterns.add(tag.name);

    const regexes = Array.from(patterns)
      .map(value => buildTagRegex(value))
      .filter((regex): regex is RegExp => !!regex);

    return {
      slug: tag.slug,
      category: tag.category,
      regexes,
    };
  });

/** Constrói uma expressão regular para corresponder a uma tag ou termo.
 *
 * @param value - Tag ou termo para o qual construir a regex
 * @returns Expressão regular que corresponde ao termo, ou null se inválido
 */
function buildTagRegex(value: string): RegExp | null {
  const tokens = value
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);

  if (tokens.length === 0) return null;

  const pattern = tokens.join('(?:\\s|-)');

  return new RegExp(`\\b${pattern}\\b`, 'gi');
}

/**
 * Calcula afinidade e badge de um giveaway com base no perfil do usuário.
 *
 * @param giveaway - Giveaway a ser avaliado
 * @param profile - Perfil de preferências do usuário (obtido via useRecommendation)
 * @returns Objeto com dados de afinidade e badge recomendado
 */
export function calculateGiveawayAffinity(
  giveaway: Giveaway,
  profile: UserPreferenceVector | null
) {
  // Se não houver perfil, retorna neutro sem processar dados (Performance)
  if (!profile)
    return {
      affinity: 0,
      badge: undefined,
    } as {
      affinity: number;
      badge?: 'TOP PICK' | 'PARA VOCÊ';
    };

  const textToScan = `${giveaway.title} ${giveaway.description}`.toLowerCase();
  let score = 0;

  // 1. Checagem de Séries (Baseado em profile.rs)
  for (const [seriesName, weight] of Object.entries(profile.series)) {
    if (giveaway.title.toLowerCase().includes(seriesName.toLowerCase())) {
      score += weight;
    }
  }

  // 2. Scan de Tags/Gêneros usando tag_metadata.json
  const matchedTags = TAG_MATCHERS.flatMap(tag => {
    const matches = tag.regexes.some(regex => regex.test(textToScan));

    return matches ? [{ slug: tag.slug, category: tag.category }] : [];
  });

  score += calculateAffinity(profile, [], matchedTags, null);

  // 3. Definição da Badge
  let badge: 'TOP PICK' | 'PARA VOCÊ' | undefined;

  if (score > 150) {
    badge = 'TOP PICK';
  } else if (score > 100) {
    badge = 'PARA VOCÊ';
  }

  return { affinity: score, badge };
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
  badge?: 'TOP PICK' | 'PARA VOCÊ';
} {
  const genres = game.genres?.map(g => g.name) || [];
  const tags = game.tags?.map(t => ({ slug: t.name })) || [];
  const affinity = calculateAffinity(
    profile,
    genres,
    tags,
    game.series || null
  );

  let badge: 'TOP PICK' | 'PARA VOCÊ' | undefined;

  if (affinity > 150) {
    badge = 'TOP PICK';
  } else if (affinity > 100) {
    badge = 'PARA VOCÊ';
  }

  return { genres, tags, affinity, badge };
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
