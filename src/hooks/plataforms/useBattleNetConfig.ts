import { useTranslation } from 'react-i18next';

import { usePlatformImportAction, usePlatformStatus } from '@/hooks';
import { platformsService } from '@/services/plataformsService';

/**
 * Hook para gerenciar a importação de jogos instalados via Battle.net.
 * Detecção 100% automática (lê `product.db` do Battle.net Agent);
 * não há OAuth nem caminho manual configurável — Windows apenas.
 */
export function useBattleNetConfig(onLibraryUpdate?: () => void) {
  const { t } = useTranslation('plataforms');
  const { status, setStatus } = usePlatformStatus();

  const { isImporting: isImportingBattleNet, run: importBattleNetGames } =
    usePlatformImportAction(() => platformsService.importBattleNetGames(), {
      setStatus,
      onLibraryUpdate,
      loadingMessage: t('battlenet_importing_status'),
    });

  return {
    loading: { importingBattleNet: isImportingBattleNet },
    status,
    actions: { importBattleNetGames },
  };
}
