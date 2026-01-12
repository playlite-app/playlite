import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';

import { ERROR_MESSAGES, parseBackupError } from '@/constants/errorMessages.ts';
import { ImportSummary, KeysBatch } from '@/types';

export const settingsService = {
  getSecrets: async (): Promise<KeysBatch> => {
    return await invoke<KeysBatch>('get_secrets');
  },

  setSecrets: async (keys: {
    steamId: string | null;
    steamApiKey: string | null;
    rawgApiKey: string | null;
  }): Promise<void> => {
    await invoke('set_secrets', keys);
  },

  /**
   * Inicia o fluxo OAuth com IsThereAnyDeal.
   * Abre o navegador, aguarda o login e salva o token no banco.
   */
  connectToItad: async (): Promise<string> => {
    return await invoke<string>('start_itad_auth');
  },

  /**
   * Importa jogos do Steam e adiciona à biblioteca.
   * Requer Steam ID público e API key válida.
   * Pode demorar vários segundos dependendo do tamanho da biblioteca.
   *
   * @throws Se as credenciais forem inválidas ou a API estiver indisponível
   */
  importSteamLibrary: async (
    steamId: string,
    apiKey: string
  ): Promise<string> => {
    return await invoke<string>('import_steam_library', { steamId, apiKey });
  },

  /**
   * Enriquece jogos existentes com dados de gênero na Steam, buscados diretamente da API da Steam.
   * Processa apenas jogos sem dados completos.
   * Operação pode ser lenta para bibliotecas grandes.
   * Os dados são usados para o sistema de recomendação.
   */
  enrichLibrary: async (): Promise<ImportSummary> => {
    return await invoke<ImportSummary>('enrich_library');
  },

  /**
   * Busca capas faltantes para jogos na biblioteca.
   * Pode demorar dependendo do número de capas faltantes.
   * Utiliza RAWG como fonte.
   */
  fetchMissingCovers: async (): Promise<void> => {
    await invoke('fetch_missing_covers');
  },

  /**
   * Exporta toda a biblioteca para JSON.
   * Abre diálogo nativo para escolher local de salvamento.
   *
   * @throws Se o usuário cancelar ou não tiver permissões de escrita
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
   * Importa biblioteca de um backup JSON.
   * SOBRESCREVE todos os dados existentes sem confirmação.
   * Valida formato antes de importar.
   *
   * @throws Se o arquivo for inválido ou corrompido
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
