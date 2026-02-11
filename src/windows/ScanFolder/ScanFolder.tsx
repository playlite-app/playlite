import { Scan } from 'lucide-react';

import { WindowBase } from '@/components/wrappers/WindowBase';
import { DialogDescription, DialogHeader, DialogTitle } from '@/ui/dialog';
import { GameScanner } from '@/windows/ScanFolder/GameScanner.tsx';

export function ScanFolder({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <WindowBase isOpen={open} onClose={onClose} maxWidth="7xl">
      <DialogHeader className="border-b p-8 pb-8">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-3">
            <Scan className="text-primary h-6 w-6" />
          </div>
          <div>
            <DialogTitle className="text-2xl font-bold tracking-tight">
              Scanner de Importação
            </DialogTitle>
            <DialogDescription>
              O Playlite analisará executáveis e metadados para identificar seus
              jogos.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {/* Conteúdo com scroll unificado e paddings de Window Desktop */}
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-8 pt-6">
        <GameScanner />
      </div>
    </WindowBase>
  );
}
