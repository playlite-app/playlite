import { useEffect, useState } from 'react';

import { trendingService } from '@/services/trendingService.ts';
import { RawgGame } from '@/types';

/**
 * Hook para gerenciar jogos de lançamentos futuros (upcoming games).
 * Busca os próximos lançamentos através da API da RAWG.
 *
 * @returns {Object} Estado dos lançamentos futuros
 *   - upcomingGames: Lista de jogos que serão lançados em breve
 *   - loading: Estado de carregamento
 *   - error: Mensagem de erro, se houver
 */
export function useUpcoming() {
  const [upcomingGames, setUpcomingGames] = useState<RawgGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const apiKey = await trendingService.getApiKey();

        if (!apiKey || apiKey.trim() === '') {
          throw new Error('API Key da RAWG não configurada.');
        }

        const upcoming = await trendingService.getUpcoming(apiKey);
        setUpcomingGames(upcoming);
      } catch (e) {
        console.error('Erro ao buscar lançamentos:', e);
        setError(e instanceof Error ? e.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchUpcoming();
  }, []);

  return {
    upcomingGames,
    loading,
    error,
  };
}
