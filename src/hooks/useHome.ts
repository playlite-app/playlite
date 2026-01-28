import { useEffect, useMemo, useState } from 'react';

import { Game, RawgGame, UserPreferenceVector } from '@/types';

// Importe o tipo correto
import { trendingService } from '../services/trendingService';
import { useRecommendation } from './recommendation';

interface UseHomeProps {
  games: Game[];
  trendingCache: RawgGame[];
  setTrendingCache: (games: RawgGame[]) => void;
  profileCache: UserPreferenceVector | null;
  setProfileCache: (profile: UserPreferenceVector) => void;
}

/**
 * Hook para gerenciar os dados e estados da página inicial do aplicativo.
 * Inclui estatísticas da biblioteca, jogos em andamento, recomendações,
 * jogos mais jogados, gêneros principais e jogos em tendência.
 *
 * @param games - Lista completa de jogos na biblioteca do usuário
 * @param trendingCache - Cache local dos jogos em tendência
 * @param setTrendingCache - Função para atualizar o cache de jogos em tendência
 * @param profileCache - Cache local do perfil de preferências do usuário
 * @param setProfileCache - Função para atualizar o cache do perfil de preferências
 * @returns Objeto contendo dados e estados para a página inicial
 */
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
    recommendations: backlogRecommendations, // Content-Based
    collaborativeRecs, // Collaborative
    loadingRecommendations,
    loading: profileLoading,
  } = useRecommendation({
    profileCache,
    setProfileCache,
    allGames: library,
    enableContentBased: true,
    enableCollaborative: true,
    enableHybrid: false, // Home não usa a lista unificada (apenas Playlist)
    contentBasedParams: {
      minPlaytime: 0,
      maxPlaytime: 300,
      limit: 5,
    },
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
    backlogRecommendations, // Retorna RecommendedGame[]
    collaborativeRecs, // Retorna RecommendedGame[]
    loadingRecommendations,
    mostPlayed,
    topGenres,
    trending,
    loadingTrending,
    profile,
    profileLoading,
  };
}
