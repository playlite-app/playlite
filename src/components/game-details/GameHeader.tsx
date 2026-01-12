import { ImageOff, Star, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Game } from '@/types/game';

interface GameHeaderProps {
  game: Game;
  onClose: () => void;
}

export function GameHeader({ game, onClose }: GameHeaderProps) {
  return (
    <div className="bg-muted relative h-32 w-full shrink-0 overflow-hidden lg:h-40">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-50 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/80 lg:top-4 lg:right-4"
      >
        <X size={16} />
      </button>

      {/* Imagem de Fundo (Blur) */}
      {game.coverUrl && (
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-50 blur-2xl"
          style={{ backgroundImage: `url(${game.coverUrl})` }}
        />
      )}

      <div className="to-background absolute inset-0 bg-linear-to-b from-black/20 via-transparent" />

      {/* Conteúdo do Header */}
      <div className="absolute bottom-0 left-0 z-10 flex w-full items-end p-5 lg:p-8">
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
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
            {game.userRating && (
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2 py-1 text-xs font-bold text-yellow-400 backdrop-blur-md lg:px-3 lg:text-sm">
                <Star size={14} fill="currentColor" /> {game.userRating}
              </div>
            )}
          </div>
          <h2 className="line-clamp-2 text-2xl leading-tight font-black tracking-tight text-white drop-shadow-lg lg:text-4xl xl:text-5xl">
            {game.name}
          </h2>
        </div>
      </div>
    </div>
  );
}
