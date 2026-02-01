import { Calendar, ExternalLink } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Giveaway } from '@/types';
import { getPlatformColor, getPlatformLabel } from '@/utils/platform';

interface FreeGameCardProps extends Giveaway {
  badge?: string;
  isFavSeries?: boolean;
  className?: string;
}

export function FreeGameCard({
  title,
  badge,
  className,
  image,
  worth,
  platforms,
  end_date: endDate,
  open_giveaway_url: url,
}: FreeGameCardProps) {
  const openLink = async () => {
    const { open } = await import('@tauri-apps/plugin-shell');
    open(url);
  };

  // Usa funções centralizadas
  const platformLabel = getPlatformLabel(platforms);
  const platformColor = getPlatformColor(platforms);

  const isValidDate =
    endDate && endDate !== 'N/A' && !isNaN(new Date(endDate).getTime());

  const formattedDate = isValidDate
    ? new Date(endDate!)
        .toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
        })
        .replace('.', '')
    : null;

  // Calcula dias restantes
  const daysLeft = isValidDate
    ? Math.ceil(
        (new Date(endDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div
      className={cn(
        'group border-border bg-card relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
        className
      )}
      onClick={openLink}
    >
      {/* Container da Imagem com aspect ratio 16:9 */}
      <div className="relative aspect-video w-full overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity" />

        {/* Badge Recomendação */}
        {badge && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-purple-600 font-bold text-white">
              {badge}
            </Badge>
          </div>
        )}

        {/* Badge da Plataforma - Canto direito inferior */}
        <div className="absolute right-3 bottom-3">
          <Badge
            className={cn('text-xs font-semibold shadow-md', platformColor)}
          >
            {platformLabel}
          </Badge>
        </div>

        {/* Ícone de link externo no hover */}
        <div className="absolute top-3 right-3 opacity-0 transition-all duration-300 group-hover:opacity-100">
          <div className="flex items-center justify-center rounded-full bg-white/20 p-2 backdrop-blur-sm">
            <ExternalLink size={18} className="text-white" />
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="text-foreground line-clamp-2 text-sm leading-tight font-semibold transition-colors">
          {title}
        </h3>

        {/* Footer com preço e data */}
        <div className="mt-auto flex items-center justify-between gap-1.5">
          {/* Preço original */}
          {worth && worth !== 'N/A' && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-xs line-through">
                {worth}
              </span>
              <span className="text-xs font-bold text-green-500">100% OFF</span>
            </div>
          )}

          {/* Data de expiração */}
          {formattedDate && (
            <div className="flex items-center gap-1 rounded-md bg-orange-500/10 px-2 py-0.5">
              <Calendar size={12} className="text-orange-500" />
              <span className="text-xs font-semibold text-orange-500">
                {daysLeft && daysLeft <= 3 ? `${daysLeft}d` : formattedDate}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
