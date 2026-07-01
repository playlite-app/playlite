import { ExternalLink, ImageOff, Star } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SimilarGame } from '@/types';

interface SimilarGameCardProps {
  game: SimilarGame;
}

export function SimilarGameCard({ game }: SimilarGameCardProps) {
  const { t } = useTranslation('game_detail');
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Imagem de fundo: microTrailer quando hover, cover quando não
  const hasTrailer = !!game.microTrailer;
  const coverSrc = imgError ? null : game.coverUrl;

  return (
    <div
      className="group border-border bg-muted/10 hover:border-border/80 hover:bg-muted/20 relative overflow-hidden rounded-lg border transition-all duration-200"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Cover / Trailer */}
      <div className="bg-muted/30 relative aspect-3/4 w-full overflow-hidden">
        {/* Imagem de capa */}
        {coverSrc && !imgError ? (
          <img
            src={coverSrc}
            alt={game.name}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              hovered && hasTrailer ? 'opacity-0' : 'opacity-100'
            }`}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center">
            <ImageOff className="h-8 w-8 opacity-20" />
          </div>
        )}

        {/* Micro-trailer (webm) — só carrega quando tiver para não desperdiçar banda */}
        {hasTrailer && hovered && (
          <video
            src={game.microTrailer!}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* Fallback sem imagem */}
        {!coverSrc && !hasTrailer && (
          <div className="flex h-full w-full flex-col items-center justify-center">
            <ImageOff className="h-8 w-8 opacity-20" />
          </div>
        )}

        {/* Badge adultOnly */}
        {game.adultOnly && (
          <span className="bg-destructive/80 text-destructive-foreground absolute top-2 left-2 rounded px-1.5 py-0.5 text-[10px] font-semibold">
            +18
          </span>
        )}

        {/* Badge rating — canto superior direito */}
        {game.rating !== null && (
          <span className="absolute top-2 right-2 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
            <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
            {game.rating}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p
          className="text-foreground truncate text-sm font-medium"
          title={game.name}
        >
          {game.name}
        </p>

        <div className="mt-1 flex items-center justify-between">
          <span className="text-muted-foreground truncate text-xs">
            {[game.genre, game.year].filter(Boolean).join(' · ')}
          </span>

          {game.link && (
            <a
              href={game.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary ml-2 shrink-0 transition-colors"
              title={t('discovery_card_link_title')}
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
