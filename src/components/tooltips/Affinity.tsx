import { Sparkles, Trophy, Zap } from 'lucide-react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui/tooltip';

interface AffinityTooltipProps {
  children: ReactNode;
  badge: 'SÉRIE FAVORITA' | 'TOP PICK' | 'PARA VOCÊ';
  className?: string;
}

export function Affinity({ children, badge }: AffinityTooltipProps) {
  const { t } = useTranslation('trending');

  const getBadgeMeta = (badgeType: string) => {
    switch (badgeType) {
      case 'SÉRIE FAVORITA':
        return {
          icon: Trophy,
          label: t('affinity_badge_label_favorite_series'),
          color: 'text-primary',
          bg: 'bg-purple-600/10',
          explanation: t('affinity_badge_explanation_favorite_series'),
          description: t('affinity_badge_description_favorite_series'),
        };
      case 'TOP PICK':
        return {
          icon: Zap,
          label: t('affinity_badge_label_top_pick'),
          color: 'text-primary',
          bg: 'bg-purple-600/10',
          explanation: t('affinity_badge_explanation_top_pick'),
          description: t('affinity_badge_description_top_pick'),
        };
      case 'PARA VOCÊ':
        return {
          icon: Sparkles,
          label: t('affinity_badge_label_for_you'),
          color: 'text-primary',
          bg: 'bg-purple-600/10',
          explanation: t('affinity_badge_explanation_for_you'),
          description: t('affinity_badge_description_for_you'),
        };
      default:
        return {
          icon: Sparkles,
          label: t('affinity_badge_label_recommended'),
          color: 'text-primary',
          bg: 'bg-purple-600/10',
          explanation: t('affinity_badge_explanation_recommended'),
          description: t('affinity_badge_description_recommended'),
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
