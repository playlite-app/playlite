import { isAppError } from '@/types/errors';

/**
 * Mensagens de erro centralizadas
 * Facilita manutenção, tradução e consistência
 */
export const ERROR_MESSAGES = {
  // Erros de diálogo/permissões
  DIALOG_SAVE_PERMISSION: 'Permissão necessária para salvar arquivos.',
  DIALOG_OPEN_PERMISSION: 'Permissão necessária para abrir arquivos.',

  // Erros de backup
  BACKUP_EXPORT_FAILED: 'Não foi possível exportar o backup. Tente novamente.',
  BACKUP_IMPORT_FAILED:
    'Não foi possível importar o backup. Verifique se o arquivo está correto.',
  BACKUP_INVALID_FILE:
    'Arquivo inválido. Selecione um backup válido do Playlite.',
  BACKUP_INCOMPATIBLE_VERSION:
    'Versão do backup não é compatível com esta versão do app.',

  // Erros de sistema
  MUTEX_LOCK_ERROR: 'Tente novamente em alguns segundos.',
  FILE_NOT_FOUND: 'Arquivo não encontrado.',

  // Erros de settings
  STEAM_KEYS_REQUIRED: 'Preencha e salve as chaves da Steam primeiro.',
  SAVE_ERROR: 'Erro ao salvar',

  // Erros de Renderização (React)
  RENDER_HOOKS_ERROR: 'Erro interno de compilação (Conflito de Hooks).',
  RENDER_FUNCTION_ERROR: 'Erro de lógica: Uma função inválida foi chamada.',
  RENDER_VARIABLE_ERROR: 'Erro de referência: Variável não definida.',
  RENDER_GENERIC_ERROR: 'Ocorreu um erro inesperado na interface.',

  // Erros de banco de dados
  DatabaseError: 'Houve um problema ao salvar no disco local.',

  // Erros de rede
  NetworkError: 'Verifique sua conexão com a internet.',

  // Operações canceladas
  CANCELLED: 'CANCELLED', // Erro especial que não deve ser mostrado ao usuário
} as const;

/**
 * Verifica se um erro contém determinadas palavras-chave
 */
export function matchesErrorPattern(
  error: unknown,
  patterns: string[]
): boolean {
  const errorStr = String(error);

  return patterns.some(pattern => errorStr.includes(pattern));
}

/**
 * Extrai mensagem de erro amigável baseada no erro recebido
 */
export function parseBackupError(error: unknown): string {
  // Se for um AppError estruturado, trata de forma especial
  if (isAppError(error)) {
    switch (error.type) {
      case 'ValidationError':
        // Validações específicas
        if (error.message.includes('backup inválido')) {
          return ERROR_MESSAGES.BACKUP_INVALID_FILE;
        }

        if (error.message.includes('incompatível')) {
          return ERROR_MESSAGES.BACKUP_INCOMPATIBLE_VERSION;
        }

        return error.message;

      case 'IoError':
        if (error.message.includes('No such file')) {
          return ERROR_MESSAGES.FILE_NOT_FOUND;
        }

        return `Erro ao acessar arquivo: ${error.message}`;

      case 'DatabaseError':
        return ERROR_MESSAGES.DatabaseError;

      case 'NetworkError':
        return ERROR_MESSAGES.NetworkError;

      case 'MutexError':
        return ERROR_MESSAGES.MUTEX_LOCK_ERROR;

      case 'SerializationError':
        return `Erro ao processar dados: ${error.message}`;

      case 'AlreadyExists':
        return error.message;

      case 'NotFound':
        return error.message;

      default:
        return error.message;
    }
  }

  // Fallback para erros não estruturados (legacy)
  const errorStr = String(error);

  // Verifica permissões de diálogo
  if (
    matchesErrorPattern(error, ['dialog.save not allowed', 'dialog:allow-save'])
  ) {
    return ERROR_MESSAGES.DIALOG_SAVE_PERMISSION;
  }

  if (
    matchesErrorPattern(error, ['dialog.open not allowed', 'dialog:allow-open'])
  ) {
    return ERROR_MESSAGES.DIALOG_OPEN_PERMISSION;
  }

  // Verifica erros de backup
  if (errorStr.includes('Arquivo de backup inválido')) {
    return ERROR_MESSAGES.BACKUP_INVALID_FILE;
  }

  if (errorStr.includes('Versão de backup incompatível')) {
    return ERROR_MESSAGES.BACKUP_INCOMPATIBLE_VERSION;
  }

  // Verifica erros de sistema
  if (matchesErrorPattern(error, ['Falha no Mutex', 'lock'])) {
    return ERROR_MESSAGES.MUTEX_LOCK_ERROR;
  }

  if (errorStr.includes('No such file')) {
    return ERROR_MESSAGES.FILE_NOT_FOUND;
  }

  // Erro genérico
  return errorStr;
}
