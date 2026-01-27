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

  // Recomendações (Atualizado para retornar CB e CF)
  const {
    profile,
    recommendations: backlogRecommendations, // CB (Perfil)
    collaborativeRecs, // CF (Social)
    loadingRecommendations,
    loading: profileLoading,
  } = useRecommendation({
    profileCache,
    setProfileCache,
    allGames: library,
    enableContentBased: true,
    enableCollaborative: true,
    // Configuração CB: Backlog geral
    contentBasedParams: {
      minPlaytime: 0,
      maxPlaytime: 300,
      limit: 5,
    },
    // Configuração CF: Sugestões rápidas
    collaborativeParams: {
      minPlaytime: 0,
      maxPlaytime: 120,
      limit: 5,
    },
  });

  // Busca Trending
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
      } catch (error) {
        console.error('Erro ao carregar trending:', error);
      } finally {
        setLoadingTrending(false);
      }
    }
    fetchTrendingIfNeeded();
  }, [trendingCache, setTrendingCache]);

  // Estatísticas da Biblioteca
  const stats = useMemo(() => {
    const totalPlaytime = library.reduce(
      (acc, g) => acc + (g.playtime ?? 0),
      0
    );
    const totalFavorites = library.filter(g => g.favorite).length;

    return {
      totalGames: library.length,
      totalPlaytime,
      totalFavorites,
    };
  }, [library]);

  // Continue Jogando
  const continuePlaying = useMemo(() => {
    return library
      .filter(g => (g.playtime ?? 0) > 0 && (g.playtime ?? 0) < 600)
      .sort(
        (a, b) =>
          (b.lastPlayed ? new Date(b.lastPlayed).getTime() : 0) -
          (a.lastPlayed ? new Date(a.lastPlayed).getTime() : 0)
      )
      .slice(0, 5);
  }, [library]);

  // Mais Jogados
  const mostPlayed = useMemo(() => {
    return [...library]
      .sort((a, b) => (b.playtime ?? 0) - (a.playtime ?? 0))
      .slice(0, 3);
  }, [library]);

  // Top Gêneros
  const topGenres = useMemo(() => {
    const genreStats = library.reduce(
      (acc, game) => {
        if (game.genres) {
          game.genres.split(',').forEach((g: string) => {
            const clean = g.trim();

            if (clean !== 'Desconhecido' && clean !== '') {
              acc[clean] = (acc[clean] || 0) + 1;
            }
          });
        }

        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(genreStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [library]);

  return {
    stats,
    continuePlaying,
    backlogRecommendations, // Content-Based
    collaborativeRecs, // Collaborative Filtering
    loadingRecommendations,
    mostPlayed,
    topGenres,
    trending,
    loadingTrending,
    profile,
    profileLoading,
  };
}
