import { ImageOff, Play } from 'lucide-react';
import { ReactNode, useState } from 'react';

import { ActionButton, CachedImage } from '@/components';
import { cn } from '@/lib/utils';
import { getPlatformIcon } from '@/utils/platform';

interface StandardGameCardProps {
  id: string;
  title: string;
  coverUrl?: string | null;
  subtitle?: string;
  platform?: string;
  badge?: ReactNode;
  rating?: number;
  onClick?: () => void;
  actions?: ReactNode;
  className?: string;
  onPlay?: () => void;
}

/**
 * Card padrÃ£o para exibiÃ§Ã£o de jogos em grades (InÃ­cio, Biblioteca, Favoritos, Em Alta e Lista de Desejos).
 * Aspect ratio fixo 3:4 (capa vertical de jogo).
 *
 * Features:
 * - Fallback automÃ¡tico se imagem falhar: exibe gradiente + nome do jogo em maiÃºsculas
 * - Overlay de aÃ§Ãµes aparece no hover (botÃ£o Play + aÃ§Ãµes customizadas)
 * - Suporta badge no canto superior esquerdo (ex: "Favorito", "Novo", "Oferta")
 * - Efeito hover: elevaÃ§Ã£o + zoom suave na imagem
 */
export default function StandardGameCard({
  id,
  title,
  coverUrl,
  subtitle,
  platform,
  badge,
  rating,
  onClick,
  actions,
  className,
  onPlay,
}: Readonly<StandardGameCardProps>) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={cn(
        'group bg-card border-border relative flex h-full flex-col overflow-hidden rounded-xl border transition-all hover:-translate-y-1 hover:shadow-lg',
        className
      )}
    >
      {onClick && (
        <button
          type="button"
          className="absolute inset-0 z-20 cursor-pointer"
          aria-label={`Abrir detalhes de ${title}`}
          onClick={onClick}
        />
      )}

      <div className="bg-muted relative aspect-3/4 overflow-hidden">
        {coverUrl && !imageError ? (
          <CachedImage
            src={coverUrl}
            gameId={id}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="from-secondary/50 via-muted to-background flex h-full w-full flex-col items-center justify-center bg-linear-to-br p-4 text-center">
            <ImageOff className="mb-3 h-10 w-10 opacity-20" />
            <span className="text-muted-foreground line-clamp-2 text-[10px] font-semibold tracking-widest uppercase">
              {title}
            </span>
          </div>
        )}

        {platform && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
            {(() => {
              const Icon = getPlatformIcon(platform);

              return <Icon size={12} />;
            })()}
            {platform}
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center gap-2 bg-black/60 p-4 opacity-0 transition-opacity group-hover:opacity-100">
          {onPlay && (
            <div className="pointer-events-auto">
              <ActionButton
                icon={Play}
                variant="glass"
                onClick={onPlay}
                tooltip="Jogar Agora"
              />
            </div>
          )}

          {actions && (
            <div className="pointer-events-auto flex items-center justify-center gap-2">
              {actions}
            </div>
          )}
        </div>

        {badge && (
          <div className="absolute top-2 left-2 z-40 rounded-full border border-purple-400/30 bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg backdrop-blur-md">
            {badge}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-1 text-sm font-semibold" title={title}>
          {title}
        </h3>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-muted-foreground max-w-30 truncate text-xs">
            {subtitle}
          </span>
          {rating && (
            <span className="flex items-center gap-1 rounded bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-bold text-yellow-500">
              {'\u2605'} {rating}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
