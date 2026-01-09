import { useEffect, useState } from 'react';

import { ERROR_MESSAGES } from '../constants/errorMessages';
import { settingsService } from '../services/settingsService';

/**
 * Gerencia configurações, importações e backups do aplicativo.
 * Mantém API keys seguras e coordena operações de longa duração.
 * Mensagens de status desaparecem automaticamente após 5 segundos.
 *
 * @param onLibraryUpdate - Callback executado após importar biblioteca e dados.
 * @returns Objeto com:
 *   - keys: {steamId, steamApiKey, rawgApiKey, igdbClientId, igdbClientSecret}
 *   - setKeys: Atualiza state local (não salva automaticamente)
 *   - loading: Estados individuais para cada operação
 *   - status: {type: 'success'|'error'|null, message: string}
 *   - actions: {saveKeys, importLibrary, enrichLibrary, exportDatabase, importDatabase}
 */
export function useSettings(onLibraryUpdate: () => void) {
  const [keys, setKeys] = useState({
    steamId: '',
    steamApiKey: '',
    rawgApiKey: '',
    igdbClientId: '',
    igdbClientSecret: '',
  });

  const [loading, setLoading] = useState({
    initial: true,
    saving: false,
    importing: false,
    enriching: false,
    exporting: false,
    importingBackup: false,
  });

  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  useEffect(() => {
    settingsService
      .getSecrets()
      .then(data => {
        setKeys({
          steamId: data.steamId || '',
          steamApiKey: data.steamApiKey || '',
          rawgApiKey: data.rawgApiKey || '',
          igdbClientId: data.igdbClientId || '',
          igdbClientSecret: data.igdbClientSecret || '',
        });
      })
      .catch(e => console.error('Erro ao carregar settings', e))
      .finally(() => setLoading(prev => ({ ...prev, initial: false })));
  }, []);

  useEffect(() => {
    if (status.type && status.message) {
      const timer = setTimeout(() => {
        setStatus({ type: null, message: '' });
      }, 5000); // 5000ms = 5 segundos

      return () => clearTimeout(timer); // Limpa se o componente desmontar
    }
  }, [status]);

  const saveKeys = async () => {
    setLoading(prev => ({ ...prev, saving: true }));
    setStatus({ type: null, message: '' });

    try {
      await settingsService.setSecrets({
        steamId: keys.steamId.trim() || null,
        steamApiKey: keys.steamApiKey.trim() || null,
        rawgApiKey: keys.rawgApiKey.trim() || null,
        igdbClientId: keys.igdbClientId.trim() || null,
        igdbClientSecret: keys.igdbClientSecret.trim() || null,
      });
      setStatus({
        type: 'success',
        message: 'Credenciais salvas com segurança!',
      });
    } catch (error) {
      setStatus({ type: 'error', message: `Erro ao salvar: ${error}` });
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const importLibrary = async () => {
    /* Código original */
    if (!keys.steamId || !keys.steamApiKey) {
      setStatus({ type: 'error', message: 'Preencha as chaves da Steam.' });

      return;
    }

    setLoading(prev => ({ ...prev, importing: true }));

    try {
      const msg = await settingsService.importSteamLibrary(
        keys.steamId,
        keys.steamApiKey
      );
      setStatus({ type: 'success', message: msg });
      onLibraryUpdate();
    } catch (e) {
      setStatus({ type: 'error', message: String(e) });
    } finally {
      setLoading(prev => ({ ...prev, importing: false }));
    }
  };

  const enrichLibrary = async () => {
    setLoading(prev => ({ ...prev, enriching: true }));
    setStatus({ type: null, message: 'Buscando dados extras...' });

    try {
      const summary = await settingsService.enrichLibrary();

      if (summary.errorCount === 0) {
        setStatus({
          type: 'success',
          message: `Sucesso total! ${summary.successCount} jogos atualizados.`,
        });
      } else {
        setStatus({
          type: 'success',
          message: `Concluído: ${summary.successCount} atualizados, mas ${summary.errorCount} falharam.`,
        });
      }

      onLibraryUpdate();
    } catch (error) {
      setStatus({ type: 'error', message: String(error) });
    } finally {
      setLoading(prev => ({ ...prev, enriching: false }));
    }
  };

  const exportDatabase = async () => {
    setLoading(prev => ({ ...prev, exporting: true }));
    setStatus({ type: null, message: 'Exportando backup...' });

    try {
      const msg = await settingsService.exportDatabase();
      setStatus({ type: 'success', message: msg });
    } catch (error: any) {
      if (error.message !== ERROR_MESSAGES.CANCELLED) {
        setStatus({
          type: 'error',
          message: error.message || 'Erro ao exportar',
        });
      } else {
        setStatus({ type: null, message: '' });
      }
    } finally {
      setLoading(prev => ({ ...prev, exporting: false }));
    }
  };

  const importDatabase = async () => {
    setLoading(prev => ({ ...prev, importingBackup: true }));
    setStatus({ type: null, message: 'Importando backup...' });

    try {
      const msg = await settingsService.importDatabase();
      setStatus({ type: 'success', message: msg });
      onLibraryUpdate();
    } catch (error: any) {
      if (error.message !== ERROR_MESSAGES.CANCELLED) {
        setStatus({
          type: 'error',
          message: error.message || 'Erro ao importar',
        });
      } else {
        setStatus({ type: null, message: '' });
      }
    } finally {
      setLoading(prev => ({ ...prev, importingBackup: false }));
    }
  };

  return {
    keys,
    setKeys,
    loading,
    status,
    actions: {
      saveKeys,
      importLibrary,
      enrichLibrary,
      exportDatabase,
      importDatabase,
    },
  };
}
