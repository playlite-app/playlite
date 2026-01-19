import { Languages, Wand2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { GameDetails } from '@/types/game';

interface GameDescriptionProps {
  details: GameDetails | null;
  loading: boolean;
}

export function GameDescription({ details, loading }: GameDescriptionProps) {
  if (loading) {
    return (
      <div className="space-y-4 p-1">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-[95%]" />
        <Skeleton className="h-4 w-[80%]" />
      </div>
    );
  }

  if (!details) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center">
        Selecione um jogo para ver os detalhes.
      </div>
    );
  }

  // LÓGICA DE PRIORIDADE DE EXIBIÇÃO:
  // 1. Tradução (Futuro)
  // 2. Texto Puro (Novo padrão RAWG/Steam)
  const isTranslated = !!details.descriptionPtbr;
  const descriptionText = details.descriptionPtbr || details.descriptionRaw;

  return (
    <div className="flex h-full flex-col pr-4">
      {/* Cabeçalho da Seção */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight">Sobre o Jogo</h2>
          {isTranslated && (
            <Badge
              variant="secondary"
              className="border-blue-500/20 bg-blue-500/10 px-2 text-[10px] text-blue-400"
            >
              <Languages size={10} className="mr-1" /> PT-BR
            </Badge>
          )}
        </div>

        {/* BOTÃO DE TRADUZIR (PREPARADO PARA O FUTURO)
           Quando você implementar a tradução, basta adicionar o onClick aqui.
           Por enquanto, só aparece se tiver texto Raw e NÃO tiver tradução ainda.
        */}
        {!isTranslated && details.descriptionRaw && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary h-8 text-xs"
            title="Funcionalidade futura: Traduzir descrição"
            disabled // <--- Remova isso quando implementar a função
          >
            <Wand2 size={14} className="mr-2" />
            Traduzir (Em breve)
          </Button>
        )}
      </div>

      {/* Área de Texto com Scroll */}
      <ScrollArea className="-mr-4 flex-1 pr-4">
        <div className="text-foreground/90 pb-8 text-sm leading-relaxed lg:text-base">
          {descriptionText ? (
            // Renderiza texto puro (Raw ou Ptbr) respeitando quebras de linha
            <p className="font-light whitespace-pre-line text-gray-300">
              {descriptionText}
            </p>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center opacity-50">
              <p className="italic">Nenhuma descrição disponível.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
