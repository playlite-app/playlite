import { Library } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { LibraryGameCard } from '@/components/cards';
import { useLibraryFilter, usePlaylist } from '@/hooks';
import { Game, GameActions } from '@/types/game';
import { toast } from '@/utils/toast';

interface LibraryProps extends GameActions {
  games: Game[];
  searchTerm: string;
  hideAdult?: boolean;
  hideDuplicates?: boolean;
}

export default function Libraries({
  games,
  searchTerm,
  hideAdult,
  hideDuplicates,
  ...actions
}: Readonly<LibraryProps>) {
  const { t } = useTranslation('library');
  const { addToPlaylist, isInPlaylist } = usePlaylist(games);

  const gamesRef = useRef(games);
  useEffect(() => {
    gamesRef.current = games;
  }, [games]);

  const handleAddToPlaylist = useCallback(
    (gameId: string) => {
      const game = gamesRef.current.find(g => g.id === gameId);
      addToPlaylist(gameId);

      if (game) {
        toast.success(t('game_added_to_playlist', { name: game.name }));
      }
    },
    [addToPlaylist, t]
  );

  // Usa hook para filtrar jogos (busca + filtro adulto)
  const displayedGames = useLibraryFilter({
    games,
    searchTerm,
    hideAdult,
    hideDuplicates,
  });

  // Empty state
  if (displayedGames.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center text-lg">
        <Library className="mb-4 h-16 w-16 opacity-20" />
        {searchTerm ? t('no_games_found_search') : t('no_games_in_library')}
      </div>
    );
  }

  return (
    <div className="custom-scrollbar flex-1 overflow-y-auto p-8">
      <div className="space-y-6">
        {/* Header da Biblioteca */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
            <Library size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('my_library_title')}</h1>
            <p className="text-muted-foreground text-sm">
              {displayedGames.length}{' '}
              {displayedGames.length === 1
                ? t('game_singular')
                : t('games_plural')}{' '}
              {displayedGames.length === 1
                ? t('found_singular')
                : t('found_plural')}
            </p>
          </div>
        </div>

        {/* Grid de Jogos */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {displayedGames.map(game => (
            <LibraryGameCard
              key={game.id}
              game={game}
              onGameClick={actions.onGameClick}
              onToggleFavorite={actions.onToggleFavorite}
              onAddToPlaylist={handleAddToPlaylist}
              onEditGame={actions.onEditGame}
              onDeleteGame={actions.onDeleteGame}
              isInPlaylist={isInPlaylist}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
