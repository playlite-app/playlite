import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AgeRatingProps {
  esrb?: string;
  isAdult?: boolean;
  adultTags?: string | null;
}

export function AgeRatingBadge({ esrb, isAdult, adultTags }: AgeRatingProps) {
  const { t } = useTranslation('game_detail');

  if (isAdult) {
    // Normaliza adultTags — pode vir como JSON array ou string simples
    const tags = adultTags
      ? adultTags.startsWith('[')
        ? JSON.parse(adultTags).join(', ')
        : adultTags
      : null;

    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-red-400">
        <div className="mb-1 flex items-center gap-2 font-bold">
          <AlertTriangle size={16} /> {t('sidebar_adult_content_title')}
        </div>
        {tags && <p className="text-sm opacity-80">{tags}</p>}
      </div>
    );
  }

  if (esrb) {
    return (
      <div className="border-border/50 flex items-center justify-between border-b py-2">
        <span className="text-muted-foreground text-sm">
          {t('age_rating_label')}
        </span>
        <span className="text-muted-foreground rounded border border-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase">
          {esrb}
        </span>
      </div>
    );
  }

  return null;
}
