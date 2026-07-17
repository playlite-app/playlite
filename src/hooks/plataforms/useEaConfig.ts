import { useTranslation } from 'react-i18next';

import { usePlatformImportAction, usePlatformStatus } from '@/hooks';
import { platformsService } from '@/services/plataformsService';

/**
 * Hook para gerenciar a importação de jogos instalados via EA App.
 * EA não oferece um jeito viável de autenticar e listar a biblioteca completa.
 * A detecção depende inteiramente da pasta de instalação configurada pelo usuário.
 */
export function useEaConfig(onLibraryUpdate?: () => void) {
  const { t } = useTranslation('plataforms');
  const { status, setStatus } = usePlatformStatus();

  const { isImporting: isImportingEa, run: importEaGames } =
    usePlatformImportAction(() => platformsService.importEaGames(), {
      setStatus,
      onLibraryUpdate,
      loadingMessage: t('ea_importing_status'),
    });

  return {
    loading: {
      importingEa: isImportingEa,
    },
    status,
    actions: { importEaGames },
  };
}
