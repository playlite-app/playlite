import { Component, ErrorInfo, ReactNode } from 'react';

import { ERROR_MESSAGES } from '@/errors/errorMessages.ts';

import { ErrorState } from '../ErrorState.tsx';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  // Traduz mensagens técnicas para as constantes
  getFriendlyMessage = (originalMessage: string) => {
    if (
      originalMessage.includes('Rendered fewer hooks') ||
      originalMessage.includes('Rendered more hooks')
    ) {
      return 'Erro de renderização detectado. A ordem dos hooks React está inconsistente. Recarregue a página para corrigir.';
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
        </div>
      );
    }

    return this.props.children;
  }
}
