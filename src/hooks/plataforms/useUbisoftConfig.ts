import { useTranslation } from 'react-i18next';

import { platformsService } from '@/services/plataformsService';

import { useImportProgress } from './useImportProgress';
import { usePlatformImportAction } from './usePlatformImportAction';
import { usePlatformStatus } from './usePlatformStatus';

/**
 * Hook para gerenciar a importação de jogos do Ubisoft Game Launcher.
 * Detecção automática via %LOCALAPPDATA%\Ubisoft Game Launcher.
 */
export function useUbisoftConfig(onLibraryUpdate?: () => void) {
  const { t } = useTranslation('plataforms');
  const { status, setStatus } = usePlatformStatus();
  const { progress } = useImportProgress();

  const { isImporting: isImportingUbisoft, run: importUbisoftGames } =
    usePlatformImportAction(() => platformsService.importUbisoftGames(), {
      setStatus,
      onLibraryUpdate,
      loadingMessage: t('ubisoft_importing_status'),
    });

  return {
    loading: { importingUbisoft: isImportingUbisoft },
    status,
    progress,
    actions: { importUbisoftGames },
  };
}
