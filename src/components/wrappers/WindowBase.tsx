import React from 'react';

import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/ui/dialog';

interface WindowBaseProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  maxWidth?: '7xl' | '5xl' | 'full';
}

export function WindowBase({
  isOpen,
  onClose,
  children,
  className,
  maxWidth = '7xl',
}: WindowBaseProps) {
  const maxWidthClass = {
    '7xl': 'lg:max-w-7xl',
    '5xl': 'lg:max-w-5xl',
    full: 'max-w-[95vw]',
  }[maxWidth];

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent
        className={cn(
          'bg-background flex h-[95vh] w-[95vw] flex-col gap-0 overflow-hidden rounded-xl border-none p-0 shadow-2xl',
          maxWidthClass,
          className
        )}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}
