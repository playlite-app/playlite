import { invoke } from '@tauri-apps/api/core';

import { WishlistGame } from '../types';

export interface SteamSearchResult {
  id: number;
  name: string;
  tiny_image?: string;
}

export interface AddToWishlistParams {
  id: string;
  name: string;
  coverUrl?: string;
  storeUrl: string;
  currentPrice?: number | null;
  steamAppId: number;
}

export const wishlistService = {
  /**
   * Obtém a lista de jogos da lista de desejos.
   * @returns Uma promessa que resolve para uma lista de jogos da lista de desejos.
   */
  getWishlist: async (): Promise<WishlistGame[]> => {
    return await invoke<WishlistGame[]>('get_wishlist');
  },

  /**
   * Remove um jogo da lista de desejos pelo ID.
   * @param id - O ID do jogo a ser removido.
   * @returns Uma promessa que resolve quando o jogo é removido.
   */
  removeFromWishlist: async (id: string): Promise<void> => {
    await invoke('remove_from_wishlist', { id });
  },

  /**
   * Atualiza os preços dos jogos na lista de desejos.
   * @returns Uma promessa que resolve quando os preços são atualizados.
   */
  refreshPrices: async (): Promise<void> => {
    await invoke('refresh_prices');
  },

  /**
   * Busca jogos no Steam para adicionar à lista de desejos.
   * @param query - A string de busca para encontrar jogos no Steam.
   * @returns Uma promessa que resolve para uma lista de resultados de busca do Steam.
   */
  searchWishlistGame: async (query: string): Promise<SteamSearchResult[]> => {
    return await invoke<SteamSearchResult[]>('search_wishlist_game', { query });
  },

  /**
   * Adiciona um jogo à lista de desejos baseado em um resultado de busca do Steam.
   * @param game - O resultado de busca do Steam a ser adicionado.
   * @returns Uma promessa que resolve quando o jogo é adicionado.
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
