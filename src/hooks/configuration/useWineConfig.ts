import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const WINE_PREFIX_KEY = 'wine_prefix';

/**
 * Hook para gerenciar as configurações do Wine (prefix e diretório).
 * As configurações são salvas no localStorage, semelhante ao steam_root.
 */
export function useWineConfig() {
  const [winePrefix, setWinePrefix] = useState<string>(
    () => localStorage.getItem(WINE_PREFIX_KEY) || ''
  );

  const [saved, setSaved] = useState(false);

  // Persiste no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem(WINE_PREFIX_KEY, winePrefix);
  }, [winePrefix]);

  /**
   * Abre diálogo nativo para selecionar o diretório do Wine prefix.
   */
  const chooseWinePrefix = useCallback(async () => {
    try {
      const selected = await import('@tauri-apps/plugin-dialog').then(m =>
        m.open({
          directory: true,
          multiple: false,
          title: 'Selecione o diretório do Wine prefix',
        })
      );

      if (selected) {
        setWinePrefix(selected);
        toast.success('Diretório do Wine prefix selecionado!');
      }
    } catch (error) {
      console.error('Erro ao escolher diretório Wine:', error);
      toast.error('Erro ao selecionar diretório');
    }
  }, []);

  /**
   * Salva o Wine prefix manualmente e exibe feedback.
   */
  const saveWinePrefix = useCallback(() => {
    localStorage.setItem(WINE_PREFIX_KEY, winePrefix);
    setSaved(true);
    toast.success('Configuração do Wine salva!');
    setTimeout(() => setSaved(false), 3000);
  }, [winePrefix]);

  /**
   * Limpa o Wine prefix salvo.
   */
  const clearWinePrefix = useCallback(() => {
    setWinePrefix('');
    localStorage.removeItem(WINE_PREFIX_KEY);
    toast.info('Configuração do Wine removida.');
  }, []);

  return {
    winePrefix,
    setWinePrefix,
    saved,
    actions: {
      chooseWinePrefix,
      saveWinePrefix,
      clearWinePrefix,
    },
  };
}
