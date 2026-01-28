import { Heart } from 'lucide-react';
import { useMemo } from 'react';

import { ActionButton } from '@/components/ActionButton.tsx';
import { GameActionsMenu } from '@/components/GameActionsMenu';
import StandardGameCard from '@/components/StandardGameCard';
import { Game, GameActions } from '@/types';

import {
  useGameCardSubtitle,
  useLibraryFilter,
} from '../hooks/useLibraryFilters';
import { usePlaylist } from '../hooks/usePlaylist';
import { launchGame } from '../utils/launcher';

interface FavoritesProps extends GameActions {
  games: Game[];
  searchTerm: string;
  hideAdult?: boolean;
}

export default function Favorites({
  games,
  searchTerm,
  hideAdult,
  ...actions
}: FavoritesProps) {
  const { addToPlaylist, isInPlaylist } = usePlaylist(games);

  // Primeiro filtra apenas favoritos, depois aplica o hook de filtro
  const favoriteGames = useMemo(() => games.filter(g => g.favorite), [games]);
  const displayedGames = useLibraryFilter({
    games: favoriteGames,
    searchTerm,
    hideAdult,
  });

  // Empty state
  if (displayedGames.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center text-lg">
        <Heart className="mb-4 h-16 w-16 opacity-20" />
        {searchTerm
          ? 'Nenhum favorito encontrado com os critérios de busca.'
          : 'Adicione alguns jogos à sua lista de favoritos!'}
      </div>
    );
  }

  return (
    <div className="custom-scrollbar flex-1 overflow-y-auto p-8">
      <div className="space-y-6">
        {/* Header dos Favoritos */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-pink-500/10 p-2 text-pink-500">
            <Heart size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Meus Favoritos</h1>
            <p className="text-muted-foreground text-sm">
              {displayedGames.length} jogo
              {displayedGames.length === 1 ? '' : 's'} amado
              {displayedGames.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* Grid de Jogos */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {displayedGames.map(game => {
            const subtitle = useGameCardSubtitle(game.genres, game.developer);

            return (
              <div key={game.id} className="group relative">
                <StandardGameCard
                  title={game.name}
                  coverUrl={game.coverUrl}
                  subtitle={subtitle}
                  platform={game.platform}
                  rating={game.userRating}
                  onClick={() => actions.onGameClick(game)}
                  onPlay={() => launchGame(game)}
                  actions={
                    <>
                      <ActionButton
                        icon={Heart}
                        variant={game.favorite ? 'glass-destructive' : 'glass'}
                        tooltip="Remover dos Favoritos"
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
