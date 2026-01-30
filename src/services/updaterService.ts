import { invoke } from '@tauri-apps/api/core';

export interface AppVersionInfo {
  currentVersion: string;
  previousVersion: string | null;
}

/**
 * Busca informações de versão do aplicativo.
 *
 * @returns Objeto contendo a versão atual e a versão anterior (se disponível)
 */
export async function getAppVersionInfo(): Promise<AppVersionInfo> {
  return invoke<AppVersionInfo>('get_app_version_info');
}
