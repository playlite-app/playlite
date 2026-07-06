import { cn } from '@/lib/utils';

interface ImportProgress {
  current: number;
  total: number;
  game: string;
}

interface ImportProgressIndicatorProps {
  label: string;
  progress: ImportProgress;
  colorClassName?: string;
}

/**
 * Indicador de progresso exibido enquanto uma importação está em andamento.
 * `colorClassName` permite variar a cor de fundo (Heroic usa roxo, as
 * demais plataformas usam azul, mantendo o visual original de cada uma).
 */
export function ImportProgressIndicator({
  label,
  progress,
  colorClassName = 'bg-blue-500/10',
}: Readonly<ImportProgressIndicatorProps>) {
  return (
    <div
      className={cn(
        'text-muted-foreground animate-pulse rounded-lg p-3 text-center text-sm',
        colorClassName
      )}
    >
      {label}: {progress.game} ({progress.current}/{progress.total})
    </div>
  );
}
