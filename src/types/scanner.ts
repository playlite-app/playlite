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
  basePath: string;
  suggestedName: string;
  confidence: number;
  executables: ExecutableCandidate[];
}

export interface ExecutableCandidate {
  path: string;
  filename: string;
  sizeMb: number;
  rankScore: number;
  executableType: 'WindowsExe' | 'LinuxElf' | 'Script' | 'Unknown';
}
