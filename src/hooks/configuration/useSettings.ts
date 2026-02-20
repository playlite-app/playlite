import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ERROR_MESSAGES } from '@/errors/errorMessages';
import { settingsService } from '@/services/settingsService';

/**
 * Hook para gerenciar as configurações do aplicativo, incluindo chaves de API,
 * enriquecimento de metadados, backup e restauração, autenticação com serviços
 * externos e gerenciamento de cache.
 *
 * @param onLibraryUpdate - Função callback chamada quando a biblioteca é atualizada
 * @returns Objeto contendo estados, chaves e ações relacionadas às configurações
 */
export function useSettings(onLibraryUpdate: () => void) {
  const [keys, setKeys] = useState({
    rawgApiKey: '',
    geminiApiKey: '',
  });

  const [loading, setLoading] = useState({
    initial: true,
    saving: false,
    enriching: false,
    fetchingCovers: false,
    exporting: false,
    importingBackup: false,
    authenticating: false,
    loadingCacheStats: false,
    cleaningCache: false,
    clearingAllCache: false,
    refreshingReviews: false,
    refreshingWishlistPrices: false,
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

  const [saveLocally, setSaveLocally] = useState(
    localStorage.getItem('config_save_covers') === 'true'
  );

  // Carrega secrets ao iniciar
  useEffect(() => {
    settingsService
      .getSecrets()
      .then(data => {
        setKeys({
          rawgApiKey: data.rawgApiKey || '',
          geminiApiKey: data.geminiApiKey || '',
        });
      })
      .catch(e => console.error('Erro ao carregar settings', e))
      .finally(() => setLoading(prev => ({ ...prev, initial: false })));
  }, []);

  const saveKeys = async () => {
    setLoading(prev => ({ ...prev, saving: true }));
    setStatus({ type: null, message: '' });

    try {
      // Carrega as credenciais Steam existentes para não sobrescrever
      const currentSecrets = await settingsService.getSecrets();

      await settingsService.setSecrets({
        steamId: currentSecrets.steamId || null,
        steamApiKey: currentSecrets.steamApiKey || null,
        rawgApiKey: keys.rawgApiKey.trim() || null,
        geminiApiKey: keys.geminiApiKey.trim() || null,
      });
      setStatus({
        type: 'success',
        message: 'Credenciais salvas com segurança!',
      });
      toast.success('Credenciais API salvas!');
    } catch (error) {
      const errorMsg = `Erro ao salvar: ${error}`;
      setStatus({ type: 'error', message: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const enrichLibrary = async () => {
    setLoading(prev => ({ ...prev, enriching: true }));
    setStatus({
      type: null,
      message: 'Iniciando atualização de metadados...',
    });

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

  const cleanupCache = async () => {
    setLoading(prev => ({ ...prev, cleaningCache: true }));
    setStatus({ type: null, message: 'Limpando cache expirado...' });

    try {
      const msg = await settingsService.cleanupCache();
      setStatus({ type: 'success', message: msg });
      toast.success(msg || 'Cache expirado limpo com sucesso!');
    } catch (error) {
      const errorMsg = String(error);
      setStatus({ type: 'error', message: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(prev => ({ ...prev, cleaningCache: false }));
    }
  };

  const clearAllCache = async () => {
    setLoading(prev => ({ ...prev, clearingAllCache: true }));
    setStatus({ type: null, message: 'Limpando todo o cache...' });

    try {
      const msg = await settingsService.clearAllCache();
      setStatus({ type: 'success', message: msg });
      toast.success(msg || 'Todo o cache foi limpo com sucesso!');
    } catch (error) {
      const errorMsg = String(error);
      setStatus({ type: 'error', message: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(prev => ({ ...prev, clearingAllCache: false }));
    }
  };

  const toggleSaveLocally = (checked: boolean) => {
    setSaveLocally(checked);
    localStorage.setItem('config_save_covers', String(checked));
    toast.success(`Modo offline ${checked ? 'ativado' : 'desativado'}`);
  };

  const handleClearCache = async () => {
    try {
      await invoke('clear_cover_cache');
      toast.success('Espaço liberado! Imagens locais removidas.');
    } catch {
      toast.error('Erro ao limpar cache.');
    }
  };

  // Listeners para eventos de enriquecimento
  useEffect(() => {
    const setupListeners = async () => {
      const unlistenProgress = await listen(
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

      const unlistenComplete = await listen('enrich_complete', () => {
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

      const unlistenRefreshProgress = await listen(
        'refresh_progress',
        (event: {
          payload: {
            current: number;
            total: number;
            item_name: string;
            refresh_type: 'reviews' | 'prices';
          };
        }) => {
          const p = event.payload;
          setProgress({
            current: p.current,
            total: p.total,
            game: p.item_name,
          });

          setLoading(prev => ({
            ...prev,
            refreshingReviews: p.refresh_type === 'reviews',
            refreshingWishlistPrices: p.refresh_type === 'prices',
          }));
        }
      );

      const unlistenReviewsComplete = await listen(
        'reviews_refresh_complete',
        (event: { payload: string }) => {
          setLoading(prev => ({ ...prev, refreshingReviews: false }));
          setProgress(null);
          setStatus({
            type: 'success',
            message: String(event.payload),
          });
          onLibraryUpdate();
        }
      );

      const unlistenWishlistComplete = await listen(
        'wishlist_refresh_complete',
        (event: { payload: string }) => {
          setLoading(prev => ({ ...prev, refreshingWishlistPrices: false }));
          setProgress(null);
          setStatus({
            type: 'success',
            message: String(event.payload),
          });
        }
      );

      return () => {
        unlistenProgress();
        unlistenComplete();
        unlistenRefreshProgress();
        unlistenReviewsComplete();
        unlistenWishlistComplete();
      };
    };

    setupListeners();
  }, [onLibraryUpdate]);

  // Auto-close status messages
  useEffect(() => {
    if (status.type && status.message) {
      const timer = setTimeout(() => {
        setStatus({ type: null, message: '' });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [status]);

  return {
    keys,
    setKeys,
    loading,
    status,
    progress,
    saveLocally,
    toggleSaveLocally,
    handleClearCache,
    actions: {
      saveKeys,
      enrichLibrary,
      fetchMissingCovers,
      exportDatabase,
      importDatabase,
      cleanupCache,
      clearAllCache,
    },
  };
}
