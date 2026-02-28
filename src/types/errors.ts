/**
 * Tipo para os erros estruturados retornados pelo backend Rust
 *
 * Corresponde ao enum AppError definido em src-tauri/src/errors.rs
 */
export interface AppError {
  type:
    | 'DatabaseError'
    | 'ValidationError'
    | 'NetworkError'
    | 'NotFound'
    | 'MutexError'
    | 'IoError'
    | 'SerializationError'
    | 'AlreadyExists';
  message: string;
}

/**
 * Type guard para verificar se um erro é do tipo AppError
 */
export function isAppError(error: unknown): error is AppError {
  const candidate = error as Record<string, unknown> | null;

  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error &&
    typeof candidate?.type === 'string' &&
    typeof candidate?.message === 'string'
  );
}

/**
 * Extrai a mensagem de erro de forma segura
 */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
