import { AlertCircle, RefreshCcw, Settings, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/ui/button';

type ErrorType = 'offline' | 'config' | 'api' | 'generic';

export interface ErrorStateProps {
  type: ErrorType;
  message?: string;
  onRetry?: () => void;
  onAction?: () => void; // Ação principal (ex: Ir para Configs)
}

export function ErrorState({
  type,
  message,
  onRetry,
  onAction,
}: ErrorStateProps) {
  const { t } = useTranslation('errors');

  const content = {
    offline: {
      icon: WifiOff,
      title: t('errors.offline_title'),
      desc: t('errors.offline_desc'),
      actionLabel: t('errors.offline_action_label'),
      color: 'text-muted-foreground',
      bg: 'bg-muted',
    },
    config: {
      icon: Settings,
      title: t('errors.config_title'),
      desc: t('errors.config_desc'),
      actionLabel: t('errors.config_action_label'),
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    api: {
      icon: AlertCircle,
      title: t('errors.api_title'),
      desc: message ?? t('errors.api_desc'),
      actionLabel: null, // Sem ação de navegação, apenas retry
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
    generic: {
      icon: AlertCircle,
      title: t('errors.generic_title'),
      desc: message ?? t('errors.generic_desc'),
      actionLabel: null,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
  };

  const config = content[type];
  const Icon = config.icon;

  return (
    <div className="animate-in fade-in zoom-in-95 flex h-full flex-1 flex-col items-center justify-center p-8 text-center duration-300">
      <div className={`mb-4 rounded-full p-4 ${config.bg}`}>
        <Icon className={`h-10 w-10 ${config.color}`} />
      </div>

      <h2 className="mb-2 text-xl font-bold">{config.title}</h2>
      <p className="text-muted-foreground mb-6 max-w-md">{config.desc}</p>

      <div className="flex gap-3">
        {config.actionLabel && onAction && (
          <Button onClick={onAction} variant="default">
            {config.actionLabel}
          </Button>
        )}

        {onRetry && (
          <Button
            onClick={onRetry}
            variant={config.actionLabel ? 'outline' : 'default'}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            {t('errors.retry_button')}
          </Button>
        )}
      </div>
    </div>
  );
}
