import { Gamepad, Globe, LucideIcon, Monitor, Package } from 'lucide-react';

/**
 * Utilitários para gerenciar informações de plataforma de jogos.
 * Centraliza lógica compartilhada entre componentes de cards.
 */

/**
 * Retorna o ícone apropriado para uma plataforma
 */
export function getPlatformIcon(platform: string): LucideIcon {
  const p = platform.toLowerCase();

  if (p.includes('steam')) return Monitor;

  if (p.includes('gog')) return Globe;

  if (p.includes('epic')) return Gamepad;

  if (p.includes('legacy')) return Package;

  return Gamepad;
}

/**
 * Retorna o label limpo da plataforma
 */
export function getPlatformLabel(platform: string): string {
  if (platform.includes('Epic')) return 'Epic Games';

  if (platform.includes('Steam')) return 'Steam';

  if (platform.includes('GOG')) return 'GOG';

  if (platform.includes('Prime')) return 'Amazon Prime';

  if (platform.includes('Ubisoft')) return 'Ubisoft';

  if (platform.includes('Legacy')) return 'Legacy Games';

  if (platform.includes('Heroic')) return 'Heroic';

  return platform.replace('PC, ', '');
}

/**
 * Retorna as classes Tailwind para cor da badge da plataforma
 */
export function getPlatformColor(platform: string): string {
  if (platform.includes('Epic')) return 'bg-slate-900 text-white';

  if (platform.includes('Steam')) return 'bg-blue-600 text-white';

  if (platform.includes('Prime')) return 'bg-cyan-600 text-white';

  if (platform.includes('Legacy')) return 'bg-orange-600 text-white';

  if (platform.includes('Ubisoft')) return 'bg-indigo-600 text-white';

  if (platform.includes('Heroic')) return 'bg-yellow-600 text-white';

  if (platform.includes('GOG')) return 'bg-violet-600 text-white';

  return 'bg-purple-600 text-white';
}
