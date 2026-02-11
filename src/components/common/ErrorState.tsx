import { AlertCircle, RefreshCcw, Settings, WifiOff } from 'lucide-react';

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
  const content = {
    offline: {
      icon: WifiOff,
      title: 'Você está offline',
      desc: "A seção 'Em Alta' precisa de internet para buscar as novidades.",
      actionLabel: 'Ir para Minha Biblioteca',
      color: 'text-muted-foreground',
      bg: 'bg-muted',
    },
    config: {
      icon: Settings,
      title: 'Integração não configurada',
      desc: 'Para ver jogos em alta, você precisa adicionar sua API Key da RAWG.',
      actionLabel: 'Ir para Configurações',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    api: {
      icon: AlertCircle,
      title: 'Falha na conexão',
      desc: message || 'O servidor da RAWG não respondeu corretamente.',
      actionLabel: null, // Sem ação de navegação, apenas retry
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
    generic: {
      icon: AlertCircle,
      title: 'Ops! Algo deu errado',
      desc: message || 'Ocorreu um erro inesperado.',
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
            Tentar Novamente
          </Button>
        )}
      </div>
    </div>
  );
}
