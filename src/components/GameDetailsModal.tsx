import {
  Building2,
  Clock,
  Gamepad2,
  Globe,
  ImageOff,
  Star,
  Tag,
  TrendingUp,
  Trophy,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Game } from '@/types';

import { useGameDetails } from '../hooks/useGameDetails';

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
      <DialogContent className="bg-background max-h-[92vh] max-w-[92vw] gap-0 overflow-hidden border-none p-0 shadow-2xl lg:max-w-7xl">
        {/* Header (Banner) - Cover, título, badges e close button */}
        <div className="bg-muted relative h-32 w-full shrink-0 overflow-hidden lg:h-40">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-50 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/80 lg:top-4 lg:right-4"
          >
            <X size={16} />
          </button>
          {game.cover_url && (
            <div
              className="absolute inset-0 scale-110 bg-cover bg-center opacity-50 blur-2xl"
              style={{ backgroundImage: `url(${game.cover_url})` }}
            />
          )}
          <div className="to-background absolute inset-0 bg-linear-to-b from-black/20 via-transparent" />
          <div className="absolute bottom-0 left-0 z-10 flex w-full items-end p-5 lg:p-8">
            {game.cover_url ? (
              <img
                src={game.cover_url}
                alt=""
                className="bg-muted mr-4 h-20 w-14 shrink-0 rounded object-cover lg:h-24 lg:w-16"
              />
            ) : (
              <div className="bg-muted flex h-20 w-14 shrink-0 items-center justify-center rounded lg:h-24 lg:w-16">
                <ImageOff className="h-6 w-6 opacity-50" />
              </div>
            )}
            <div className="flex-1 space-y-2 lg:space-y-3">
              <div className="flex items-center gap-2 lg:gap-3">
                <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-primary/20 text-xs backdrop-blur-md">
                  {game.platform || 'PC'}
                </Badge>
                {game.rating && (
                  <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2 py-1 text-xs font-bold text-yellow-400 backdrop-blur-md lg:px-3 lg:text-sm">
                    <Star size={14} fill="currentColor" /> {game.rating}
                  </div>
                )}
              </div>
              <h2 className="line-clamp-2 text-2xl leading-tight font-black tracking-tight text-white drop-shadow-lg lg:text-4xl xl:text-5xl">
                {game.name}
              </h2>
            </div>
          </div>
        </div>

        {/* Corpo - Grid de 2 colunas */}
        <div className="bg-background grid grid-cols-12 gap-0 overflow-hidden">
          {/* Coluna 1: Sidebar de Informações */}
          <div className="border-border bg-muted/5 custom-scrollbar col-span-5 max-h-[calc(92vh-8rem)] overflow-y-auto border-r lg:max-h-[calc(92vh-10rem)] xl:col-span-4">
            <div className="space-y-5 p-5 lg:space-y-6 lg:p-6 xl:p-8">
              <div className="space-y-3">
                {/* Seção 1: Dados */}
                <h3 className="text-muted-foreground flex items-center gap-2 text-sm font-bold tracking-wider uppercase lg:text-base">
                  <Trophy size={16} className="text-primary" /> Seus Dados
                </h3>
                {/* Layout responsivo: texto em telas pequenas, cards em grande */}
                <div className="hidden grid-cols-2 gap-3 xl:grid">
                  <div className="bg-card rounded-lg border p-3 shadow-sm">
                    <span className="text-muted-foreground mb-1 block text-xs">
                      Tempo Jogado
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-lg font-semibold">
                      <Clock size={16} className="text-muted-foreground" />
                      {game.playtime}h
                    </div>
                  </div>
                  <div className="bg-card rounded-lg border p-3 shadow-sm">
                    <span className="text-muted-foreground mb-1 block text-xs">
                      Status
                    </span>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <TrendingUp size={16} className="text-muted-foreground" />
                      {game.playtime === 0 ? 'Nunca Jogado' : 'Em Progresso'}
                    </div>
                  </div>
                </div>
                {/* Formato de texto para telas menores */}
                <div className="space-y-2 xl:hidden">
                  <div className="border-border/50 flex justify-between border-b py-2">
                    <span className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Clock size={16} /> Tempo Jogado
                    </span>
                    <span className="font-mono text-sm font-semibold">
                      {game.playtime}h
                    </span>
                  </div>
                  <div className="border-border/50 flex justify-between border-b py-2">
                    <span className="text-muted-foreground flex items-center gap-2 text-sm">
                      <TrendingUp size={16} /> Status
                    </span>
                    <span className="flex items-center gap-1 text-sm font-medium">
                      {game.playtime === 0 ? 'Nunca Jogado' : 'Em Progresso'}
                    </span>
                  </div>
                </div>
              </div>
              {/* Seção 2: Detalhes */}
              <div className="space-y-2 lg:space-y-3">
                <h3 className="text-muted-foreground text-sm font-bold tracking-wider uppercase lg:text-base">
                  Detalhes
                </h3>
                <div className="space-y-2">
                  <div className="border-border/50 flex justify-between border-b py-2">
                    <span className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Gamepad2 size={16} /> Gênero
                    </span>
                    <span className="max-w-[50%] truncate text-sm font-medium">
                      {game.genre || 'N/A'}
                    </span>
                  </div>
                  {details?.metacritic && (
                    <div className="border-border/50 flex items-center justify-between border-b py-2">
                      <span className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Star size={16} /> Metascore
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'border-2 text-sm font-bold',
                          details.metacritic >= 75
                            ? 'border-green-500/50 text-green-500'
                            : details.metacritic >= 50
                              ? 'border-yellow-500/50 text-yellow-500'
                              : 'border-red-500/50 text-red-500'
                        )}
                      >
                        {details.metacritic}
                      </Badge>
                    </div>
                  )}
                  {details?.developers && details.developers.length > 0 && (
                    <div className="border-border/50 flex justify-between border-b py-2">
                      <span className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Building2 size={16} /> Dev
                      </span>
                      <span className="max-w-[50%] truncate text-right text-sm font-medium">
                        {details.developers[0].name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {/* Seção 3: Tags */}
              {details?.tags && details.tags.length > 0 && (
                <div className="space-y-2 lg:space-y-3">
                  <h3 className="text-muted-foreground flex items-center gap-2 text-sm font-bold tracking-wider uppercase lg:text-base">
                    <Tag size={16} /> Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {details.tags.slice(0, 10).map(tag => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="bg-secondary/50 hover:bg-secondary text-xs font-normal"
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
                    <span className="text-muted-foreground text-sm">
                      Outras Versões:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {siblings.map(sib => (
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
                    className="h-9 w-full text-sm"
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
          <div className="bg-background custom-scrollbar col-span-7 max-h-[calc(92vh-8rem)] overflow-y-auto p-5 lg:max-h-[calc(92vh-10rem)] lg:p-8 xl:col-span-8 xl:p-10">
            <div className="mx-auto max-w-3xl space-y-4 pb-8 lg:space-y-6">
              <h3 className="mb-4 border-b pb-3 text-xl font-bold lg:mb-6 lg:pb-4 lg:text-2xl xl:text-3xl">
                Sobre o Jogo
              </h3>
              {loading ? (
                <div className="animate-pulse space-y-3 opacity-50 lg:space-y-4">
                  <div className="bg-muted h-4 w-full rounded" />
                  <div className="bg-muted h-4 w-full rounded" />
                  <div className="bg-muted h-4 w-3/4 rounded" />
                  <div className="space-y-2 pt-6 lg:pt-8">
                    <div className="bg-muted h-4 w-full rounded" />
                    <div className="bg-muted h-4 w-5/6 rounded" />
                  </div>
                </div>
              ) : details ? (
                <div className="text-foreground/85 text-sm leading-relaxed whitespace-pre-line lg:text-base">
                  {details.description_raw ||
                    'Nenhuma descrição fornecida pelo desenvolvedor.'}
                </div>
              ) : (
                <div className="text-muted-foreground border-border flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 lg:py-20">
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
