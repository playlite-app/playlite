import { invoke } from '@tauri-apps/api/core';

import { RawgGame } from '../types';

export const trendingService = {
  getApiKey: async (): Promise<string> => {
    return await invoke<string>('get_secret', { keyName: 'rawg_api_key' });
  },

  /**
   * Busca jogos em alta (trending) da API RAWG.
   * Retorna jogos populares baseados em popularidade recente e avaliações.
   *
   * @param apiKey - RAWG API key válida
   * @returns Lista de jogos em tendência
   */
  getTrending: async (apiKey: string): Promise<RawgGame[]> => {
    return await invoke<RawgGame[]>('get_trending_games', { apiKey });
  },

  /**
   * Busca próximos lançamentos da API RAWG.
   * Retorna jogos com data de lançamento futura.
   *
   * @param apiKey - RAWG API key válida
   * @returns Lista de jogos a serem lançados
   */
  getUpcoming: async (apiKey: string): Promise<RawgGame[]> => {
    return await invoke<RawgGame[]>('get_upcoming_games', { apiKey });
  },

  /**
   * Adiciona jogo da RAWG à wishlist com busca automática de Steam App ID.
   * Tenta encontrar correspondência no Steam para ‘tracking’ de preços.
   * Continua normalmente se não encontrar correspondência no Steam (steamAppId será null).
   *
   * @param game - Jogo da RAWG (trending ou busca manual)
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
