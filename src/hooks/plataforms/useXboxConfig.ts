import { useTranslation } from 'react-i18next';

import { usePlatformImportAction, usePlatformStatus } from '@/hooks';
import { platformsService } from '@/services/plataformsService';

/**
 * Hook para gerenciar a importação de jogos instalados via Xbox App / Microsoft Store
 * (Gaming Services). Detecção totalmente automática (via marcador `.GamingRoot` em
 * cada drive) — sem login e sem pasta a configurar.
 */
export function useXboxConfig(onLibraryUpdate?: () => void) {
  const { t } = useTranslation('platforms');
  const { status, setStatus } = usePlatformStatus();

  const { isImporting: isImportingXbox, run: importXboxGames } =
    usePlatformImportAction(() => platformsService.importXboxGames(), {
      setStatus,
      onLibraryUpdate,
      loadingMessage: t('xbox_importing_status'),
    });

  return {
    loading: {
      importingXbox: isImportingXbox,
    },
    status,
    actions: { importXboxGames },
  };
}
