import { invoke } from '@tauri-apps/api/core';

import { RawgGame } from '../types';

export const trendingService = {
  /**
   * Obtém a chave da API RAWG armazenada de forma segura.
   * @returns Uma promessa que resolve para a chave da API como string.
   */
  getApiKey: async (): Promise<string> => {
    return await invoke<string>('get_secret', { keyName: 'rawg_api_key' });
  },

  /**
   * Busca jogos em tendência usando a API RAWG.
   * @param apiKey - A chave da API RAWG.
   * @returns Uma promessa que resolve para uma lista de jogos em tendência.
   */
  getTrending: async (apiKey: string): Promise<RawgGame[]> => {
    return await invoke<RawgGame[]>('get_trending_games', { apiKey });
  },

  /**
   * Busca jogos futuros (upcoming) usando a API RAWG.
   * @param apiKey - A chave da API RAWG.
   * @returns Uma promessa que resolve para uma lista de jogos futuros.
   */
  getUpcoming: async (apiKey: string): Promise<RawgGame[]> => {
    return await invoke<RawgGame[]>('get_upcoming_games', { apiKey });
  },

  /**
   * Adiciona um jogo à lista de desejos, tentando buscar o ID do Steam se possível.
   * @param game - O jogo RAWG a ser adicionado à lista de desejos.
   * @returns Uma promessa que resolve quando o jogo é adicionado.
   */
  addToWishlist: async (game: RawgGame): Promise<void> => {
    let steamAppId: number | null = null;

    try {
      steamAppId = await invoke<number | null>('search_steam_app_id', {
        gameName: game.name,
      });
    } catch (error) {
      console.warn('Não foi possível buscar steam_app_id:', error);
    }

    await invoke('add_to_wishlist', {
      id: game.id.toString(),
      name: game.name,
      coverUrl: game.background_image,
      storeUrl: null,
      currentPrice: null,
      steamAppId: steamAppId,
    });
  },
};
