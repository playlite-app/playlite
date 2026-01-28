import { Heart, Library } from 'lucide-react';

import { ActionButton, GameActionsMenu } from '@/components/common';
import { useLibraryFilter, usePlaylist } from '@/hooks';
import { Game, GameActions } from '@/types/game';

import StandardGameCard from '../components/cards/StandardGameCard';
import { launchGame } from '../utils/launcher';

interface LibraryProps extends GameActions {
  games: Game[];
  searchTerm: string;
  hideAdult?: boolean;
}

export default function Libraries({
  games,
  searchTerm,
  hideAdult,
  ...actions
}: LibraryProps) {
  const { addToPlaylist, isInPlaylist } = usePlaylist(games);

  // Usa hook para filtrar jogos (busca + filtro adulto)
  const displayedGames = useLibraryFilter({ games, searchTerm, hideAdult });

  // Empty state
  if (displayedGames.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center text-lg">
        <Library className="mb-4 h-16 w-16 opacity-20" />
        {searchTerm
          ? 'Nenhum jogo encontrado com os critérios de busca.'
          : 'Nenhum jogo na biblioteca. Adicione seu primeiro jogo!'}
      </div>
    );
  }

  return (
    <div className="custom-scrollbar flex-1 overflow-y-auto p-8">
      <div className="space-y-6">
        {/* Header da Biblioteca */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500">
            <Library size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Minha Biblioteca</h1>
            <p className="text-muted-foreground text-sm">
              {displayedGames.length} jogo
              {displayedGames.length === 1 ? '' : 's'} encontrado
              {displayedGames.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* Grid de Jogos */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {displayedGames.map(game => {
            // Lógica inline para subtítulo (não pode ser hook dentro do map)
            const subtitle =
              [game.genres?.split(',')[0]?.trim(), game.developer]
                .filter(Boolean)
                .join(' • ') || 'Sem dados';

            return (
              <div key={game.id} className="group relative">
                <StandardGameCard
                  title={game.name}
                  coverUrl={game.coverUrl}
                  platform={game.platform}
                  subtitle={subtitle}
                  rating={game.userRating || undefined}
                  onClick={() => actions.onGameClick(game)}
                  onPlay={() => launchGame(game)}
                  actions={
                    <>
                      <ActionButton
                        icon={Heart}
                        variant={game.favorite ? 'glass-destructive' : 'glass'}
                        tooltip={
                          game.favorite
                            ? 'Remover dos Favoritos'
                            : 'Adicionar aos Favoritos'
                        }
                        onClick={() => actions.onToggleFavorite(game.id)}
                      />
                      <GameActionsMenu
                        game={game}
                        inPlaylist={isInPlaylist(game.id)}
                        onAddToPlaylist={addToPlaylist}
                        onEdit={actions.onEditGame}
                        onDelete={actions.onDeleteGame}
                      />
                    </>
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
