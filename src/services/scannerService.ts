import { invoke } from '@tauri-apps/api/core';

import { ExecutableCandidate, GameDiscovery, ScanResult } from '@/types';

/**
 * Escaneia a pasta de jogos fornecida para descobrir jogos instalados.
 *
 * @param folderPath
 */
export async function scanGamesFolder(folderPath: string): Promise<ScanResult> {
  return await invoke<ScanResult>('scan_games_folder', { folderPath });
}

/** Retorna o executável com a maior pontuação de ranking dentre os candidatos.
 *
 * @param discovery - Descoberta de jogo com candidatos a executáveis
 * @returns Melhor candidato a executável ou null se nenhum disponível
 */
export function getBestExecutable(
  discovery: GameDiscovery
): ExecutableCandidate | null {
  if (discovery.executables.length === 0) return null;

  return discovery.executables.reduce((best, current) =>
    current.rank_score > best.rank_score ? current : best
  );
}

/** Formata tamanho de arquivo em MB ou GB conforme apropriado.
 *
 * @param sizeMb - Tamanho do arquivo em megabytes
 * @returns Tamanho formatado como string
 */
export function formatFileSize(sizeMb: number): string {
  if (sizeMb < 1024) {
    return `${sizeMb} MB`;
  }

  return `${(sizeMb / 1024).toFixed(2)} GB`;
}
