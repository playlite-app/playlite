import { useCallback, useEffect, useState } from 'react';

import { wishlistService } from '../services/wishlistService';
import { WishlistGame } from '../types';

/**
 * Gerencia lista de desejos (jogos desejados) com preços da Steam.
 * Remove usa atualização otimista para feedback instantâneo.
 *
 * @returns Objeto com:
 *   - games: Lista de jogos desejados com preços
 *   - isLoading: Carregamento inicial
 *   - isRefreshing: true durante atualização de preços
 *   - removeGame: Remove e atualiza UI imediatamente
 *   - refreshPrices: Busca preços atualizados de todos os jogos (pode demorar)
 *   - refreshList: Recarrega lista do banco
 */
export function useWishlist() {
  const [games, setGames] = useState<WishlistGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchWishlist = useCallback(async () => {
    try {
      const result = await wishlistService.getWishlist();
      setGames(result);
    } catch (error) {
      console.error('Erro ao buscar wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const removeGame = async (id: string) => {
    try {
      await wishlistService.removeFromWishlist(id);
      // Atualização otimista: remove da lista visual imediatamente
      setGames(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      console.error(error);
      throw new Error('Erro ao remover jogo.');
    }
  };

  const refreshPrices = async () => {
    setIsRefreshing(true);

    try {
      await wishlistService.refreshPrices();
      await fetchWishlist();
    } catch (error) {
      console.error(error);
      throw new Error('Erro ao atualizar preços.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    games,
    isLoading,
    isRefreshing,
    removeGame,
    refreshPrices,
    refreshList: fetchWishlist,
  };
}
