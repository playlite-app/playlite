import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useNativePathPicker } from '@/hooks';
import { toast } from '@/utils/toast';

const WINE_PREFIX_KEY = 'wine_prefix';
const SAVED_BADGE_DURATION_MS = 3000;

/**
 * Hook para gerenciar a configuração do Wine prefix, persistida em
 * localStorage (mesmo padrão do `steamRoot`).
 */
export function useWineConfig() {
  const { t } = useTranslation('plataforms');

  const [winePrefix, setWinePrefix] = useState<string>(
    () => localStorage.getItem(WINE_PREFIX_KEY) || ''
  );
  const [saved, setSaved] = useState(false);

  // Persiste no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem(WINE_PREFIX_KEY, winePrefix);
  }, [winePrefix]);

  const { pick } = useNativePathPicker({
    directory: true,
    title: t('wine_select_prefix_title'),
    successMessage: t('wine_prefix_selected'),
    errorMessage: t('wine_prefix_select_error'),
  });

  /**
   * Abre diálogo nativo para selecionar o diretório do Wine prefix.
   */
  const chooseWinePrefix = useCallback(async () => {
    const selected = await pick();

    if (selected) setWinePrefix(selected);
  }, [pick]);

  /**
   * Salva o Wine prefix manualmente e exibe feedback temporário.
   */
  const saveWinePrefix = useCallback(() => {
    localStorage.setItem(WINE_PREFIX_KEY, winePrefix);
    setSaved(true);
    toast.success(t('wine_config_saved'));
    setTimeout(() => setSaved(false), SAVED_BADGE_DURATION_MS);
  }, [t, winePrefix]);

  /**
   * Limpa o Wine prefix salvo.
   */
  const clearWinePrefix = useCallback(() => {
    setWinePrefix('');
    localStorage.removeItem(WINE_PREFIX_KEY);
    toast.info(t('wine_config_removed'));
  }, [t]);

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
