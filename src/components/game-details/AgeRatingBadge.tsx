import { AlertTriangle } from 'lucide-react';

interface AgeRatingProps {
  esrb?: string;
  isAdult?: boolean;
}

export function AgeRatingBadge({ esrb, isAdult }: AgeRatingProps) {
  if (isAdult) {
    return (
      <div className="mb-2 flex w-full items-center justify-center gap-1.5 rounded border border-red-500/50 bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-400">
        <AlertTriangle size={12} />
        <span>CONTEÚDO ADULTO (+18)</span>
      </div>
    );
  }

  if (esrb) {
    return (
      <div className="border-border/50 flex items-center justify-between border-b py-2">
        <span className="text-muted-foreground text-sm">Classificação</span>
        <span className="text-muted-foreground rounded border border-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase">
          {esrb}
        </span>
      </div>
    );
  }

  return null;
}
