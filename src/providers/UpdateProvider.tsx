import { PropsWithChildren } from 'react';

import { MajorUpdateModal } from '@/components/modals/MajorUpdateModal.tsx';
import { useAppUpdate } from '@/hooks/useAppUpdate.ts';

export function UpdateProvider({ children }: PropsWithChildren) {
  const { isMajorOpen, closeMajorModal } = useAppUpdate();

  return (
    <>
      {children}
      <MajorUpdateModal open={isMajorOpen} onClose={closeMajorModal} />
    </>
  );
}
