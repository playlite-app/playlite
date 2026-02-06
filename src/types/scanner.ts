/**
 * Tipos relacionados para o scanner de jogos na aplicação.
 * Inclui resultados de varredura e descobertas de jogos.
 */

export interface ScanResult {
  success: boolean;
  message: string;
  discoveries: GameDiscovery[];
}

export interface GameDiscovery {
  id: string;
  base_path: string;
  suggested_name: string;
  confidence: number;
  executables: ExecutableCandidate[];
}

export interface ExecutableCandidate {
  path: string;
  filename: string;
  size_mb: number;
  rank_score: number;
  executable_type: 'WindowsExe' | 'LinuxElf' | 'Script' | 'Unknown';
}
