import { PropsWithChildren } from 'react';

import { MajorUpdate } from '@/components/dialogs/MajorUpdate.tsx';
import { useAppUpdate } from '@/hooks/useAppUpdate.ts';

export function UpdateProvider({ children }: PropsWithChildren) {
  const { isMajorOpen, closeMajorModal } = useAppUpdate();

  return (
    <>
      {children}
      <MajorUpdate open={isMajorOpen} onClose={closeMajorModal} />
    </>
  );
}
