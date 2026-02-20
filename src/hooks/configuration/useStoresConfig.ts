import { listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { settingsService } from '@/services/settingsService';

/**
 * Hook para gerenciar configurações das lojas (Steam, Epic, GOG, etc.)
 * Reutiliza a lógica e serviços de useSettings para importação Steam
 *
 * @param onLibraryUpdate - Função callback chamada quando a biblioteca é atualizada
 * @returns Objeto contendo estados e ações relacionadas às configurações das lojas
 */
export function useStoresConfig(onLibraryUpdate?: () => void) {
  const [steamConfig, setSteamConfig] = useState({
    steamId: '',
    steamApiKey: '',
    steamRoot: localStorage.getItem('steam_root') || '',
  });

  const [loading, setLoading] = useState({
    initial: true,
    saving: false,
    importing: false,
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

  // Salva steamRoot no localStorage quando muda
  useEffect(() => {
    localStorage.setItem('steam_root', steamConfig.steamRoot);
  }, [steamConfig.steamRoot]);

  /**
   * Salva as credenciais Steam (ID e API Key)
   */
  const saveSteamKeys = async () => {
    setLoading(prev => ({ ...prev, saving: true }));
    setStatus({ type: null, message: '' });

    try {
      // Carrega as outras chaves existentes para não sobrescrever
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
   * Importa a biblioteca Steam usando as credenciais configuradas
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

    setLoading(prev => ({ ...prev, importing: true }));
    setStatus({ type: null, message: 'Importando biblioteca Steam...' });

    try {
      const msg = await settingsService.importSteamLibrary(
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
      setLoading(prev => ({ ...prev, importing: false }));
    }
  };

  /**
   * Abre diálogo para selecionar o diretório de instalação do Steam
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
        setSteamConfig(prev => ({
          ...prev,
          steamRoot: selected as string,
        }));
        toast.success('Diretório do Steam selecionado!');
      }
    } catch (error) {
      console.error('Erro ao escolher diretório:', error);
      toast.error('Erro ao selecionar diretório');
    }
  };

  /**
   * Salva credenciais e importa biblioteca numa única ação
   */
  const saveAndImport = async () => {
    await saveSteamKeys();
    // Aguarda para as chaves serem salvas antes de importar
    setTimeout(async () => {
      await importSteamLibrary();
    }, 500);
  };

  // Listener para progresso de importação (se houver eventos)
  useEffect(() => {
    const setupListeners = async () => {
      const unlistenProgress = await listen(
        'import_progress',
        (event: {
          payload: { current: number; total: number; game: string };
        }) => {
          setProgress(event.payload);
        }
      );

      const unlistenComplete = await listen('import_complete', () => {
        setLoading(prev => ({ ...prev, importing: false }));
        setProgress(null);
      });

      return () => {
        unlistenProgress();
        unlistenComplete();
      };
    };

    setupListeners();
  }, []);

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
    },
  };
}
