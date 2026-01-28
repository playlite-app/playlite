import { Gamepad, Globe, LucideIcon, Monitor } from 'lucide-react';

/**
 * Utilitários para gerenciar informações de plataforma de jogos.
 * Centraliza lógica compartilhada entre componentes de cards.
 */

/**
 * Retorna o ícone apropriado para uma plataforma
 *
 * @param platform - Nome da plataforma (ex: "Steam", "GOG", "Epic Games")
 * @returns Componente de ícone do Lucide
 */
export function getPlatformIcon(platform: string): LucideIcon {
  const p = platform.toLowerCase();

  if (p.includes('steam')) return Monitor;

  if (p.includes('gog')) return Globe;

  if (p.includes('epic')) return Gamepad;

  return Gamepad;
}

/**
 * Retorna o label limpo da plataforma
 *
 * @param platform - String da plataforma (pode conter "PC, Steam" ou similar)
 * @returns Label formatado (ex: "Steam", "Epic Games", "GOG")
 */
export function getPlatformLabel(platform: string): string {
  if (platform.includes('Epic')) return 'Epic Games';

  if (platform.includes('Steam')) return 'Steam';

  if (platform.includes('GOG')) return 'GOG';

  if (platform.includes('Prime')) return 'Amazon Prime';

  if (platform.includes('Ubisoft')) return 'Ubisoft';

  return platform.replace('PC, ', '');
}

/**
 * Retorna as classes Tailwind para cor da badge da plataforma
 *
 * @param platform - Nome da plataforma
 * @returns String com classes Tailwind (ex: "bg-blue-600 text-white")
 */
export function getPlatformColor(platform: string): string {
  if (platform.includes('Epic')) return 'bg-slate-900 text-white';

  if (platform.includes('Steam')) return 'bg-blue-600 text-white';

  if (platform.includes('Prime')) return 'bg-cyan-600 text-white';

  return 'bg-purple-600 text-white';
}
