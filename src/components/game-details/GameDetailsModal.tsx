import { useEffect, useState } from 'react';

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
  details: initialDetails,
  loading,
  siblings,
  isOpen,
  onClose,
  onSwitchGame,
}: GameDetailsModalProps) {
  // Estado local para manter os detalhes atualizados se houver tradução
  const [currentDetails, setCurrentDetails] = useState<GameDetails | null>(
    initialDetails
  );

  // Sincroniza quando os props mudam (novo jogo selecionado)
  useEffect(() => {
    setCurrentDetails(initialDetails);
  }, [initialDetails]);

  if (!game) return null;

  // Função para atualizar a descrição localmente após tradução
  const handleDescriptionUpdate = (newPtBr: string) => {
    if (currentDetails) {
      setCurrentDetails({
        ...currentDetails,
        descriptionPtbr: newPtBr,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background max-h-[95vh] max-w-[95vw] gap-0 overflow-hidden rounded-xl border-none p-0 shadow-2xl lg:max-w-7xl">
        <GameHeader game={game} onClose={onClose} />

        {/* Layout Principal */}
        <div className="bg-background grid h-[calc(95vh-12rem)] grid-cols-1 gap-0 overflow-hidden md:h-[calc(90vh-8rem)] lg:grid-cols-12">
          {/* Coluna 1: Sidebar */}
          <div className="border-border bg-muted/5 custom-scrollbar overflow-y-auto border-r lg:col-span-4">
            <GameSidebar
              game={game}
              details={currentDetails}
              siblings={siblings}
              onSwitchGame={onSwitchGame}
            />
          </div>

          {/* Coluna 2: Conteúdo Principal */}
          <div className="bg-background custom-scrollbar overflow-y-auto p-6 lg:col-span-8 lg:p-10">
            <GameDescription
              gameId={game.id}
              details={currentDetails}
              loading={loading}
              onDescriptionUpdate={handleDescriptionUpdate}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
