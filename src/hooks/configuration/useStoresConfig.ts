import { listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { platformsService } from '@/services/plataformsService';
import { settingsService } from '@/services/settingsService';

/**
 * Hook para gerenciar configurações das lojas (Steam, Epic, Heroic, Ubisoft).
 *
 * @param onLibraryUpdate - Callback chamado quando a biblioteca é atualizada
 */
export function useStoresConfig(onLibraryUpdate?: () => void) {
  // Steam precisa de ID, API Key e diretório raiz
  const [steamConfig, setSteamConfig] = useState({
    steamId: '',
    steamApiKey: '',
    steamRoot: localStorage.getItem('steam_root') || '',
  });

  const [loading, setLoading] = useState({
    initial: true,
    saving: false,
    importing: false,
    importingSteam: false,
    importingEpic: false,
    importingHeroic: false,
    importingUbisoft: false,
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

  // Carrega credenciais Steam ao iniciar
  useEffect(() => {
    settingsService
      .getSecrets()
      .then(data => {
        setSteamConfig(prev => ({
          ...prev,
          steamId: data.steamId || '',
          steamApiKey: data.steamApiKey || '',
        }));
      })
      .catch(e => console.error('Erro ao carregar credenciais Steam', e))
      .finally(() => setLoading(prev => ({ ...prev, initial: false })));
  }, []);

  // Persiste steamRoot no localStorage quando muda
  useEffect(() => {
    localStorage.setItem('steam_root', steamConfig.steamRoot);
  }, [steamConfig.steamRoot]);

  // === STEAM ===

  /**
   * Salva as credenciais Steam (ID e API Key) no keystore seguro.
   */
  const saveSteamKeys = async () => {
    setLoading(prev => ({ ...prev, saving: true }));
    setStatus({ type: null, message: '' });

    try {
      const currentSecrets = await settingsService.getSecrets();

      await settingsService.setSecrets({
        steamId: steamConfig.steamId.trim() || null,
        steamApiKey: steamConfig.steamApiKey.trim() || null,
        rawgApiKey: currentSecrets.rawgApiKey || null,
        geminiApiKey: currentSecrets.geminiApiKey || null,
      });

      setStatus({
        type: 'success',
        message: 'Credenciais Steam atualizadas com segurança!',
      });
      toast.success('Credenciais Steam atualizadas!');
    } catch (error) {
      const errorMsg = `Erro ao salvar: ${error}`;
      setStatus({ type: 'error', message: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  /**
   * Importa a biblioteca Steam usando as credenciais configuradas.
   */
  const importSteamLibrary = async () => {
    if (!steamConfig.steamId || !steamConfig.steamApiKey) {
      const errorMsg = 'Preencha as credenciais da Steam.';
      setStatus({ type: 'error', message: errorMsg });
      toast.error(errorMsg);

      return;
    }

    if (!steamConfig.steamRoot) {
      const errorMsg = 'Selecione o diretório de instalação do Steam.';
      setStatus({ type: 'error', message: errorMsg });
      toast.error(errorMsg);

      return;
    }

    setLoading(prev => ({ ...prev, importingSteam: true }));
    setStatus({ type: null, message: 'Importando biblioteca Steam...' });

    try {
      const msg = await platformsService.importSteamLibrary(
        steamConfig.steamId,
        steamConfig.steamApiKey,
        steamConfig.steamRoot
      );
      setStatus({ type: 'success', message: msg });
      toast.success(msg);
      onLibraryUpdate?.();
    } catch (e) {
      const errorMsg = String(e);
      setStatus({ type: 'error', message: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(prev => ({ ...prev, importingSteam: false }));
    }
  };

  /**
   * Abre diálogo para selecionar o diretório raiz do Steam.
   */
  const chooseSteamDirectory = async () => {
    try {
      const selected = await import('@tauri-apps/plugin-dialog').then(m =>
        m.open({
          directory: true,
          multiple: false,
          title: 'Selecione o diretório de instalação do Steam',
        })
      );

      if (selected) {
        setSteamConfig(prev => ({ ...prev, steamRoot: selected }));
        toast.success('Diretório do Steam selecionado!');
      }
    } catch (error) {
      console.error('Erro ao escolher diretório:', error);
      toast.error('Erro ao selecionar diretório');
    }
  };

  /**
   * Salva credenciais e importa biblioteca numa única ação.
   */
  const saveAndImport = async () => {
    await saveSteamKeys();
    setTimeout(async () => {
      await importSteamLibrary();
    }, 500);
  };

  // === EPIC GAMES ===

  /**
   * Importa jogos instalados da Epic Games Store.
   */
  const importEpicGames = async () => {
    setLoading(prev => ({ ...prev, importingEpic: true }));
    setStatus({ type: null, message: 'Importando jogos Epic Games...' });

    try {
      const msg = await platformsService.importEpicGames();
      setStatus({ type: 'success', message: msg });
      toast.success(msg);
      onLibraryUpdate?.();
    } catch (e) {
      const errorMsg = String(e);
      setStatus({ type: 'error', message: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(prev => ({ ...prev, importingEpic: false }));
    }
  };

  // === HEROIC GAMES LAUNCHER ===

  /**
   * Importa jogos instalados via Heroic Games Launcher (Linux).
   */
  const importHeroicGames = async () => {
    setLoading(prev => ({ ...prev, importingHeroic: true }));
    setStatus({ type: null, message: 'Importando jogos Heroic...' });

    try {
      const msg = await platformsService.importHeroicGames();
      setStatus({ type: 'success', message: msg });
      toast.success(msg);
      onLibraryUpdate?.();
    } catch (e) {
      const errorMsg = String(e);
      setStatus({ type: 'error', message: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(prev => ({ ...prev, importingHeroic: false }));
    }
  };

  // === UBISOFT GAME LAUNCHER ===

  /**
   * Importa jogos da Ubisoft.
   * Detecta automaticamente via %LOCALAPPDATA%\Ubisoft Game Launcher.
   */
  const importUbisoftGames = async () => {
    setLoading(prev => ({ ...prev, importingUbisoft: true }));
    setStatus({ type: null, message: 'Importando jogos Ubisoft...' });

    try {
      const msg = await platformsService.importUbisoftGames();
      setStatus({ type: 'success', message: msg });
      toast.success(msg);
      onLibraryUpdate?.();
    } catch (e) {
      const errorMsg = String(e);
      setStatus({ type: 'error', message: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(prev => ({ ...prev, importingUbisoft: false }));
    }
  };

  // === GERAL ===

  const handleImportProgress = useCallback(
    (event: { payload: { current: number; total: number; game: string } }) => {
      setProgress(event.payload);
    },
    []
  );

  const handleImportComplete = useCallback(() => {
    setLoading(prev => ({ ...prev, importing: false }));
    setProgress(null);
  }, []);

  // Listener para progresso de importação
  useEffect(() => {
    let unlistenProgress: (() => void) | null = null;
    let unlistenComplete: (() => void) | null = null;

    const registerListeners = async () => {
      unlistenProgress = await listen('import_progress', handleImportProgress);
      unlistenComplete = await listen('import_complete', handleImportComplete);
    };

    void registerListeners();

    return () => {
      unlistenProgress?.();
      unlistenComplete?.();
    };
  }, [handleImportComplete, handleImportProgress]);

  // Auto-fecha mensagens de status após 5 segundos
  useEffect(() => {
    if (status.type && status.message) {
      const timer = setTimeout(() => {
        setStatus({ type: null, message: '' });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [status]);

  return {
    steamConfig,
    setSteamConfig,
    loading,
    status,
    progress,
    actions: {
      saveSteamKeys,
      importSteamLibrary,
      chooseSteamDirectory,
      saveAndImport,
      importEpicGames,
      importHeroicGames,
      importUbisoftGames,
    },
  };
}
