export type PlaytimeCategory = {
  label: string;
  color: string; // Para usar no Badge/Texto
  icon?: string;
};

export function getPlaytimeCategory(hours: number): PlaytimeCategory {
  if (hours < 2) {
    return { label: 'Muito Curto (< 2h)', color: 'text-blue-400' };
  }

  if (hours < 10) {
    return { label: 'Curto (2h - 10h)', color: 'text-green-400' };
  }

  if (hours < 30) {
    return { label: 'Médio (10h - 30h)', color: 'text-yellow-400' };
  }

  if (hours < 80) {
    return { label: 'Longo (30h - 80h)', color: 'text-orange-400' };
  }

  return { label: 'Épico (+80h)', color: 'text-red-500' };
}
