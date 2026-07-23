import { useTranslation } from 'react-i18next';

import {
  useLocalStoragePlatformPath,
  usePlatformImportAction,
  usePlatformStatus,
} from '@/hooks';
import { platformsService } from '@/services/plataformsService';

/**
 * Hook para gerenciar a importação de jogos via Heroic Games Launcher.
 * Aceita opcionalmente um `configPath` manual (útil quando a detecção
 * automática do diretório de configuração do Heroic falha).
 */
export function useHeroicConfig(onLibraryUpdate?: () => void) {
  const { t } = useTranslation('platforms');
  const { status, setStatus } = usePlatformStatus();
  const [configPath, setConfigPath] =
    useLocalStoragePlatformPath('heroic_config_path');

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
    configPath,
    setConfigPath,
    loading: { importingHeroic: isImportingHeroic },
    status,
    actions: { importHeroicGames },
  };
}
