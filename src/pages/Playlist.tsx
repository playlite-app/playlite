import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from '@hello-pangea/dnd';
import { Gamepad2, PlusCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import StandardGameCard from '@/components/StandardGameCard';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/providers/ConfirmProvider';
import { Game, UserPreferenceVector } from '@/types';

import PlaylistItem from '../components/PlaylistItem';
import { usePlaylist } from '../hooks/usePlaylist';
import { useRecommendation } from '../hooks/useRecommendation';
import { launchGame } from '../utils/launcher';
import { getFavoriteSeries } from '../utils/recommendation.ts';

interface PlaylistProps {
  allGames: Game[];
  onGameClick: (game: Game) => void;
  profileCache: UserPreferenceVector | null;
}

export default function Playlist({
  allGames,
  onGameClick,
  profileCache,
}: PlaylistProps) {
  const {
    playlistGames,
    addToPlaylist,
    removeFromPlaylist,
    moveUp,
    moveDown,
    isInPlaylist,
    reorderPlaylist,
  } = usePlaylist(allGames);

  const { confirm } = useConfirm();

  // Usa o hook para pegar as recomendações DO BACKEND e o perfil
  const { hybridRecs, profile } = useRecommendation({
    profileCache,
    allGames,
    enableHybrid: true, // Ativa o novo comando
    enableContentBased: false, // Desliga os outros para economizar processamento nesta tela
    enableCollaborative: false,
    hybridParams: {
      minPlaytime: 0,
      maxPlaytime: 600, // Sugere jogos com até 10h (foco em terminar ou começar)
      limit: 20,
    },
  });

  const handleRemoveFromPlaylist = async (game: Game) => {
    const confirmed = await confirm({
      title: 'Remover da Playlist',
      description: `Deseja remover ${game.name} da sua fila de jogos?`,
      confirmText: 'Remover',
      cancelText: 'Cancelar',
    });

    if (confirmed) {
      removeFromPlaylist(game.id);
      toast.info(`${game.name} removido da fila.`);
    }
  };

  // Sugestões: Filtra os jogos já na playlist e limita a 10 sugestões
  const suggestions = hybridRecs.filter(g => !isInPlaylist(g.id)).slice(0, 10);

  // Séries favoritas: Usa o utilitário
  const favoriteSeries = getFavoriteSeries(profile);

  const handleOnDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    reorderPlaylist(result.source.index, result.destination.index);
  };

  return (
    <div className="bg-background flex h-full flex-row overflow-hidden">
      <div className="border-border/50 bg-background/50 flex min-w-0 flex-1 flex-col overflow-hidden border-r">
        <div className="border-border/40 shrink-0 border-b px-5 pt-5 pb-3 lg:px-8 lg:pt-6 lg:pb-4">
          <div className="mb-2 flex items-center gap-2.5 lg:gap-3">
            <div className="bg-primary/10 text-primary rounded-lg p-2">
              <Gamepad2 size={22} className="lg:h-6 lg:w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold lg:text-2xl">Sua Playlist</h1>
              <p className="text-muted-foreground text-sm">
                Organize sua próxima aventura. {playlistGames.length} jogos na
                fila.
              </p>
            </div>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto px-4 pt-3 pb-6 lg:px-6 lg:pt-4">
          {playlistGames.length > 0 ? (
            <DragDropContext onDragEnd={handleOnDragEnd}>
              <Droppable droppableId="playlist-queue">
                {provided => (
                  <div
                    className="w-full space-y-2.5 pb-10 lg:space-y-3"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {playlistGames.map((game, index) => (
                      <Draggable
                        key={game.id}
                        draggableId={game.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.8 : 1,
                              zIndex: snapshot.isDragging ? 50 : 'auto',
                            }}
                          >
                            <PlaylistItem
                              game={game}
                              index={index}
                              total={playlistGames.length}
                              onMoveUp={() => moveUp(index)}
                              onMoveDown={() => moveDown(index)}
                              onRemove={() => handleRemoveFromPlaylist(game)}
                              onPlay={() => launchGame(game)}
                              onClick={() => onGameClick(game)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center opacity-60">
              <Gamepad2 className="mb-3 h-14 w-14 opacity-20 lg:mb-4 lg:h-16 lg:w-16" />
              <p className="text-lg font-medium">Sua fila está vazia.</p>
              <p className="text-sm">
                Adicione jogos da biblioteca ou das sugestões.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Coluna direita: Sugestões */}
      <div className="bg-muted/10 border-border flex w-72 shrink-0 flex-col overflow-hidden border-l backdrop-blur-sm md:w-80 lg:w-80 xl:w-96 2xl:w-120">
        <div className="border-border/40 bg-muted/20 shrink-0 border-b p-5 lg:p-6">
          <div className="mb-1 flex items-center gap-2 text-purple-500">
            {/* Ícone duplo para representar Híbrido */}
            <div className="flex">
              <Sparkles
                size={19}
                className="fill-purple-500/20 lg:h-5 lg:w-5"
              />
            </div>
            <h2 className="text-lg font-bold">Sugestões Inteligentes</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Combinação do seu perfil + comunidade.
          </p>
        </div>
        {/* Séries favoritas */}
        <div className="custom-scrollbar flex-1 overflow-y-auto p-4 lg:p-5">
          {favoriteSeries.length > 0 && (
            <div className="mb-4 rounded-lg bg-purple-500/10 p-3">
              <h3 className="mb-2 text-xs font-bold text-purple-400">
                Suas Séries Favoritas
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {favoriteSeries.map(name => (
                  <span
                    key={name}
                    className="rounded bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Lista de Sugestões */}
          <div className="grid grid-cols-1 gap-3.5 lg:gap-4 xl:grid-cols-2">
            {suggestions.map(game => (
              <div key={game.id} className="group relative">
                <StandardGameCard
                  title={game.name}
                  coverUrl={game.coverUrl}
                  className="text-xs"
                  // Badge opcional para score híbrido alto
                  badge={
                    (game as any).matchScore > 0.8 ? (
                      <span className="rounded border border-purple-500/20 bg-purple-500/10 px-1 text-[10px] font-bold text-purple-400">
                        Best Match
                      </span>
                    ) : undefined
                  }
                  actions={
                    <Button
                      size="sm"
                      className="h-8 w-full gap-1 bg-white/90 text-black shadow-lg hover:bg-white"
                      onClick={e => {
                        e.stopPropagation();
                        addToPlaylist(game.id);
                        toast.success(`${game.name} na fila!`);
                      }}
                      title="Adicionar à fila"
                    >
                      <PlusCircle size={14} />
                      <span className="text-xs font-bold">Add</span>
                    </Button>
                  }
                  onClick={() => onGameClick(game)}
                />
              </div>
            ))}
          </div>
          {/* Empty State */}
          {suggestions.length === 0 && (
            <div className="space-y-2 py-10 text-center">
              <p className="text-muted-foreground text-sm">
                Sem sugestões novas no momento.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
