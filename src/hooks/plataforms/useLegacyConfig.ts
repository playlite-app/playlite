import { useTranslation } from 'react-i18next';

import { platformsService } from '@/services/plataformsService';

import { useImportProgress } from './useImportProgress';
import { usePlatformImportAction } from './usePlatformImportAction';
import { usePlatformStatus } from './usePlatformStatus';

/**
 * Hook para gerenciar a importação de jogos da Legacy Games.
 * Aceita opcionalmente um `appStatePath` manual para o app-state.json,
 * usado quando a detecção automática (inclusive via Wine, no Linux) falha.
 */
export function useLegacyConfig(onLibraryUpdate?: () => void) {
  const { t } = useTranslation('plataforms');
  const { status, setStatus } = usePlatformStatus();
  const { progress } = useImportProgress();

  const { isImporting: isImportingLegacy, run: importLegacyGames } =
    usePlatformImportAction(
      (appStatePath?: string) =>
        platformsService.importLegacyGames(appStatePath),
      {
        setStatus,
        onLibraryUpdate,
        loadingMessage: t('legacy_importing_status'),
      }
    );

  return {
    loading: { importingLegacy: isImportingLegacy },
    status,
    progress,
    actions: { importLegacyGames },
  };
}
