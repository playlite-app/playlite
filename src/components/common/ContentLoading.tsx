import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ContentLoadingProps {
  message?: string;
}

export function ContentLoading({ message }: ContentLoadingProps) {
  const { t } = useTranslation('common');
  const loadingMessage = message ?? t('loading_default_message');

  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        <p className="text-muted-foreground text-sm">{loadingMessage}</p>
      </div>
    </div>
  );
}
