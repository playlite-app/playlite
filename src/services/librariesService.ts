import { invoke } from '@tauri-apps/api/core';

import { Game } from '../types';

export const librariesService = {
  /**
   * Inicializa o banco de dados.
   * @returns Uma promessa que resolve quando o banco de dados é inicializado.
   */
  initDb: async (): Promise<void> => {
    await invoke('init_db');
  },

  /**
   * Obtém a lista de jogos da biblioteca.
   * @returns Uma promessa que resolve para uma lista de jogos.
   */
  getGames: async (): Promise<Game[]> => {
    return await invoke<Game[]>('get_games');
  },

  /**
   * Adiciona um novo jogo à biblioteca.
   * @param game - O objeto do jogo a ser adicionado, contendo id, name, genre, platform, coverUrl, playtime e rating.
   * @returns Uma promessa que resolve quando o jogo é adicionado.
   */
  addGame: async (game: {
    id: string;
    name: string;
    genre: string;
    platform: string;
    coverUrl: string | null;
    playtime: number;
    rating: number | null;
  }): Promise<void> => {
    await invoke('add_game', game);
  },

  /**
   * Atualiza um jogo existente na biblioteca.
   * @param game - O objeto do jogo a ser atualizado, contendo id, name, genre, platform, coverUrl, playtime e rating.
   * @returns Uma promessa que resolve quando o jogo é atualizado.
   */
  updateGame: async (game: {
    id: string;
    name: string;
    genre: string;
    platform: string;
    coverUrl: string | null;
    playtime: number;
    rating: number | null;
  }): Promise<void> => {
    await invoke('update_game', game);
  },

  /**
   * Remove um jogo da biblioteca pelo ID.
   * @param id - O ID do jogo a ser removido.
   * @returns Uma promessa que resolve quando o jogo é removido.
   */
  deleteGame: async (id: string): Promise<void> => {
    await invoke('delete_game', { id });
  },

  /**
   * Alterna o status de favorito de um jogo pelo ID.
   * @param id - O ID do jogo cujo status de favorito será alternado.
   * @returns Uma promessa que resolve quando o status é alternado.
   */
  toggleFavorite: async (id: string): Promise<void> => {
    await invoke('toggle_favorite', { id });
  },
};
