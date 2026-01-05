import { ImageOff, Play } from 'lucide-react';
import { ReactNode, useState } from 'react';

import { cn } from '@/lib/utils';

import { ActionButton } from './ActionButton';

interface StandardGameCardProps {
  title: string;
  coverUrl?: string | null;
  subtitle?: string;
  badge?: string;
  rating?: number;
  onClick?: () => void;
  actions?: ReactNode;
  className?: string;
  onPlay?: () => void;
}

export default function StandardGameCard({
  title,
  coverUrl,
  subtitle,
  badge,
  rating,
  onClick,
  actions,
  className,
  onPlay,
}: StandardGameCardProps) {
  // Estado para controlar erro de carregamento da imagem
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={cn(
        'group bg-card border-border relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border transition-all hover:-translate-y-1 hover:shadow-lg',
        className
      )}
      onClick={onClick}
    >
      {/* Container da Imagem (Aspect Ratio fixo 3/4 para capas verticais) */}
      <div className="bg-muted relative aspect-3/4 overflow-hidden">
        {/* Lógica de Imagem com Fallback */}
        {coverUrl && !imageError ? (
          <img
            src={coverUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageError(true)} // Ativa o fallback se falhar
          />
        ) : (
          /* Fallback Visual (Gradiente + Ícone + Nome) */
          <div className="from-secondary/50 via-muted to-background flex h-full w-full flex-col items-center justify-center bg-linear-to-br p-4 text-center">
            <ImageOff className="mb-3 h-10 w-10 opacity-20" />
            <span className="text-muted-foreground line-clamp-2 text-[10px] font-semibold tracking-widest uppercase">
              {title}
            </span>
          </div>
        )}

        {/* Overlay de Ações (Hover) */}
        <div className="absolute inset-0 z-20 flex items-center justify-center gap-2 bg-black/60 p-4 opacity-0 transition-opacity group-hover:opacity-100">
          {onPlay && (
            <ActionButton
              icon={Play}
              variant="glass"
              onClick={onPlay}
              tooltip="Jogar Agora"
            />
          )}

          {/* Ações secundárias (Favoritar, Menu, etc) */}
          {actions && (
            <div className="flex items-center justify-center gap-2">
              {actions}
            </div>
          )}
        </div>

        {/* Badge (Canto Superior Esquerdo) */}
        {badge && (
          <div className="absolute top-2 left-2 z-10 rounded-full border border-purple-400/30 bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg backdrop-blur-md">
            {badge}
          </div>
        )}
      </div>

      {/* Conteúdo (Título e Subtítulo) */}
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
              ★ {rating}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
