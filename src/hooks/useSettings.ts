import { listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';

import { ERROR_MESSAGES } from '../constants/errorMessages';
import { settingsService } from '../services/settingsService';

export function useSettings(onLibraryUpdate: () => void) {
  const [keys, setKeys] = useState({
    steamId: '',
    steamApiKey: '',
    rawgApiKey: '',
    geminiApiKey: '',
  });

  const [loading, setLoading] = useState({
    initial: true,
    saving: false,
    importing: false,
    enriching: false,
    fetchingCovers: false,
    exporting: false,
    importingBackup: false,
    authenticating: false,
  });

  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    game: string;
  } | null>(null);

  useEffect(() => {
    settingsService
      .getSecrets()
      .then(data => {
        setKeys({
          steamId: data.steamId || '',
          steamApiKey: data.steamApiKey || '',
          rawgApiKey: data.rawgApiKey || '',
          geminiApiKey: data.geminiApiKey || '',
        });
      })
      .catch(e => console.error('Erro ao carregar settings', e))
      .finally(() => setLoading(prev => ({ ...prev, initial: false })));
  }, []);

  // Listener de Eventos
  useEffect(() => {
    // Ouve progresso
    const unlistenProgress = listen(
      'enrich_progress',
      (event: {
        payload: { current: number; total_found: number; last_game: string };
      }) => {
        const p = event.payload;
        setProgress({
          current: p.current,
          total: p.total_found,
          game: p.last_game,
        });

        const isCoverTask = p.last_game.startsWith('Capa:');

        setLoading(prev => ({
          ...prev,
          enriching: !isCoverTask,
          fetchingCovers: isCoverTask,
        }));
      }
    );

    const unlistenComplete = listen('enrich_complete', () => {
      setLoading(prev => ({
        ...prev,
        enriching: false,
        fetchingCovers: false,
      }));
      setProgress(null);
      setStatus({
        type: 'success',
        message: 'Processo concluído com sucesso!',
      });
      onLibraryUpdate();
    });

    return () => {
      unlistenProgress.then(f => f());
      unlistenComplete.then(f => f());
    };
  }, [onLibraryUpdate]);

  useEffect(() => {
    if (status.type && status.message) {
      const timer = setTimeout(() => {
        setStatus({ type: null, message: '' });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [status]);

  const connectToItad = async () => {
    setLoading(prev => ({ ...prev, authenticating: true }));
    setStatus({ type: null, message: 'Aguardando login no navegador...' });

    try {
      const msg = await settingsService.connectToItad();
      setStatus({ type: 'success', message: msg });
    } catch (error) {
      setStatus({ type: 'error', message: String(error) });
    } finally {
      setLoading(prev => ({ ...prev, authenticating: false }));
    }
  };

  const saveKeys = async () => {
    setLoading(prev => ({ ...prev, saving: true }));
    setStatus({ type: null, message: '' });

    try {
      await settingsService.setSecrets({
        steamId: keys.steamId.trim() || null,
        steamApiKey: keys.steamApiKey.trim() || null,
        rawgApiKey: keys.rawgApiKey.trim() || null,
        geminiApiKey: keys.geminiApiKey.trim() || null,
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
    setStatus({ type: null, message: 'Iniciando atualização de metadados...' });

    try {
      await settingsService.enrichLibrary();
    } catch (error) {
      setStatus({ type: 'error', message: String(error) });
      setLoading(prev => ({ ...prev, enriching: false }));
    }
  };

  const fetchMissingCovers = async () => {
    setLoading(prev => ({ ...prev, fetchingCovers: true }));
    setStatus({ type: null, message: 'Buscando capas faltantes...' });

    try {
      await settingsService.fetchMissingCovers();
    } catch (error) {
      setStatus({ type: 'error', message: String(error) });
      setLoading(prev => ({ ...prev, fetchingCovers: false }));
    }
  };

  const exportDatabase = async () => {
    setLoading(prev => ({ ...prev, exporting: true }));
    setStatus({ type: null, message: 'Exportando backup...' });

    try {
      const msg = await settingsService.exportDatabase();
      setStatus({ type: 'success', message: msg });
    } catch (error: unknown) {
      if ((error as any).message !== ERROR_MESSAGES.CANCELLED) {
        setStatus({
          type: 'error',
          message: (error as any).message || 'Erro ao exportar',
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
    } catch (error: unknown) {
      if ((error as any).message !== ERROR_MESSAGES.CANCELLED) {
        setStatus({
          type: 'error',
          message: (error as any).message || 'Erro ao importar',
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
    progress,
    actions: {
      saveKeys,
      importLibrary,
      enrichLibrary,
      fetchMissingCovers,
      exportDatabase,
      importDatabase,
      connectToItad,
    },
  };
}
