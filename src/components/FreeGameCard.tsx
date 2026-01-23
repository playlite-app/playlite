import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FreeGameCardProps {
  title: string;
  image: string;
  worth: string;
  platforms: string;
  url: string;
  endDate?: string | null;
  className?: string;
}

export function FreeGameCard({
  title,
  image,
  worth,
  platforms,
  url,
  endDate,
  className,
}: FreeGameCardProps) {
  const openLink = async () => {
    const { open } = await import('@tauri-apps/plugin-shell');
    open(url);
  };

  // Lógica para limpar o texto da plataforma
  const platformLabel = platforms.includes('Epic')
    ? 'Epic Games'
    : platforms.includes('Steam')
      ? 'Steam'
      : platforms.includes('GOG')
        ? 'GOG'
        : platforms.includes('Prime')
          ? 'Amazon Prime'
          : platforms.includes('Ubisoft')
            ? 'Ubisoft'
            : platforms.replace('PC, ', ''); // Fallback limpo

  // Verifica se a data existe: se não é "N/A" e se é uma data válida
  const isValidDate =
    endDate && endDate !== 'N/A' && !isNaN(new Date(endDate).getTime());

  // Se for válida, formata. Se não, retorna null.
  const formattedDate = isValidDate
    ? `Até ${new Date(endDate!).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
    : null;

  return (
    <div
      className={cn(
        'group flex w-full cursor-pointer flex-col gap-3',
        className
      )}
      onClick={openLink}
    >
      <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-lg shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute right-0 bottom-0 left-0 bg-blue-600 py-1.5 text-center">
          <span className="text-xs font-bold tracking-wide text-white uppercase">
            Grátis
          </span>
        </div>
        <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Badge
            variant="secondary"
            className="bg-black/60 text-white backdrop-blur-md"
          >
            {platformLabel}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-foreground line-clamp-1 text-base leading-tight font-medium group-hover:underline">
          {title}
        </h3>

        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          {worth && worth !== 'N/A' && (
            <span className="text-xs line-through opacity-70">{worth}</span>
          )}

          {/* Só mostra se a data for válida */}
          {formattedDate && (
            <span className="text-xs font-medium text-orange-500/90">
              {formattedDate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
