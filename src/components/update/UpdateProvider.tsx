import { PropsWithChildren } from 'react';

import { MajorUpdateModal } from '@/components/modals/MajorUpdateModal';
import { useAppUpdate } from '@/hooks/useAppUpdate';

export function UpdateProvider({ children }: PropsWithChildren) {
  const { isMajorOpen, closeMajorModal } = useAppUpdate();

  return (
    <>
      {children}
      <MajorUpdateModal open={isMajorOpen} onClose={closeMajorModal} />
    </>
  );
}
