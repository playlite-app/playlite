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
      <DialogContent className="bg-background max-h-[95vh] max-w-[95vw] gap-0 overflow-hidden rounded-xl border-none p-0 shadow-2xl lg:max-w-7xl">
        <GameHeader game={game} onClose={onClose} />

        {/* MUDANÇA AQUI: Grid ajustado para dar mais espaço à sidebar */}
        <div className="bg-background grid h-[calc(95vh-12rem)] grid-cols-1 gap-0 overflow-hidden md:h-[calc(90vh-8rem)] lg:grid-cols-12">
          {/* Sidebar agora ocupa 4 colunas (33%) em telas grandes, antes era 3 */}
          <div className="border-border bg-muted/5 custom-scrollbar overflow-y-auto border-r lg:col-span-4">
            <GameSidebar
              game={game}
              details={details}
              siblings={siblings}
              onSwitchGame={onSwitchGame}
            />
          </div>

          {/* Conteúdo ocupa 8 colunas (66%) */}
          <div className="bg-background custom-scrollbar overflow-y-auto p-6 lg:col-span-8 lg:p-10">
            <GameDescription details={details} loading={loading} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
