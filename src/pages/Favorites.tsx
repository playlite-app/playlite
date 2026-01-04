import { useMemo } from "react";
import { Game, GameActions } from "../types";
import { Heart } from "lucide-react";
import { launchGame } from "../utils/launcher";
import { usePlaylist } from "../hooks/usePlaylist";
import StandardGameCard from "@/components/StandardGameCard";
import { ActionButton } from "@/components/ActionButton.tsx";
import { GameActionsMenu } from "@/components/GameActionsMenu";

interface FavoritesProps extends GameActions {
    games: Game[];
    searchTerm: string;
}

export default function Favorites({
    games,
    searchTerm,
    ...actions
}: FavoritesProps) {
    const { addToPlaylist, isInPlaylist } = usePlaylist(games);

    // Filtra os jogos favoritos com base no termo de busca
    const displayedGames = useMemo(() => {
        const favorites = games.filter((g) => g.favorite);
        if (!searchTerm) return favorites;
        const term = searchTerm.toLowerCase();
        return favorites.filter(
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
                <Heart className="w-16 h-16 mb-4 opacity-20" />
                {searchTerm
                    ? "Nenhum favorito encontrado com os critérios de busca."
                    : "Adicione alguns jogos à sua lista de favoritos!"}
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <div className="space-y-6">

                {/* Header dos Favoritos */}
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500">
                        <Heart size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Meus Favoritos</h1>
                        <p className="text-muted-foreground text-sm">
                            {displayedGames.length} jogo
                            {displayedGames.length === 1 ? "" : "s"} amado
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
                                subtitle={game.genre}
                                badge={game.platform}
                                rating={game.rating}
                                onClick={() => actions.onGameClick(game)}
                                onPlay={() => launchGame(game)}
                                actions={
                                    <>
                                        <ActionButton
                                            icon={Heart}
                                            variant={game.favorite ? "glass-destructive" : "glass"}
                                            tooltip="Remover dos Favoritos"
                                            onClick={() => actions.onToggleFavorite(game.id)}
                                        />

                                        {/* COMPONENTE REUTILIZADO */}
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
