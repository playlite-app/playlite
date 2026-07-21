import { listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useState } from 'react';

import type { ImportProgressPayload } from './types';

/**
 * Escuta os eventos globais de progresso de importação emitidos pelo backend
 * (`import_progress` / `import_complete`). Esses eventos não são específicos
 * de nenhuma plataforma — qualquer importação em andamento (Steam, Epic,
 * Heroic, Ubisoft ou Legacy) emite o mesmo payload. Chamado uma única vez em
 * `PlatformsConfig.tsx`, no nível mais alto dajanela de configuração.
 * O valor de `progress` é repassado como prop para o componente da plataforma ativa.
 */
export function useImportProgress() {
  const [progress, setProgress] = useState<ImportProgressPayload | null>(null);

  const handleProgress = useCallback(
    (event: { payload: ImportProgressPayload }) => {
      setProgress(event.payload);
    },
    []
  );

  const handleComplete = useCallback(() => {
    setProgress(null);
  }, []);

  useEffect(() => {
    let unlistenProgress: (() => void) | null = null;
    let unlistenComplete: (() => void) | null = null;

    const registerListeners = async () => {
      unlistenProgress = await listen('import_progress', handleProgress);
      unlistenComplete = await listen('import_complete', handleComplete);
    };

    void registerListeners();

    return () => {
      unlistenProgress?.();
      unlistenComplete?.();
    };
  }, [handleComplete, handleProgress]);

  return { progress };
}
