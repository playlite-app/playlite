import { useTranslation } from 'react-i18next';

import {
  useImportProgress,
  usePlatformImportAction,
  usePlatformStatus,
} from '@/hooks';
import { platformsService } from '@/services/plataformsService';

/**
 * Hook para gerenciar a importação de jogos da Epic Games Store.
 * A detecção é automática (via manifests), não há credenciais a configurar.
 */
export function useEpicConfig(onLibraryUpdate?: () => void) {
  const { t } = useTranslation('plataforms');
  const { status, setStatus } = usePlatformStatus();
  const { progress } = useImportProgress();

  const { isImporting: isImportingEpic, run: importEpicGames } =
    usePlatformImportAction(() => platformsService.importEpicGames(), {
      setStatus,
      onLibraryUpdate,
      loadingMessage: t('epic_importing_status'),
    });

  return {
    loading: { importingEpic: isImportingEpic },
    status,
    progress,
    actions: { importEpicGames },
  };
}
