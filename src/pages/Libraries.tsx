import StandardGameCard from "../components/StandardGameCard";
import { Game, GameActions } from "../types";
import { useMemo } from "react";
import {
  Heart,
  Library,
} from "lucide-react";
import { launchGame } from "../utils/launcher";
import { usePlaylist } from "../hooks/usePlaylist";
import { ActionButton } from "@/components/ActionButton.tsx";
import { GameActionsMenu } from "@/components/GameActionsMenu";

interface LibraryProps extends GameActions {
  games: Game[];
  searchTerm: string;
}

export default function Libraries({
  games,
  searchTerm,
  ...actions
}: LibraryProps) {
  const { addToPlaylist, isInPlaylist } = usePlaylist(games);

  // Filtra os jogos com base no termo de busca
  const displayedGames = useMemo(() => {
    if (!searchTerm) return games;
    const term = searchTerm.toLowerCase();
    return games.filter(
      (game) =>
        game.name.toLowerCase().includes(term) ||
        (game.genre && game.genre.toLowerCase().includes(term)) ||
        (game.platform && game.platform.toLowerCase().includes(term))
    );
  }, [games, searchTerm]);

  // Empty state
  if (displayedGames.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-lg">
        <Library className="w-16 h-16 mb-4 opacity-20" />
        {searchTerm
          ? "Nenhum jogo encontrado com os critérios de busca."
          : "Nenhum jogo na biblioteca. Adicione seu primeiro jogo!"}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
      <div className="space-y-6">

        {/* Header da Biblioteca */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
            <Library size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Minha Biblioteca</h1>
            <p className="text-muted-foreground text-sm">
              {displayedGames.length} jogo
              {displayedGames.length === 1 ? "" : "s"} encontrado
              {displayedGames.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* Grid de Jogos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {displayedGames.map((game) => (
            <div key={game.id} className="relative group">
              <StandardGameCard
                title={game.name}
                coverUrl={game.cover_url}
                subtitle={game.genre || "Sem gênero"}
                rating={game.rating || undefined}
                onClick={() => actions.onGameClick(game)}
                onPlay={() => launchGame(game)}
                actions={
                  <>
                    <ActionButton
                      icon={Heart}
                      variant={game.favorite ? "glass-destructive" : "glass"}
                      tooltip={game.favorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                      onClick={() => actions.onToggleFavorite(game.id)}
                    />

                    {/* SUBTITUIÇÃO DO BLOCO GIGANTE PELO COMPONENTE */}
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
          ))}
        </div>
      </div>
    </div>
  );
}
