import { useEffect, useMemo, useState } from 'react';

import { useNetworkStatus } from '@/hooks/common';
import { trendingService } from '@/services/trendingService';
import { Game, RawgGame } from '@/types';

const TRENDING_TTL_MS = 10 * 60 * 1000; // 10 minutos

interface UseTrendingProps {
  userGames: Game[];
  cachedGames: RawgGame[];
  setCachedGames: (games: RawgGame[]) => void;
  cachedFetchedAt: number | null;
  setCachedFetchedAt: (value: number | null) => void;
}

/**
 * Busca jogos em tendência da RAWG e filtra por gênero.
 * Remove automaticamente jogos que o usuário já possui na biblioteca.
 * Usa cache global para evitar requisições desnecessárias.
 *
 * @param userGames - Biblioteca local para filtrar duplicatas
 * @param cachedGames - Cache de jogos da RAWG
 * @param setCachedGames - Atualiza cache global após busca
 * @param cachedFetchedAt - Timestamp do último fetch do cache
 * @param setCachedFetchedAt - Atualiza timestamp do último fetch
 *
 * @returns Objeto com:
 *   - games: Jogos filtrados (sem os que o usuário tem)
 *   - allGenres: Gêneros únicos para o filtro
 *   - loading, error: Estados da requisição
 *   - selectedGenre: Gênero ativo no filtro
 *   - setSelectedGenre: Muda filtro
 *   - retry: Reexecuta busca em caso de erro
 *   - addToWishlist: Função helper do service
 */
export function useTrending({
  userGames,
  cachedGames,
  setCachedGames,
  cachedFetchedAt,
  setCachedFetchedAt,
}: UseTrendingProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  const isOnline = useNetworkStatus();

  const fetchTrending = async () => {
    const now = Date.now();
    const cacheFresh =
      cachedFetchedAt && now - cachedFetchedAt < TRENDING_TTL_MS;

    // Se estiver offline e já tiver jogos em cache, não faz nada
    if (!isOnline && cachedGames.length > 0) {
      return;
    }

    // Se o cache é recente, usa o cache
    if (cacheFresh) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiKey = await trendingService.getApiKey();

      if (!apiKey || apiKey.trim() === '') {
        setError('API Key inválida ou ausente. Verifique as configurações.');

        return;
      }

      console.log('Buscando jogos na RAWG...');
      const result = await trendingService.getTrending(apiKey);
      setCachedGames(result); // Atualiza o cache no App.tsx via prop
      setCachedFetchedAt(Date.now());
    } catch (err) {
      console.error('Erro no hook useTrending:', err);
      const msg = err instanceof Error ? err.message : String(err);

      if (msg.includes('não configurada') || msg.includes('401')) {
        setError('API Key inválida ou ausente. Verifique as configurações.');
      } else {
        setError(`Erro ao buscar jogos: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Reexecuta a busca se a conexão voltar ou se o cache for limpo
  useEffect(() => {
    fetchTrending();
  }, [isOnline, cachedFetchedAt, cachedGames.length]);

  // Lógica de Filtragem (Memoized para performance)
  const { filteredGames, allGenres } = useMemo(() => {
    // Remove jogos que o usuário já tem na biblioteca local
    const userGameNames = new Set(
      userGames.map(g => g.name.toLowerCase().replace(/[^a-z0-9]/g, ''))
    );

    const available = cachedGames.filter(rawgGame => {
      const rawgName = rawgGame.name.toLowerCase().replace(/[^a-z0-9]/g, '');

      return !userGameNames.has(rawgName);
    });

    // Extrai gêneros únicos para o filtro
    const genres = Array.from(
      new Set(cachedGames.flatMap(g => g.genres.map(genre => genre.name)))
    ).sort();

    // Aplica o filtro de gênero selecionado
    const filtered = available.filter(game => {
      if (selectedGenre === 'all') return true;

      return game.genres.some(g => g.name === selectedGenre);
    });

    return { filteredGames: filtered, allGenres: genres };
  }, [cachedGames, userGames, selectedGenre]);

  return {
    games: filteredGames,
    allGenres,
    loading,
    error,
    selectedGenre,
    setSelectedGenre,
    retry: fetchTrending,
    addToWishlist: trendingService.addToWishlist,
  };
}
