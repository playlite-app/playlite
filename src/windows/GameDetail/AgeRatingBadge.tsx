import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AgeRatingProps {
  esrb?: string;
  isAdult?: boolean;
}

export function AgeRatingBadge({ esrb, isAdult }: AgeRatingProps) {
  const { t } = useTranslation('game_detail');

  if (isAdult) {
    return (
      <div className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-500/50 bg-red-500/10 px-2 py-1 text-sm font-bold text-red-400">
        <AlertTriangle size={18} />
        <span>{t('age_rating_adult_content')}</span>
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
