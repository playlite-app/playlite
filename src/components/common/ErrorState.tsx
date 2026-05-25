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

  // Helper to translate a message key if it's available in the `errors` namespace.
  // If `message` is already a human-readable string (not a key), leave it as-is.
  const translateMessageIfKey = (msg?: string) => {
    if (!msg) return undefined;

    const translated = t(msg);

    // If translation exists in the `errors` namespace, `t(msg)` will return
    // a different string than the key. Otherwise, it returns the key itself.
    return translated !== msg ? translated : msg;
  };

  const content = {
    offline: {
      icon: WifiOff,
      title: t('offline_title'),
      desc: t('offline_desc'),
      actionLabel: t('offline_action_label'),
      color: 'text-muted-foreground',
      bg: 'bg-muted',
    },
    config: {
      icon: Settings,
      title: t('config_title'),
      desc: t('config_desc'),
      actionLabel: t('config_action_label'),
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    api: {
      icon: AlertCircle,
      title: t('api_title'),
      desc: translateMessageIfKey(message) ?? t('api_desc'),
      actionLabel: null, // Sem ação de navegação, apenas retry
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
    generic: {
      icon: AlertCircle,
      title: t('generic_title'),
      desc: translateMessageIfKey(message) ?? t('generic_desc'),
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
            {t('retry_button')}
          </Button>
        )}
      </div>
    </div>
  );
}
