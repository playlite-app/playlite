import { Dna, Gamepad2, Sparkles, Tag, Trophy, Users } from 'lucide-react';
import { ReactNode } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RecommendationReason } from '@/types';

interface RecommendationTooltipProps {
  children: ReactNode;
  reason?: RecommendationReason;
  score?: number;
  className?: string;
}

export function RecommendationTooltip({
  children,
  reason,
  score,
}: RecommendationTooltipProps) {
  if (!reason) {
    return <>{children}</>;
  }

  const getReasonMeta = (type: string) => {
    switch (type) {
      case 'community':
        return {
          icon: Users,
          label: 'Comunidade',
          color: 'text-blue-400',
          bg: 'bg-blue-500/10',
        };
      case 'series':
        return {
          icon: Trophy,
          label: 'Série Favorita',
          color: 'text-yellow-400',
          bg: 'bg-yellow-500/10',
        };
      case 'genre':
        return {
          icon: Gamepad2,
          label: 'Gênero',
          color: 'text-green-400',
          bg: 'bg-green-500/10',
        };
      case 'tag':
        return {
          icon: Tag,
          label: 'Tag',
          color: 'text-pink-400',
          bg: 'bg-pink-500/10',
        };
      case 'general':
        return {
          icon: Dna,
          label: 'Perfil',
          color: 'text-purple-400',
          bg: 'bg-purple-500/10',
        };
      default:
        return {
          icon: Sparkles,
          label: 'Recomendação',
          color: 'text-primary',
          bg: 'bg-primary/10',
        };
    }
  };

  const meta = getReasonMeta(reason.type_id);
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
          className="border-border/50 bg-popover/95 animate-in fade-in zoom-in-95 z-50 max-w-xs overflow-hidden p-0 shadow-xl backdrop-blur-md duration-200"
        >
          {/* Header Colorido */}
          <div
            className={`flex items-center gap-2 border-b border-white/10 px-3 py-2.5 ${meta.bg}`}
          >
            <Icon size={16} className={meta.color} />
            <span
              className={`text-xs font-extrabold tracking-wider uppercase ${meta.color}`}
            >
              {meta.label}
            </span>
            {score !== undefined && (
              <span className="text-foreground ml-auto font-mono text-xs">
                {Math.round(score)}% Match
              </span>
            )}
          </div>

          {/* Corpo do Texto */}
          <div className="p-3">
            <p className="text-foreground mb-1 text-sm leading-snug font-semibold">
              {reason.label}
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed whitespace-nowrap">
              Baseado na análise da sua biblioteca e preferências.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
