import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Clock,
  Gamepad2,
  Globe,
  Star,
  Trophy,
  Building2,
  Tag,
  X,
  ImageOff,
} from "lucide-react";
import { Game } from "../types";
import { useGameDetails } from "../hooks/useGameDetails";
import { cn } from "@/lib/utils";

interface GameDetailsModalProps {
  game: Game | null;
  isOpen: boolean;
  onClose: () => void;
  allGames: Game[];
  onSwitchGame: (id: string) => void;
}

export default function GameDetailsModal({
                                           game,
                                           isOpen,
                                           onClose,
                                           allGames,
                                           onSwitchGame,
                                         }: GameDetailsModalProps) {
  const { details, loading, siblings } = useGameDetails(game, allGames);

  if (!game) return null;

  return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[92vw] lg:max-w-7xl h-[92vh] p-0 border-none bg-background overflow-hidden shadow-2xl">

            {/* Header (Banner) - Cover, título, badges e close button */}
            <div className="relative shrink-0 h-32 lg:h-40 w-full bg-muted overflow-hidden">
              <button
                  onClick={onClose}
                  className="absolute right-3 top-3 lg:right-4 lg:top-4 z-50 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all"
              >
                <X size={16} />
              </button>
              {game.cover_url && (
                  <div
                      className="absolute inset-0 bg-cover bg-center blur-2xl opacity-50 scale-110"
                      style={{ backgroundImage: `url(${game.cover_url})` }}
                  />
              )}
              <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-background" />
              <div className="absolute bottom-0 left-0 w-full p-5 lg:p-8 flex items-end z-10">
                {game.cover_url ? (
                    <img
                        src={game.cover_url}
                        alt=""
                        className="w-14 h-20 lg:w-16 lg:h-24 object-cover rounded bg-muted shrink-0 mr-4"
                    />
                ) : (
                    <div className="w-14 h-20 lg:w-16 lg:h-24 bg-muted rounded flex items-center justify-center shrink-0">
                      <ImageOff className="w-6 h-6 opacity-50" />
                    </div>
                )}
                <div className="flex-1 space-y-2 lg:space-y-3">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-primary/20 backdrop-blur-md text-xs">
                      {game.platform || "PC"}
                    </Badge>
                    {game.rating && (
                        <div className="flex items-center gap-1 text-yellow-400 font-bold text-xs lg:text-sm bg-black/40 backdrop-blur-md px-2 py-1 lg:px-3 rounded-full border border-white/10">
                          <Star size={14} fill="currentColor" /> {game.rating}
                        </div>
                    )}
                  </div>
                  <h2 className="text-2xl lg:text-4xl xl:text-5xl font-black text-white drop-shadow-lg tracking-tight line-clamp-2 leading-tight">
                    {game.name}
                  </h2>
                </div>
              </div>
            </div>

          {/* Corpo - Grid de 2 colunas */}
          <div className="flex-1 overflow-hidden grid grid-cols-12 bg-background min-h-0">

            {/* Coluna 1: Sidebar de Informações */}
            <div className="col-span-5 xl:col-span-4 border-r border-border bg-muted/5 overflow-y-auto custom-scrollbar">
              <div className="p-5 lg:p-6 xl:p-8 space-y-5 lg:space-y-6">
                <div className="space-y-3">

                  {/* Seção 1: Dados */}
                  <h3 className="text-sm lg:text-base font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Trophy size={16} className="text-primary" /> Seus Dados
                  </h3>
                  {/* Layout responsivo: texto em telas pequenas, cards em grande */}
                  <div className="hidden xl:grid grid-cols-2 gap-3">
                    <div className="bg-card p-3 rounded-lg border shadow-sm">
                    <span className="text-xs text-muted-foreground block mb-1">
                      Tempo Jogado
                    </span>
                      <div className="flex items-center gap-1.5 font-mono font-semibold text-lg">
                        <Clock size={16} className="text-muted-foreground" />
                        {game.playtime}h
                      </div>
                    </div>
                    <div className="bg-card p-3 rounded-lg border shadow-sm">
                    <span className="text-xs text-muted-foreground block mb-1">
                      Status
                    </span>
                      <div className="flex items-center gap-1.5 font-medium text-sm">
                        <TrendingUp size={16} className="text-muted-foreground" />
                        {game.playtime === 0 ? "Nunca Jogado" : "Em Progresso"}
                      </div>
                    </div>
                  </div>
                  {/* Formato de texto para telas menores */}
                  <div className="xl:hidden space-y-2">
                    <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Clock size={16} /> Tempo Jogado
                    </span>
                      <span className="font-mono font-semibold text-sm">
                      {game.playtime}h
                    </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground flex items-center gap-2 text-sm">
                        <TrendingUp size={16} /> Status
                      </span>
                      <span className="font-medium text-sm flex items-center gap-1">
                        {game.playtime === 0 ? "Nunca Jogado" : "Em Progresso"}
                    </span>
                    </div>
                  </div>
                </div>

                {/* Seção 2: Detalhes */}
                <div className="space-y-2 lg:space-y-3">
                  <h3 className="text-sm lg:text-base font-bold text-muted-foreground uppercase tracking-wider">
                    Detalhes
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Gamepad2 size={16} /> Gênero
                      </span>
                      <span className="font-medium text-sm truncate max-w-[50%]">
                        {game.genre || "N/A"}
                      </span>
                    </div>
                    {details?.metacritic && (
                        <div className="flex justify-between py-2 border-b border-border/50 items-center">
                      <span className="text-muted-foreground text-sm flex items-center gap-2">
                       <Star size={16} /> Metascore
                      </span>
                          <Badge
                              variant="outline"
                              className={cn(
                                  "font-bold border-2 text-sm",
                                  details.metacritic >= 75
                                      ? "border-green-500/50 text-green-500"
                                      : details.metacritic >= 50
                                          ? "border-yellow-500/50 text-yellow-500"
                                          : "border-red-500/50 text-red-500"
                              )}
                          >
                            {details.metacritic}
                          </Badge>
                        </div>
                    )}
                    {details?.developers && details.developers.length > 0 && (
                        <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Building2 size={16} /> Dev
                      </span>
                          <span className="font-medium truncate max-w-[50%] text-right text-sm">
                        {details.developers[0].name}
                      </span>
                        </div>
                    )}
                  </div>
                </div>

                {/* Seção 3: Tags */}
                {details?.tags && details.tags.length > 0 && (
                    <div className="space-y-2 lg:space-y-3">
                      <h3 className="text-sm lg:text-base font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Tag size={16} /> Tags
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {details.tags.slice(0, 10).map((tag) => (
                            <Badge
                                key={tag.id}
                                variant="secondary"
                                className="font-normal bg-secondary/50 hover:bg-secondary text-xs"
                            >
                              {tag.name}
                            </Badge>
                        ))}
                      </div>
                    </div>
                )}

                {/* Seção 4: Links */}
                <div className="space-y-3 pt-2">
                  {siblings.length > 0 && (
                      <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">
                      Outras Versões:
                    </span>
                        <div className="flex flex-wrap gap-1.5">
                          {siblings.map((sib) => (
                              <Button
                                  key={sib.id}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onSwitchGame(sib.id)}
                                  className="h-8 text-xs"
                              >
                                {sib.platform}
                              </Button>
                          ))}
                        </div>
                      </div>
                  )}
                  {details?.website && (
                      <Button
                          variant="default"
                          className="w-full h-9 text-sm"
                          asChild
                      >
                        <a href={details.website} target="_blank" rel="noreferrer">
                          <Globe size={16} className="mr-2" /> Visitar Site Oficial
                        </a>
                      </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Coluna 2: Descrição dos jogos */}
            <div className="col-span-7 xl:col-span-8 bg-background p-5 lg:p-8 xl:p-10 overflow-y-auto custom-scrollbar">
              <div className="max-w-3xl mx-auto space-y-4 lg:space-y-6 pb-8">
                <h3 className="text-xl lg:text-2xl xl:text-3xl font-bold border-b pb-3 lg:pb-4 mb-4 lg:mb-6">
                  Sobre o Jogo
                </h3>
                {loading ? (
                    <div className="space-y-3 lg:space-y-4 animate-pulse opacity-50">
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="space-y-2 pt-6 lg:pt-8">
                        <div className="h-4 bg-muted rounded w-full" />
                        <div className="h-4 bg-muted rounded w-5/6" />
                      </div>
                    </div>
                ) : details ? (
                    <div className="text-sm lg:text-base xl:text-lg text-foreground/85 leading-relaxed whitespace-pre-line">
                      {details.description_raw ||
                          "Nenhuma descrição fornecida pelo desenvolvedor."}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 lg:py-20 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                      <p className="text-sm lg:text-base">
                        Não foi possível carregar a descrição online.
                      </p>
                      <Button
                          variant="link"
                          size="sm"
                          onClick={() => window.location.reload()}
                      >
                        Tentar novamente
                      </Button>
                    </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  );
}
