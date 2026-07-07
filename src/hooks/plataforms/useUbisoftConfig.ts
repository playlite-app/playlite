import { useTranslation } from 'react-i18next';

import { usePlatformImportAction, usePlatformStatus } from '@/hooks';
import { platformsService } from '@/services/plataformsService';

/**
 * Hook para gerenciar a importação de jogos do Ubisoft Game Launcher.
 * Detecção automática via %LOCALAPPDATA%\Ubisoft Game Launcher.
 */
export function useUbisoftConfig(onLibraryUpdate?: () => void) {
  const { t } = useTranslation('plataforms');
  const { status, setStatus } = usePlatformStatus();

  const { isImporting: isImportingUbisoft, run: importUbisoftGames } =
    usePlatformImportAction(() => platformsService.importUbisoftGames(), {
      setStatus,
      onLibraryUpdate,
      loadingMessage: t('ubisoft_importing_status'),
    });

  return {
    loading: { importingUbisoft: isImportingUbisoft },
    status,
    actions: { importUbisoftGames },
  };
}
