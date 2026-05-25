import { Component, ErrorInfo, ReactNode } from 'react';

import { ErrorState } from '@/components';
import { ERROR_MESSAGES } from '@/errors/errorMessages';
import { Button } from '@/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  // Quando disponível, guarda o stack/componentStack para ajudar debugging
  details?: string | null;
  showDetails?: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      details: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log completo no console para desenvolvedores
    console.error('Uncaught error:', error, errorInfo);

    const details = [error.stack ?? '', errorInfo?.componentStack ?? '']
      .filter(Boolean)
      .join('\n\n');

    // Atualiza o estado com detalhes para permitir exibir/copiá-los na UI
    this.setState({ details });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    globalThis.location.reload();
  };

  // Traduz mensagens técnicas para as constantes
  getFriendlyMessage = (originalMessage: string) => {
    if (
      originalMessage.includes('Rendered fewer hooks') ||
      originalMessage.includes('Rendered more hooks')
    ) {
      return ERROR_MESSAGES.RENDER_HOOKS_ERROR;
    }

    if (originalMessage.includes('is not a function')) {
      return ERROR_MESSAGES.RENDER_FUNCTION_ERROR;
    }

    if (originalMessage.includes('is not defined')) {
      return ERROR_MESSAGES.RENDER_VARIABLE_ERROR;
    }

    // Fallback genérico se não reconhecer o erro
    return originalMessage || ERROR_MESSAGES.RENDER_GENERIC_ERROR;
  };

  render() {
    if (this.state.hasError) {
      const originalMsg = this.state.error?.message || '';
      const friendlyMsg = this.getFriendlyMessage(originalMsg);

      return (
        <div className="animate-in fade-in flex h-full flex-col items-center justify-center p-8">
          <ErrorState
            type="generic"
            message={friendlyMsg}
            onRetry={this.handleRetry} // Passa a função, o ErrorState cria o botão
          />

          {/* Detalhes técnicos — escondidos por padrão, úteis para debugging */}
          <div className="mt-4 w-full max-w-2xl text-left">
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground text-sm">
                Detalhes técnicos
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    this.setState(s => ({ showDetails: !s.showDetails }))
                  }
                >
                  {this.state.showDetails ? 'Ocultar' : 'Mostrar'}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => {
                    const payload = [originalMsg, this.state.details]
                      .filter(Boolean)
                      .join('\n\n');

                    try {
                      void navigator.clipboard.writeText(payload ?? '');
                    } catch (e) {
                      // Fallback: abrir console para o usuário copiar manualmente
                      console.warn('Falha ao copiar detalhes do erro', e);
                    }
                  }}
                >
                  Copiar
                </Button>
              </div>
            </div>

            {this.state.showDetails && (
              <pre className="bg-background/60 mt-2 max-h-72 overflow-auto rounded p-3 text-xs">{`${originalMsg}\n\n${this.state.details ?? ''}`}</pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
