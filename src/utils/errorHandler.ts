import { toast } from '@/utils/toast';

import { AppError, getErrorMessage, isAppError } from '@/types/errors';

/**
 * Opções para o handler de erros
 */
interface ErrorHandlerOptions {
  /** Mensagem padrão se não houver uma específica */
  defaultMessage?: string;
  /** Se deve mostrar toast automaticamente */
  showToast?: boolean;
  /** Tipo de toast (error, warning, info) */
  toastType?: 'error' | 'warning' | 'info';
  /** Callback personalizado para logging */
  onError?: (error: unknown) => void;
}

/**
 * Handler genérico para erros do backend
 * Trata AppError estruturados e fornece feedback apropriado
 */
export function handleBackendError(
  error: unknown,
  options: ErrorHandlerOptions = {}
): string {
  const {
    defaultMessage = 'Ocorreu um erro inesperado',
    showToast = true,
    toastType = 'error',
    onError,
  } = options;

  // Log do erro se callback fornecido
  if (onError) {
    onError(error);
  } else {
    console.error('Backend error:', error);
  }

  let message: string;

  // Trata AppError estruturado
  if (isAppError(error)) {
    message = formatAppError(error);
  } else {
    message = getErrorMessage(error) || defaultMessage;
  }

  // Mostra toast se solicitado
  if (showToast) {
    switch (toastType) {
      case 'error':
        toast.error(message);
        break;
      case 'warning':
        toast.warning(message);
        break;
      case 'info':
        toast.info(message);
        break;
    }
  }

  return message;
}

/**
 * Formata um AppError para exibição ao usuário
 */
function formatAppError(error: AppError): string {
  switch (error.type) {
    case 'ValidationError':
      return `Validação: ${error.message}`;

    case 'DatabaseError':
      return `Erro ao salvar dados: ${error.message}`;

    case 'NetworkError':
      return `Erro de conexão: ${error.message}`;

    case 'NotFound':
      return `Não encontrado: ${error.message}`;

    case 'IoError':
      return `Erro ao acessar arquivo: ${error.message}`;

    case 'SerializationError':
      return `Erro ao processar dados: ${error.message}`;

    case 'AlreadyExists':
      return `Já existe: ${error.message}`;

    case 'MutexError':
      return 'Recurso temporariamente ocupado. Tente novamente em alguns segundos.';

    default:
      return error.message;
  }
}

/**
 * Helper específico para erros de API key ausente
 */
export function handleMissingApiKey(apiName: string): void {
  toast.warning(`Configure a API key da ${apiName} nas configurações.`, {
    duration: 5000,
  });
}

/**
 * Helper para erros de rede com retry
 */
export function handleNetworkError(
  error: unknown,
  retryCallback?: () => void
): void {
  const message = isAppError(error)
    ? error.message
    : 'Erro de conexão. Verifique sua internet.';

  if (retryCallback) {
    toast.error(message, {
      action: {
        label: 'Tentar novamente',
        onClick: retryCallback,
      },
    });
  } else {
    toast.error(message);
  }
}

/**
 * Helper para validações
 */
export function handleValidationError(error: unknown): string {
  if (isAppError(error) && error.type === 'ValidationError') {
    toast.warning(error.message);

    return error.message;
  }

  const message = getErrorMessage(error);
  toast.warning(message);

  return message;
}

