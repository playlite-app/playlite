import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { getAppVersionInfo } from '../services/updaterService.ts';

export type UpdateType = 'none' | 'patch' | 'minor' | 'major';

// Helper para parsear versão semântica
function parseVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
} {
  const parts = version.split('.');

  return {
    major: parseInt(parts[0] || '0', 10),
    minor: parseInt(parts[1] || '0', 10),
    patch: parseInt(parts[2] || '0', 10),
  };
}

export function useAppUpdate() {
  const [updateType, setUpdateType] = useState<UpdateType>('none');
  const [isMajorOpen, setIsMajorOpen] = useState(false);

  useEffect(() => {
    async function checkUpdate() {
      try {
        const { currentVersion, previousVersion } = await getAppVersionInfo();

        if (!previousVersion) return;

        const current = parseVersion(currentVersion);
        const previous = parseVersion(previousVersion);

        if (current.major > previous.major) {
          setUpdateType('major');
          setIsMajorOpen(true);

          return;
        }

        if (current.minor > previous.minor) {
          setUpdateType('minor');
          toast.success(`Playlite atualizado para v${currentVersion}`);

          return;
        }

        if (current.patch > previous.patch) {
          setUpdateType('patch');
          toast(`Correções aplicadas (v${currentVersion})`, { icon: '🛠️' });
        }
      } catch (error) {
        console.error('Erro ao verificar atualização:', error);
      }
    }

    checkUpdate();
  }, []);

  return {
    updateType,
    isMajorOpen,
    closeMajorModal: () => setIsMajorOpen(false),
  };
}
