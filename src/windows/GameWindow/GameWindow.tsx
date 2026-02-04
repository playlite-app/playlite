import { useEffect, useState } from 'react';

import { GameEditForm } from '@/components/dialogs';
import { Game, GameDetails, GamePlatformLink } from '@/types/game.ts';
import { Dialog, DialogContent } from '@/ui/dialog.tsx';

import { GameDescription } from './GameDescription.tsx';
import { GameHeader } from './GameHeader.tsx';
import { GameSidebar } from './GameSidebar.tsx';

interface GameDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | null;
  details: GameDetails | null;
  loading: boolean;
  siblings: GamePlatformLink[];
  onSwitchGame: (id: string) => void;
  onRefresh?: () => void;
}

export default function GameWindow({
  game,
  details: initialDetails,
  siblings,
  isOpen,
  onClose,
  onSwitchGame,
  onRefresh,
  loading,
}: GameDetailsModalProps) {
  // Estado local para manter os detalhes atualizados se houver tradução
  const [currentDetails, setCurrentDetails] = useState<GameDetails | null>(
    initialDetails
  );
  const [isEditing, setIsEditing] = useState(false);

  // Sincroniza quando os props mudam (novo jogo selecionado)
  useEffect(() => {
    setCurrentDetails(initialDetails);
    setIsEditing(false);
  }, [initialDetails, game]);

  if (!game) return null;

  const handleEditSuccess = () => {
    setIsEditing(false);

    if (onRefresh) onRefresh(); // Recarrega os dados do banco
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) setIsEditing(false);

        onClose();
      }}
    >
      <DialogContent className="bg-background max-h-[95vh] max-w-[95vw] gap-0 overflow-hidden rounded-xl border-none p-0 shadow-2xl lg:max-w-7xl">
        {/* Header com Botão de Editar */}
        <GameHeader
          game={game}
          onClose={onClose}
          isEditing={isEditing}
          onEditToggle={() => setIsEditing(!isEditing)}
        />

        {/* Layout Principal */}
        <div className="bg-background grid h-[calc(95vh-10rem)] grid-cols-1 gap-0 overflow-hidden md:h-[calc(90vh-10rem)] lg:grid-cols-12">
          {/* Coluna 1: Sidebar (Escondida em modo edição para dar espaço ao form) */}
          {!isEditing && (
            <div className="border-border bg-muted/5 custom-scrollbar overflow-y-auto border-r lg:col-span-4">
              <GameSidebar
                game={game}
                details={currentDetails}
                siblings={siblings}
                onSwitchGame={onSwitchGame}
              />
            </div>
          )}

          {/* Coluna 2: Conteúdo Principal (Expandido em modo edição) */}
          <div
            className={`bg-background custom-scrollbar overflow-y-auto p-6 lg:p-10 ${isEditing ? 'lg:col-span-12' : 'lg:col-span-8'}`}
          >
            {/* Lógicaa de troca: view e edit */}
            {isEditing && currentDetails ? (
              <GameEditForm
                gameId={game.id}
                details={currentDetails}
                onCancel={() => setIsEditing(false)}
                onSuccess={handleEditSuccess}
              />
            ) : (
              <GameDescription
                gameId={game.id}
                details={currentDetails}
                loading={loading}
                onDescriptionUpdate={translated =>
                  setCurrentDetails(prev =>
                    prev ? { ...prev, descriptionPtbr: translated } : null
                  )
                }
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
