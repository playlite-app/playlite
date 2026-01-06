import { invoke } from '@tauri-apps/api/core';

import { Game, GameInput } from '@/types';

export const librariesService = {
  initDb: async (): Promise<void> => {
    await invoke('init_db');
  },

  getGames: async (): Promise<Game[]> => {
    return await invoke<Game[]>('get_games');
  },

  /**
   * Adiciona novo jogo à biblioteca local (SQLite).
   * Se já existir jogo com mesmo ID, sobrescreve completamente os dados.
   */
  addGame: async (game: GameInput) => {
    await invoke('add_game', { game });
  },

  /**
   * Atualiza dados de um jogo existente na biblioteca.
   * Não faz nada se o ID não existir (operação silenciosa).
   */
  updateGame: async (game: GameInput) => {
    await invoke('update_game', { game });
  },

  deleteGame: async (id: string): Promise<void> => {
    await invoke('delete_game', { id });
  },

  toggleFavorite: async (id: string): Promise<void> => {
    await invoke('toggle_favorite', { id });
  },
};
