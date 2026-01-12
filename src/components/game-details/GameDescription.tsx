import { Button } from '@/components/ui/button';
import { GameDetails } from '@/types/game';

interface GameDescriptionProps {
  details: GameDetails | null;
  loading: boolean;
}

export function GameDescription({ details, loading }: GameDescriptionProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-8 lg:space-y-6">
      <h3 className="mb-4 border-b pb-3 text-xl font-bold lg:mb-6 lg:pb-4 lg:text-2xl xl:text-3xl">
        Sobre o Jogo
      </h3>

      {loading ? (
        <div className="animate-pulse space-y-3 opacity-50 lg:space-y-4">
          <div className="bg-muted h-4 w-full rounded" />
          <div className="bg-muted h-4 w-full rounded" />
          <div className="bg-muted h-4 w-3/4 rounded" />
          <div className="space-y-2 pt-6 lg:pt-8">
            <div className="bg-muted h-4 w-full rounded" />
            <div className="bg-muted h-4 w-5/6 rounded" />
          </div>
        </div>
      ) : details ? (
        <div className="text-foreground/85 text-sm leading-relaxed whitespace-pre-line lg:text-base">
          {details.description ||
            'Nenhuma descrição fornecida pelo desenvolvedor.'}
        </div>
      ) : (
        <div className="text-muted-foreground border-border flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 lg:py-20">
          <p className="text-sm lg:text-base">
            Não foi possível carregar a descrição online.
          </p>
          <Button
            variant="link"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
}
