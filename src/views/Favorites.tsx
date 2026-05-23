import { Heart } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import StandardGameCard from '@/components/cards/StandardGameCard';
import { ActionButton, GameActionsMenu } from '@/components/common';
import { useLibraryFilter, usePlaylist } from '@/hooks';
import { Game, GameActions } from '@/types';
import { toast } from '@/utils/toast';

import { launchGame } from '../utils/launcher';

interface FavoritesProps extends GameActions {
  games: Game[];
  searchTerm: string;
  hideAdult?: boolean;
  hideDuplicates?: boolean;
}

export default function Favorites({
  games,
  searchTerm,
  hideAdult,
  hideDuplicates,
  ...actions
}: Readonly<FavoritesProps>) {
  const { t } = useTranslation('library');
  const { addToPlaylist, isInPlaylist } = usePlaylist(games);

  // Handler para adicionar à playlist com notificação
  const handleAddToPlaylist = (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    addToPlaylist(gameId);

    if (game) {
      toast.success(t('game_added_to_playlist', { name: game.name }));
    }
  };

  // Primeiro filtra apenas favoritos, depois aplica o hook de filtro
  const favoriteGames = useMemo(() => games.filter(g => g.favorite), [games]);
  const displayedGames = useLibraryFilter({
    games: favoriteGames,
    searchTerm,
    hideAdult,
    hideDuplicates,
  });

  // Empty state
  if (displayedGames.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center text-lg">
        <Heart className="mb-4 h-16 w-16 opacity-20" />
        {searchTerm
          ? t('no_favorites_found_search')
          : t('add_games_to_favorites')}
      </div>
    );
  }

  return (
    <div className="custom-scrollbar flex-1 overflow-y-auto p-8">
      <div className="space-y-6">
        {/* Header dos Favoritos */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
            <Heart size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('my_favorites_title')}</h1>
            <p className="text-muted-foreground text-sm">
              {displayedGames.length}{' '}
              {displayedGames.length === 1
                ? t('game_singular')
                : t('games_plural')}{' '}
              {displayedGames.length === 1
                ? t('loved_singular')
                : t('loved_plural')}
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
                .join(' • ') || t('no_data_fallback');

            return (
              <div key={game.id} className="group relative">
                <StandardGameCard
                  id={game.id.toString()}
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
                        tooltip={t('remove_from_favorites_tooltip')}
                        onClick={() => actions.onToggleFavorite(game.id)}
                      />
                      <GameActionsMenu
                        game={game}
                        inPlaylist={isInPlaylist(game.id)}
                        onAddToPlaylist={handleAddToPlaylist}
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
