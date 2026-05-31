import { Loader2 } from 'lucide-react';

interface ContentLoadingProps {
  message?: string;
}

export function ContentLoading({
  message = 'Carregando…',
}: ContentLoadingProps) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}
