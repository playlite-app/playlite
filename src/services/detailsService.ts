import { invoke } from '@tauri-apps/api/core';

import { GameDetails } from '../types';

export const detailsService = {
  /**
   * Busca detalhes extras do jogo na API RAWG baseado no nome.
   * @param gameName - O nome do jogo para buscar detalhes.
   * @returns Uma promessa que resolve para os detalhes do jogo ou null em caso de erro.
   */
  getGameDetails: async (gameName: string): Promise<GameDetails | null> => {
    try {
      return await invoke<GameDetails>('fetch_game_details', {
        query: gameName,
      });
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);

      return null;
    }
  },
};
