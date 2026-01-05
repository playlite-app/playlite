import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';

import { ERROR_MESSAGES, parseBackupError } from '@/constants/errorMessages.ts';

import { ImportSummary, KeysBatch } from '../types';

export const settingsService = {
  /**
   * Obtém as chaves secretas armazenadas (Steam ID, API Key, etc.).
   * @returns Uma promessa que resolve para um objeto com as chaves secretas.
   */
  getSecrets: async (): Promise<KeysBatch> => {
    return await invoke<KeysBatch>('get_secrets');
  },

  /**
   * Define as chaves secretas (Steam ID, API Key, etc.).
   * @param keys - Objeto contendo steamId, steamApiKey e rawgApiKey.
   * @returns Uma promessa que resolve quando as chaves são definidas.
   */
  setSecrets: async (keys: {
    steamId: string | null;
    steamApiKey: string | null;
    rawgApiKey: string | null;
  }): Promise<void> => {
    await invoke('set_secrets', keys);
  },

  /**
   * Importa a biblioteca do Steam usando o ID e chave da API.
   * @param steamId - O ID do usuário no Steam.
   * @param apiKey - A chave da API do Steam.
   * @returns Uma promessa que resolve para uma mensagem de sucesso.
   */
  importSteamLibrary: async (
    steamId: string,
    apiKey: string
  ): Promise<string> => {
    return await invoke<string>('import_steam_library', { steamId, apiKey });
  },

  /**
   * Enriquece a biblioteca com dados adicionais.
   * @returns Uma promessa que resolve para um resumo da importação.
   */
  enrichLibrary: async (): Promise<ImportSummary> => {
    return await invoke<ImportSummary>('enrich_library');
  },

  /**
   * Exporta o banco de dados para um arquivo JSON.
   * @returns Uma promessa que resolve para uma mensagem de sucesso.
   */
  exportDatabase: async (): Promise<string> => {
    try {
      const filePath = await save({
        defaultPath: `playlite-backup-${new Date().toISOString().split('T')[0]}.json`,
        filters: [
          {
            name: 'JSON',
            extensions: ['json'],
          },
        ],
      });

      if (!filePath) {
        throw new Error(ERROR_MESSAGES.CANCELLED);
      }

      await invoke('export_database', { filePath });

      return 'Backup exportado com sucesso!';
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.CANCELLED) {
        throw new Error(ERROR_MESSAGES.CANCELLED);
      }

      const friendlyError = parseBackupError(error);

      if (friendlyError === String(error)) {
        throw new Error(ERROR_MESSAGES.BACKUP_EXPORT_FAILED);
      }

      throw new Error(friendlyError);
    }
  },

  /**
   * Importa o banco de dados de um arquivo JSON.
   * @returns Uma promessa que resolve para uma mensagem de sucesso.
   */
  importDatabase: async (): Promise<string> => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: 'JSON',
            extensions: ['json'],
          },
        ],
      });

      if (!selected) {
        throw new Error(ERROR_MESSAGES.CANCELLED);
      }

      const filePath = selected as string;

      return await invoke<string>('import_database', { filePath });
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.CANCELLED) {
        throw new Error(ERROR_MESSAGES.CANCELLED);
      }

      const friendlyError = parseBackupError(error);

      if (friendlyError === String(error)) {
        throw new Error(ERROR_MESSAGES.BACKUP_IMPORT_FAILED);
      }

      throw new Error(friendlyError);
    }
  },
};
