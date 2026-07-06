import { useTranslation } from 'react-i18next';

import { platformsService } from '@/services/plataformsService';

import { useImportProgress } from './useImportProgress';
import { usePlatformImportAction } from './usePlatformImportAction';
import { usePlatformStatus } from './usePlatformStatus';

/**
 * Hook para gerenciar a importação de jogos via Heroic Games Launcher.
 * Aceita opcionalmente um `configPath` manual (útil quando a detecção
 * automática do diretório de configuração do Heroic falha).
 */
export function useHeroicConfig(onLibraryUpdate?: () => void) {
  const { t } = useTranslation('plataforms');
  const { status, setStatus } = usePlatformStatus();
  const { progress } = useImportProgress();

  const { isImporting: isImportingHeroic, run: importHeroicGames } =
    usePlatformImportAction(
      (configPath?: string) => platformsService.importHeroicGames(configPath),
      {
        setStatus,
        onLibraryUpdate,
        loadingMessage: t('heroic_importing_status'),
      }
    );

  return {
    loading: { importingHeroic: isImportingHeroic },
    status,
    progress,
    actions: { importHeroicGames },
  };
}
