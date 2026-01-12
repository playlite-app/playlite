import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Game, GameDetails, GamePlatformLink } from '@/types/game';

import { GameDescription } from './GameDescription';
import { GameHeader } from './GameHeader';
import { GameSidebar } from './GameSidebar';

interface GameDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | null;
  details: GameDetails | null;
  loading: boolean;
  siblings: GamePlatformLink[];
  onSwitchGame: (id: string) => void;
}

export default function GameDetailsModal({
  game,
  details,
  loading,
  siblings,
  isOpen,
  onClose,
  onSwitchGame,
}: GameDetailsModalProps) {
  if (!game) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background max-h-[92vh] max-w-[92vw] gap-0 overflow-hidden border-none p-0 shadow-2xl lg:max-w-7xl">
        {/* Componente de Cabeçalho */}
        <GameHeader game={game} onClose={onClose} />

        {/* Corpo - Grid de 2 colunas */}
        <div className="bg-background grid grid-cols-12 gap-0 overflow-hidden">
          {/* Coluna 1: Sidebar */}
          <div className="border-border bg-muted/5 custom-scrollbar col-span-5 max-h-[calc(92vh-8rem)] overflow-y-auto border-r lg:max-h-[calc(92vh-10rem)] xl:col-span-4">
            <GameSidebar
              game={game}
              details={details}
              siblings={siblings}
              onSwitchGame={onSwitchGame}
            />
          </div>

          {/* Coluna 2: Descrição */}
          <div className="bg-background custom-scrollbar col-span-7 max-h-[calc(92vh-8rem)] overflow-y-auto p-5 lg:max-h-[calc(92vh-10rem)] lg:p-8 xl:col-span-8 xl:p-10">
            <GameDescription details={details} loading={loading} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
