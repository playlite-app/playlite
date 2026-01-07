import { invoke } from '@tauri-apps/api/core';

import { WishlistGame } from '@/types';

export interface SteamSearchResult {
  id: number;
  name: string;
  tiny_image?: string;
}

export const wishlistService = {
  /**
   * Retorna todos os jogos da lista de desejos.
   * Inclui dados de preço da última atualização (se disponível).
   */
  getWishlist: async (): Promise<WishlistGame[]> => {
    return await invoke<WishlistGame[]>('get_wishlist');
  },

  removeFromWishlist: async (id: string): Promise<void> => {
    await invoke('remove_from_wishlist', { id });
  },

  /**
   * Atualiza preços de TODOS os jogos da wishlist consultando Steam Store API.
   * Operação pode demorar (múltiplas requisições HTTP sequenciais).
   * Falhas individuais não interrompem o processo - jogos que falharem mantêm preço anterior.
   */
  refreshPrices: async (): Promise<void> => {
    await invoke('refresh_prices');
  },

  /**
   * Busca jogos no Steam por nome para adicionar à wishlist.
   * Usa API de busca do Steam (resultados podem incluir DLCs e pacotes).
   *
   * @param query - Termo de busca (nome do jogo)
   * @returns Lista de resultados com id, name e tiny_image
   */
  searchWishlistGame: async (query: string): Promise<SteamSearchResult[]> => {
    return await invoke<SteamSearchResult[]>('search_wishlist_game', { query });
  },

  /**
   * Adiciona um jogo à wishlist baseado num resultado de busca do Steam.
   * Preço inicial é null - use refreshPrices() para buscar preço atual.
   *
   * @param game - Resultado da busca (searchWishlistGame)
   */
  addToWishlist: async (game: SteamSearchResult): Promise<void> => {
    await invoke('add_to_wishlist', {
      id: game.id.toString(),
      name: game.name,
      coverUrl: game.tiny_image,
      storeUrl: `https://store.steampowered.com/app/${game.id}`,
      currentPrice: null,
      steamAppId: game.id,
    });
  },
};
