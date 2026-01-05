import { useEffect, useMemo, useState } from 'react';

import { trendingService } from '../services/trendingService';
import { Game, RawgGame, UserProfile } from '../types';
import { useRecommendation } from './useRecommendation';

interface UseHomeProps {
  games: Game[];
  trendingCache: RawgGame[];
  setTrendingCache: (games: RawgGame[]) => void;
  profileCache: UserProfile | null;
  setProfileCache: (profile: UserProfile) => void;
}

/**
 * Gerencia a lógica de negócio da página inicial (Home/Dashboard).
 * Calcula estatísticas, seções de jogos e busca trending da RAWG (com cache).
 *
 * @param props.games - Biblioteca completa do usuário
 * @param props.trendingCache - Cache de jogos em tendência da RAWG
 * @param props.setTrendingCache - Função para atualizar o cache
 * @param props.profileCache - Cache do perfil de gêneros do usuário
 * @param props.setProfileCache - Função para atualizar o perfil
 *
 * @returns Objeto com:
 *   - trending: Jogos populares da RAWG
 *   - profile: Perfil de preferências do usuário
 *   - totalGames, totalPlaytime, totalFavorites: Estatísticas
 *   - continuePlaying: Jogos com progresso entre 0-50h
 *   - backlogRecommendations: Top 5 jogos não jogados por afinidade de gênero
 *   - mostPlayed: Top jogos por tempo de jogo
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
  const {
    profile,
    calculateAffinity,
    loading: profileLoading,
  } = useRecommendation({
    profileCache,
    setProfileCache,
  });

  // Busca Trending se o cache estiver vazio
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
  }, [trendingCache]); // Roda se o cache mudar ou montar

  // Lógica de Negócios (Síncrona - Instantânea)

  // Stats
  const totalGames = library.length;
  const totalPlaytime = library.reduce((acc, g) => acc + g.playtime, 0);
  const totalFavorites = library.filter(g => g.favorite).length;

  // Continue Jogando
  const continuePlaying = library
    .filter(g => g.playtime > 0 && g.playtime < 50)
    .sort((a, b) => b.playtime - a.playtime)
    .slice(0, 5);

  // Recomendações
  const backlogRecommendations = useMemo(() => {
    if (!profile) return [];

    return library
      .filter(g => g.playtime === 0)
      .sort((a, b) => {
        const genresA = a.genre
          ? a.genre.split(',').map(n => ({ name: n.trim() }))
          : [];
        const genresB = b.genre
          ? b.genre.split(',').map(n => ({ name: n.trim() }))
          : [];

        return calculateAffinity(genresB) - calculateAffinity(genresA);
      })
      .slice(0, 5);
  }, [library, profile, calculateAffinity]);

  // Mais Jogados
  const mostPlayed = [...library]
    .sort((a, b) => b.playtime - a.playtime)
    .slice(0, 3);

  // Gêneros Mais Comuns
  const genreStats = useMemo(
    () =>
      library.reduce(
        (acc, game) => {
          if (game.genre) {
            game.genre.split(',').forEach(g => {
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
    // Mostra loading se estiver carregando perfil ou trending crítico
    loading: profileLoading || (loadingTrending && trending.length === 0),
  };
}
