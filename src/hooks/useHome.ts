import { useEffect, useMemo, useState } from 'react';

import { Game, RawgGame, UserPreferenceVector } from '@/types';

import { trendingService } from '../services/trendingService';
import { useRecommendation } from './useRecommendation';

interface UseHomeProps {
  games: Game[];
  trendingCache: RawgGame[];
  setTrendingCache: (games: RawgGame[]) => void;
  profileCache: UserPreferenceVector | null;
  setProfileCache: (profile: UserPreferenceVector) => void;
}

export function useHome({
  games: library,
  trendingCache,
  setTrendingCache,
  profileCache,
  setProfileCache,
}: UseHomeProps) {
  const [trending, setTrending] = useState<RawgGame[]>(trendingCache);
  const [loadingTrending, setLoadingTrending] = useState(false);

  // Integração com o Hook de Recomendação
  const {
    profile,
    recommendations,
    loadingRecommendations,
    loading: profileLoading,
  } = useRecommendation({
    profileCache,
    setProfileCache,
    allGames: library,
  });

  // Busca Trending (Mantido igual)
  useEffect(() => {
    async function fetchTrendingIfNeeded() {
      if (trendingCache.length > 0) {
        setTrending(trendingCache);
        setLoadingTrending(false);

        return;
      }

      setLoadingTrending(true);

      try {
        const apiKey = await trendingService.getApiKey();

        if (apiKey && apiKey.trim() !== '') {
          const result = await trendingService.getTrending(apiKey);
          setTrending(result);
          setTrendingCache(result);
        }
      } catch (e) {
        console.warn('Home: Falha ao buscar trending', e);
      } finally {
        setLoadingTrending(false);
      }
    }
    fetchTrendingIfNeeded();
  }, [trendingCache]);

  // Stats
  const totalGames = library.length;
  const totalPlaytime = library.reduce((acc, g) => acc + (g.playtime ?? 0), 0);
  const totalFavorites = library.filter(g => g.favorite).length;

  // Continue Jogando
  const continuePlaying = library
    .filter(g => (g.playtime ?? 0) > 0 && (g.playtime ?? 0) < 50)
    .sort((a, b) => (b.playtime ?? 0) - (a.playtime ?? 0))
    .slice(0, 5);

  // Recomendações
  const backlogRecommendations = recommendations;

  // Mais Jogados
  const mostPlayed = [...library]
    .sort((a, b) => (b.playtime ?? 0) - (a.playtime ?? 0))
    .slice(0, 3);

  // Gêneros Mais Comuns
  const genreStats = useMemo(
    () =>
      library.reduce(
        (acc, game) => {
          if (game.genres) {
            game.genres.split(',').forEach((g: string) => {
              const clean = g.trim();

              if (clean !== 'Desconhecido') {
                acc[clean] = (acc[clean] || 0) + 1;
              }
            });
          }

          return acc;
        },
        {} as Record<string, number>
      ),
    [library]
  );

  const topGenres = useMemo(
    () =>
      Object.entries(genreStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6),
    [genreStats]
  );

  return {
    stats: { totalGames, totalPlaytime, totalFavorites },
    continuePlaying,
    backlogRecommendations,
    mostPlayed,
    topGenres,
    trending,
    profile,
    loadingRecommendations,
    loading:
      profileLoading ||
      loadingRecommendations ||
      (loadingTrending && trending.length === 0),
  };
}
