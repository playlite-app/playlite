import { Gamepad2, PlusCircle, Sparkles } from "lucide-react";
import { Game, UserProfile } from "../types";
import { usePlaylist } from "../hooks/usePlaylist";
import { useRecommendation } from "../hooks/useRecommendation";
import PlaylistItem from "../components/PlaylistItem";
import StandardGameCard from "@/components/StandardGameCard";
import { Button } from "@/components/ui/button";
import { launchGame } from "../utils/launcher";
import { toast } from "sonner";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";

interface PlaylistProps {
  allGames: Game[];
  onGameClick: (game: Game) => void;
  profileCache: UserProfile | null;
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

  const { calculateAffinity } = useRecommendation({ profileCache });

  const suggestions = allGames
    .filter((g) => !isInPlaylist(g.id) && g.playtime < 60)
    .sort((a, b) => {
      const genresA = a.genre
        ? a.genre.split(",").map((n) => ({ name: n.trim() }))
        : [];
      const genresB = b.genre
        ? b.genre.split(",").map((n) => ({ name: n.trim() }))
        : [];
      return calculateAffinity(genresB) - calculateAffinity(genresA);
    })
    .slice(0, 10);

  const handleOnDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderPlaylist(result.source.index, result.destination.index);
  };

  return (
    <div className="flex flex-row h-full overflow-hidden bg-background">

      {/* Coluna esquerda: Fila (Playlist) */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border/50 bg-background/50 overflow-hidden">

        {/* Header da Playlist */}
        <div className="px-5 lg:px-8 pt-5 lg:pt-6 pb-3 lg:pb-4 shrink-0 border-b border-border/40">
          <div className="flex items-center gap-2.5 lg:gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Gamepad2 size={22} className="lg:w-6 lg:h-6" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold">Sua Playlist</h1>
              <p className="text-muted-foreground text-sm">
                Organize sua próxima aventura. {playlistGames.length} jogos na
                fila.
              </p>
            </div>
          </div>
        </div>

        {/* Lista de jogos com Drag and Drop */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 pt-3 lg:pt-4 pb-6 custom-scrollbar">
          {playlistGames.length > 0 ? (
            <DragDropContext onDragEnd={handleOnDragEnd}>
              <Droppable droppableId="playlist-queue">
                {(provided) => (
                  <div
                    className="space-y-2.5 lg:space-y-3 w-full pb-10"
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
                              zIndex: snapshot.isDragging ? 50 : "auto",
                            }}
                          >
                            <PlaylistItem
                              game={game}
                              index={index}
                              total={playlistGames.length}
                              onMoveUp={() => moveUp(index)}
                              onMoveDown={() => moveDown(index)}
                              onRemove={() => {
                                removeFromPlaylist(game.id);
                                toast.info(`${game.name} removido da fila.`);
                              }}
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
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-60">
              <Gamepad2 className="w-14 h-14 lg:w-16 lg:h-16 mb-3 lg:mb-4 opacity-20" />
              <p className="text-lg font-medium">Sua fila está vazia.</p>
              <p className="text-sm">
                Adicione jogos da biblioteca ou das sugestões.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Coluna direita: Sugestões */}
      <div className="w-72 md:w-80 lg:w-80 xl:w-96 2xl:w-120 shrink-0 bg-muted/10 flex flex-col border-l border-border backdrop-blur-sm overflow-hidden">

        {/* Header das sugestões */}
        <div className="p-5 lg:p-6 shrink-0 border-b border-border/40 bg-muted/20">
          <div className="flex items-center gap-2 mb-1 text-purple-500">
            <Sparkles size={19} className="fill-purple-500/20 lg:w-5 lg:h-5" />
            <h2 className="font-bold text-lg">Recomendados</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Baseado no seu perfil.
          </p>
        </div>

        {/* Área de Scroll das Sugestões */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-5 custom-scrollbar">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5 lg:gap-4">
            {suggestions.map((game) => (
              <div key={game.id} className="relative group">
                <StandardGameCard
                  title={game.name}
                  coverUrl={game.cover_url}
                  className="text-xs"
                  actions={
                    <Button
                      size="sm"
                      className="w-full h-8 gap-1 shadow-lg bg-white/90 text-black hover:bg-white"
                      onClick={(e) => {
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

          {suggestions.length === 0 && (
            <div className="text-center py-10 space-y-2">
              <p className="text-sm text-muted-foreground">
                Sem sugestões novas.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Recarregar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
