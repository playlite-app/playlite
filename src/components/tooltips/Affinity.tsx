import { Sparkles, Trophy, Zap } from 'lucide-react';
import { ReactNode } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AffinityTooltipProps {
  children: ReactNode;
  badge: 'SÉRIE FAVORITA' | 'TOP PICK' | 'PARA VOCÊ';
  className?: string;
}

export function Affinity({ children, badge }: AffinityTooltipProps) {
  const getBadgeMeta = (badgeType: string) => {
    switch (badgeType) {
      case 'SÉRIE FAVORITA':
        return {
          icon: Trophy,
          label: 'Série Favorita',
          color: 'text-primary',
          bg: 'bg-purple-600/10',
          explanation:
            'Você já demonstrou interesse por outros jogos desta série.',
          description: 'Baseado no seu histórico de jogos da mesma franquia',
        };
      case 'TOP PICK':
        return {
          icon: Zap,
          label: 'Top Pick',
          color: 'text-primary',
          bg: 'bg-purple-600/10',
          explanation: 'Este jogo combina perfeitamente com suas preferências.',
          description:
            'Alta afinidade com gêneros, tags e estilo que você mais joga',
        };
      case 'PARA VOCÊ':
        return {
          icon: Sparkles,
          label: 'Para Você',
          color: 'text-primary',
          bg: 'bg-purple-600/10',
          explanation: 'Este jogo tem boa compatibilidade com seu perfil.',
          description: 'Elementos do jogo combinam com seu estilo de jogar',
        };
      default:
        return {
          icon: Sparkles,
          label: 'Recomendado',
          color: 'text-primary',
          bg: 'bg-purple-600/10',
          explanation: 'Recomendado com base no seu perfil.',
          description: 'Selecionado para você',
        };
    }
  };

  const meta = getBadgeMeta(badge);
  const Icon = meta.icon;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="relative z-30 inline-block cursor-help"
            onClick={e => e.stopPropagation()}
          >
            {children}
          </div>
        </TooltipTrigger>

        <TooltipContent
          side="top"
          align="center"
          className="border-border/50 bg-popover/95 animate-in fade-in zoom-in-95 z-50 w-auto overflow-hidden p-0 shadow-xl backdrop-blur-md duration-200"
        >
          {/* Header Colorido */}
          <div
            className={`flex items-center gap-2 border-b border-white/10 px-3 py-2.5 ${meta.bg}`}
          >
            <Icon size={16} className={meta.color} />
            <span
              className={`text-xs font-bold tracking-wider uppercase ${meta.color}`}
            >
              {meta.label}
            </span>
          </div>

          {/* Corpo do Texto */}
          <div className="p-3">
            <p className="text-foreground mb-1 text-sm leading-snug font-semibold">
              {meta.explanation}
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed whitespace-nowrap">
              {meta.description}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
