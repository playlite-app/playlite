import { invoke } from '@tauri-apps/api/core';

import { WishlistGame } from '@/types';

export interface SearchResult {
  id: string;
  name: string;
  cover_url?: string | null;
}

export const wishlistService = {
  /**
   * Retorna todos os jogos da lista de desejos.
   * Inclui dados de preço da última atualização (se disponível).
   */
  getWishlist: async (): Promise<WishlistGame[]> => {
    return await invoke<WishlistGame[]>('get_wishlist');
  },

  /**
   * Remove jogo da wishlist pelo ID.
   *
   * @param id - ID do jogo a ser removido
   */
  removeFromWishlist: async (id: string): Promise<void> => {
    await invoke('remove_from_wishlist', { id });
  },

  /**
   * Atualiza preços de TODOS os jogos da wishlist consultando ITAD API.
   * Operação pode demorar (múltiplas requisições HTTP).
   * Jogos sem correspondência na ITAD mantêm preço anterior.
   */
  refreshPrices: async (): Promise<void> => {
    await invoke('refresh_prices');
  },

  /**
   * Busca jogos na RAWG por nome para adicionar à wishlist.
   * Usa RAWG API para obter metadados e imagens.
   *
   * @param query - Termo de busca (nome do jogo)
   * @returns Lista de resultados com id, name e cover_url
   */
  searchWishlistGame: async (query: string): Promise<SearchResult[]> => {
    return await invoke<SearchResult[]>('search_wishlist_game', { query });
  },

  /**
   * Adiciona um jogo à wishlist baseado num resultado de busca.
   * O ITAD ID será buscado automaticamente quando refresh_prices for chamado.
   *
   * @param game - Resultado da busca (searchWishlistGame)
   */
  addToWishlist: async (game: SearchResult): Promise<void> => {
    await invoke('add_to_wishlist', {
      id: game.id,
      name: game.name,
      coverUrl: game.cover_url,
      storeUrl: null, // Será preenchido pelo refresh_prices
      currentPrice: null,
      itadId: null, // Será buscado pelo refresh_prices
    });
  },
};
