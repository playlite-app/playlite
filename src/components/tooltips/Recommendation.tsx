import { Dna, Gamepad2, Sparkles, Tag, Trophy, Users } from 'lucide-react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { RecommendationReason } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui/tooltip';

interface RecommendationTooltipProps {
  children: ReactNode;
  reason?: RecommendationReason;
  className?: string;
}

export function Recommendation({
  children,
  reason,
}: RecommendationTooltipProps) {
  const { t } = useTranslation('common');

  if (!reason) {
    return <>{children}</>;
  }

  const getExplanation = (type: string) => {
    switch (type) {
      case 'community':
        return t('recommendation_tooltip_explanation_community');
      case 'series':
        return t('recommendation_tooltip_explanation_series');
      case 'genre':
        return t('recommendation_tooltip_explanation_genre');
      case 'tag':
        return t('recommendation_tooltip_explanation_tag');
      case 'hybrid':
        return t('recommendation_tooltip_explanation_hybrid');
      case 'general':
        return t('recommendation_tooltip_explanation_general');
      default:
        return t('recommendation_tooltip_explanation_recommended');
    }
  };

  const getReasonMeta = (type: string) => {
    switch (type) {
      case 'community':
        return {
          icon: Users,
          label: t('recommendation_tooltip_label_community'),
          color: 'text-primary',
          bg: 'bg-purple-600/10',
        };
      case 'series':
        return {
          icon: Trophy,
          label: t('recommendation_tooltip_label_series'),
          color: 'text-primary',
          bg: 'bg-purple-600/10',
        };
      case 'genre':
        return {
          icon: Gamepad2,
          label: t('recommendation_tooltip_label_genre'),
          color: 'text-primary',
          bg: 'bg-purple-600/10',
        };
      case 'tag':
        return {
          icon: Tag,
          label: t('recommendation_tooltip_label_tag'),
          color: 'text-primary',
          bg: 'bg-purple-600/10',
        };
      case 'hybrid':
        return {
          icon: Sparkles,
          label: t('recommendation_tooltip_label_affinity_community'),
          color: 'text-primary',
          bg: 'bg-purple-600/10',
        };
      case 'general':
        return {
          icon: Dna,
          label: t('recommendation_tooltip_label_profile'),
          color: 'text-primary',
          bg: 'bg-purple-600/10',
        };
      default:
        return {
          icon: Sparkles,
          label: t('recommendation_tooltip_label_recommendation'),
          color: 'text-primary',
          bg: 'bg-purple-600/10',
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
              {reason.label}
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed whitespace-nowrap">
              {getExplanation(reason.type_id)}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
