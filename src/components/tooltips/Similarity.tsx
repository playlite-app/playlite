import { Sparkles } from 'lucide-react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui/tooltip';

interface SimilarityTooltipProps {
  children: ReactNode;
  becauseOf: string;
}

export function Similarity({ children, becauseOf }: SimilarityTooltipProps) {
  const { t } = useTranslation('trending');

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
          <div className="flex items-center gap-2 border-b border-white/10 bg-purple-600/10 px-3 py-2.5">
            <Sparkles size={16} className="text-primary" />
            <span className="text-primary text-xs font-bold tracking-wider uppercase">
              {t('similarity_tooltip_title')}
            </span>
          </div>

          <div className="p-3">
            <p className="text-foreground text-sm leading-snug">
              {t('similarity_tooltip_description', { becauseOf })}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
