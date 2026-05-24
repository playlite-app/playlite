import i18n from '@/i18n';
import { isAppError } from '@/types/errors';

/**
 * Mensagens de erro centralizadas
 * Facilita manutenção, tradução e consistência
 */
export const ERROR_MESSAGES = {
  // Erros de diálogo/permissões
  DIALOG_SAVE_PERMISSION: i18n.t('error_msg_dialog_save_permission'),
  DIALOG_OPEN_PERMISSION: i18n.t('error_msg_dialog_open_permission'),

  // Erros de backup
  BACKUP_EXPORT_FAILED: i18n.t('error_msg_backup_export_failed'),
  BACKUP_IMPORT_FAILED: i18n.t('error_msg_backup_import_failed'),
  BACKUP_INVALID_FILE: i18n.t('error_msg_backup_invalid_file'),
  BACKUP_INCOMPATIBLE_VERSION: i18n.t('error_msg_backup_incompatible_version'),

  // Erros de sistema
  MUTEX_LOCK_ERROR: i18n.t('error_msg_mutex_lock'),
  FILE_NOT_FOUND: i18n.t('error_msg_file_not_found'),

  // Erros de settings
  STEAM_KEYS_REQUIRED: i18n.t('error_msg_steam_keys_required'),
  SAVE_ERROR: i18n.t('error_msg_save_error'),

  // Erros de Renderização (React)
  RENDER_HOOKS_ERROR: i18n.t('error_msg_render_hooks_error'),
  RENDER_FUNCTION_ERROR: i18n.t('error_msg_render_function_error'),
  RENDER_VARIABLE_ERROR: i18n.t('error_msg_render_variable_error'),
  RENDER_GENERIC_ERROR: i18n.t('error_msg_render_generic_error'),

  // Erros de banco de dados
  DatabaseError: i18n.t('error_msg_database_error'),

  // Erros de rede
  NetworkError: i18n.t('error_msg_network_error'),

  // Erros de plataformas/launchers
  LAUNCHER_NOT_FOUND: i18n.t('error_msg_launcher_not_found'),
  LAUNCHER_NO_GAMES: i18n.t('error_msg_launcher_no_games'),
  LAUNCHER_INVALID_PATH: i18n.t('error_msg_launcher_invalid_path'),
  LAUNCHER_CONFIG_UNREADABLE: i18n.t('error_msg_launcher_config_unreadable'),

  // Operações canceladas
  CANCELLED: i18n.t('error_msg_cancelled'), // Erro especial que não deve ser mostrado ao usuário
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

      return i18n.t('error_msg_error_accessing_file', {
        message: String(error.message),
      });

    case 'DatabaseError':
      return ERROR_MESSAGES.DatabaseError;

    case 'NetworkError':
      return ERROR_MESSAGES.NetworkError;

    case 'MutexError':
      return ERROR_MESSAGES.MUTEX_LOCK_ERROR;

    case 'SerializationError':
      return i18n.t('error_msg_error_processing_data', {
        message: String(error.message),
      });

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
    return i18n.t('error_msg_permission_denied_launcher');
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
