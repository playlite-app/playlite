import { PropsWithChildren } from 'react';

import { MajorUpdate } from '@/dialogs/MajorUpdate';
import { useUpdateChecker } from '@/hooks/update';
import { useAppUpdate } from '@/hooks/update/useAppUpdate.ts';

/**
 * Provider que gerencia atualizações da aplicação.
 *
 * - Executa verificação automática de updates via useUpdateChecker
 * - Renderiza modal de Major Update quando há mudanças significativas
 * - Deve ser colocado no topo da árvore de componentes
 */
export function UpdateProvider({ children }: PropsWithChildren) {
  const { isMajorOpen, closeMajorModal } = useAppUpdate();
  const { currentVersion, previousVersion } = useUpdateChecker();

  return (
    <>
      {children}
      <MajorUpdate
        open={isMajorOpen}
        onClose={closeMajorModal}
        currentVersion={currentVersion}
        previousVersion={previousVersion}
      />
    </>
  );
}
