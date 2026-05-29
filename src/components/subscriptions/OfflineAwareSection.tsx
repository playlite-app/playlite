import { ReactNode } from 'react';
import { useNetworkStatus } from '@/hooks/common/useNetworkStatus';

interface OfflineAwareSectionProps {
  enabled: boolean;
  children: ReactNode;
}

/**
 * Wrapper que renderiza conteúdo apenas quando online.
 * Previne que seções de assinaturas façam chamadas ao backend quando offline.
 */
export function OfflineAwareSection({
  enabled,
  children,
}: Readonly<OfflineAwareSectionProps>) {
  const isOnline = useNetworkStatus();

  if (!isOnline || !enabled) return null;

  return <>{children}</>;
}

