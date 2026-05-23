import { Heart, Library } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ActionButton, GameActionsMenu } from '@/components/common';
import { useLibraryFilter, usePlaylist } from '@/hooks';
import { Game, GameActions } from '@/types/game';
import { toast } from '@/utils/toast';

import StandardGameCard from '../components/cards/StandardGameCard';
import { launchGame } from '../utils/launcher';

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

  // Handler para adicionar à playlist com notificação
  const handleAddToPlaylist = (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    addToPlaylist(gameId);

    if (game) {
      toast.success(t('game_added_to_playlist', { name: game.name }));
    }
  };

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
                            ? t('remove_from_favorites_tooltip')
                            : t('add_to_favorites_tooltip')
                        }
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
