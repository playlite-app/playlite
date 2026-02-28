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

  // Erros de plataformas/launchers
  LAUNCHER_NOT_FOUND:
    'Launcher não instalado ou localização incorreta. Verifique se está instalado ou informe o diretório manualmente.',
  LAUNCHER_NO_GAMES:
    'Nenhum jogo encontrado. Certifique-se de ter jogos instalados.',
  LAUNCHER_INVALID_PATH:
    'Diretório informado não contém uma instalação válida do launcher.',
  LAUNCHER_CONFIG_UNREADABLE:
    'Não foi possível ler os arquivos de configuração do launcher.',

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

function parseBackupAppError(error: { type: string; message: string }): string {
  switch (error.type) {
    case 'ValidationError':
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
    case 'NotFound':
    default:
      return error.message;
  }
}

function parseBackupLegacyError(error: unknown): string {
  const errorStr = String(error);

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

  if (errorStr.includes('Arquivo de backup inválido')) {
    return ERROR_MESSAGES.BACKUP_INVALID_FILE;
  }

  if (errorStr.includes('Versão de backup incompatível')) {
    return ERROR_MESSAGES.BACKUP_INCOMPATIBLE_VERSION;
  }

  if (matchesErrorPattern(error, ['Falha no Mutex', 'lock'])) {
    return ERROR_MESSAGES.MUTEX_LOCK_ERROR;
  }

  if (errorStr.includes('No such file')) {
    return ERROR_MESSAGES.FILE_NOT_FOUND;
  }

  return errorStr;
}

function parsePlatformValidationError(message: string): string {
  const msg = message.toLowerCase();

  if (
    msg.includes('não encontrado') ||
    msg.includes('not found') ||
    msg.includes('não está instalado') ||
    msg.includes('not installed')
  ) {
    return ERROR_MESSAGES.LAUNCHER_NOT_FOUND;
  }

  if (
    msg.includes('inválido') ||
    msg.includes('invalid') ||
    msg.includes('incorreto') ||
    msg.includes('incorrect') ||
    msg.includes('not a directory') ||
    msg.includes('diretório')
  ) {
    return ERROR_MESSAGES.LAUNCHER_INVALID_PATH;
  }

  return message;
}

function parsePlatformIoError(message: string): string {
  const msg = message.toLowerCase();

  if (msg.includes('no such file') || msg.includes('not found')) {
    return ERROR_MESSAGES.LAUNCHER_NOT_FOUND;
  }

  if (msg.includes('permission denied') || msg.includes('access is denied')) {
    return `Permissão negada ao acessar os arquivos do launcher.`;
  }

  return ERROR_MESSAGES.LAUNCHER_CONFIG_UNREADABLE;
}

function parsePlatformAppError(error: {
  type: string;
  message: string;
}): string {
  switch (error.type) {
    case 'ValidationError':
      return parsePlatformValidationError(error.message);

    case 'IoError':
      return parsePlatformIoError(error.message);

    case 'SerializationError':
      return ERROR_MESSAGES.LAUNCHER_CONFIG_UNREADABLE;

    case 'NotFound':
      return ERROR_MESSAGES.LAUNCHER_NOT_FOUND;

    case 'DatabaseError':
      return ERROR_MESSAGES.DatabaseError;

    case 'MutexError':
      return ERROR_MESSAGES.MUTEX_LOCK_ERROR;

    default:
      return error.message;
  }
}

function parsePlatformLegacyError(error: unknown): string {
  const errorStr = String(error);

  if (errorStr === '[object Object]') {
    return ERROR_MESSAGES.LAUNCHER_NOT_FOUND;
  }

  if (
    matchesErrorPattern(error, ['dialog.open not allowed', 'dialog:allow-open'])
  ) {
    return ERROR_MESSAGES.DIALOG_OPEN_PERMISSION;
  }

  return errorStr;
}

/**
 * Extrai mensagem de erro amigável baseada no erro recebido
 */
export function parseBackupError(error: unknown): string {
  if (isAppError(error)) {
    return parseBackupAppError(error);
  }

  return parseBackupLegacyError(error);
}

/**
 * Extrai mensagem de erro amigável para operações de importação de plataformas
 * (Steam, Epic, Heroic, Ubisoft, etc.).
 *
 * Tauri serializa AppError como `{ type: string; message: string }`, portanto
 * `String(e)` produziria "[object Object]". Esta função trata todos os casos.
 */
export function parsePlatformError(error: unknown): string {
  if (isAppError(error)) {
    return parsePlatformAppError(error);
  }

  return parsePlatformLegacyError(error);
}
