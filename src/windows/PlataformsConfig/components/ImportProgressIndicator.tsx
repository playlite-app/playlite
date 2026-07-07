import { cn } from '@/lib/utils';

interface ImportProgress {
  current: number;
  total: number;
  game: string;
}

interface ImportProgressIndicatorProps {
  label: string;
  progress: ImportProgress;
}

/**
 * Indicador de progresso exibido enquanto uma importação está em andamento.
 */
export function ImportProgressIndicator({
  label,
  progress,
}: Readonly<ImportProgressIndicatorProps>) {
  return (
    <div
      className={cn(
        'text-muted-foreground animate-pulse rounded-lg bg-blue-500/10 p-3 text-center text-sm'
      )}
    >
      {label}: {progress.game} ({progress.current}/{progress.total})
    </div>
  );
}
