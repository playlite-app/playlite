import { useCallback, useState } from 'react';

import { parsePlatformError } from '@/errors/errorMessages';
import { toast } from '@/utils/toast';

import type { ImportStatus } from './types';

interface UsePlatformImportActionOptions {
  setStatus: (status: ImportStatus) => void;
  onLibraryUpdate?: () => void;
  /** Mensagem exibida em `status` enquanto a importação está em andamento. */
  loadingMessage: string;
}

/**
 * Encapsula o fluxo repetitivo de uma ação de importação de plataforma:
 * seta loading, atualiza status, dispara toast de sucesso/erro, notifica a
 * biblioteca e garante que o loading volte a `false` no final.
 *
 * Esse padrão estava duplicado manualmente 5 vezes no antigo
 * `useStoresConfig` (uma cópia por plataforma). Cada hook de plataforma
 * (useSteamConfig, useEpicConfig, ...) usa este hook internamente, passando
 * a função de importação real do service correspondente.
 *
 * `Args` permite plataformas cuja importação aceita parâmetros opcionais,
 * como o `configPath` do Heroic ou o `appStatePath` do Legacy Games.
 */
export function usePlatformImportAction<Args extends unknown[] = []>(
  importFn: (...args: Args) => Promise<string>,
  { setStatus, onLibraryUpdate, loadingMessage }: UsePlatformImportActionOptions
) {
  const [isImporting, setIsImporting] = useState(false);

  const run = useCallback(
    async (...args: Args) => {
      setIsImporting(true);
      setStatus({ type: null, message: loadingMessage });

      try {
        const msg = await importFn(...args);
        setStatus({ type: 'success', message: msg });
        toast.success(msg);
        onLibraryUpdate?.();
      } catch (e) {
        const errorMsg = parsePlatformError(e);
        setStatus({ type: 'error', message: errorMsg });
        toast.error(errorMsg);
      } finally {
        setIsImporting(false);
      }
    },
    // setStatus vem de useState/wrapper e é estável entre renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [importFn, loadingMessage, onLibraryUpdate]
  );

  return { isImporting, run };
}
