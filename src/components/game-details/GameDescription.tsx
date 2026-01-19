import { invoke } from '@tauri-apps/api/core';
import { Languages, Loader2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { GameDetails } from '@/types/game';

interface GameDescriptionProps {
  gameId: string;
  details: GameDetails | null;
  loading: boolean;
  onDescriptionUpdate?: (newPtBr: string) => void;
}

export function GameDescription({
  gameId,
  details,
  loading,
  onDescriptionUpdate,
}: GameDescriptionProps) {
  // Estado local para controlar qual idioma está sendo exibido
  const [activeLang, setActiveLang] = useState<'en' | 'pt'>('en');
  // Estado local para a tradução (inicia com o que veio do banco, mas pode ser atualizado)
  const [localPtBr, setLocalPtBr] = useState<string | undefined>(undefined);
  // Estado de carregamento da tradução
  const [isTranslating, setIsTranslating] = useState(false);

  // Sincroniza estado local quando os detalhes mudam (ao trocar de jogo)
  useEffect(() => {
    if (details) {
      setLocalPtBr(details.descriptionPtbr);
      setActiveLang(details.descriptionPtbr ? 'pt' : 'en');
    }
  }, [details]);

  if (loading) {
    return (
      <div className="space-y-4 p-1">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
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

  const handleLanguageSwitch = async (targetLang: 'en' | 'pt') => {
    if (targetLang === 'en') {
      setActiveLang('en');

      return;
    }

    // Se usuário quer PT
    if (targetLang === 'pt') {
      // Cenário A: Já temos a tradução em memória
      if (localPtBr) {
        setActiveLang('pt');

        return;
      }

      // Cenário B: Precisamos traduzir (Chamar Rust)
      if (!details.descriptionRaw) {
        toast.error('Não há texto original para traduzir.');

        return;
      }

      setIsTranslating(true);

      try {
        const translatedText = await invoke<string>('translate_description', {
          gameId: gameId,
          text: details.descriptionRaw,
        });

        setLocalPtBr(translatedText);
        setActiveLang('pt');
        toast.success('Descrição traduzida com sucesso!');

        if (onDescriptionUpdate) onDescriptionUpdate(translatedText);
      } catch (error) {
        console.error('Erro na tradução:', error);
        toast.error('Falha ao traduzir descrição.');
      } finally {
        setIsTranslating(false);
      }
    }
  };

  // Decide qual texto mostrar
  const textToShow =
    activeLang === 'pt' && localPtBr
      ? localPtBr
      : details.descriptionRaw || 'Sem descrição disponível.';

  return (
    <div className="flex h-full flex-col pr-4">
      {/* CABEÇALHO: Título + Toggle */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Sobre o Jogo</h2>

        {/* Toggle de Idioma */}
        {details.descriptionRaw && (
          <div className="bg-muted border-border flex items-center rounded-lg border p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLanguageSwitch('en')}
              className={cn(
                'h-7 rounded-md px-3 text-xs transition-all',
                activeLang === 'en'
                  ? 'bg-background text-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              EN
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLanguageSwitch('pt')}
              disabled={isTranslating}
              className={cn(
                'flex h-7 items-center gap-1.5 rounded-md px-3 text-xs transition-all',
                activeLang === 'pt'
                  ? 'border border-blue-500/20 bg-blue-500/10 font-bold text-blue-500'
                  : 'text-muted-foreground hover:text-blue-400'
              )}
            >
              {isTranslating ? (
                <Loader2 size={10} className="animate-spin" />
              ) : !localPtBr ? (
                <Sparkles size={10} /> // Ícone indicando que vai gerar/traduzir
              ) : (
                <Languages size={10} />
              )}
              {isTranslating ? 'Gerando...' : 'PT-BR'}
            </Button>
          </div>
        )}
      </div>

      {/* CONTEÚDO */}
      <ScrollArea className="-mr-4 flex-1 pr-4">
        <div className="text-foreground/90 pb-8 text-sm leading-relaxed transition-opacity duration-300 lg:text-base">
          <p className="font-light whitespace-pre-line text-gray-300">
            {textToShow}
          </p>
        </div>
      </ScrollArea>
    </div>
  );
}
