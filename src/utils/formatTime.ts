/**
 * Converte minutos (do banco de dados) em string formatada de horas.
 * Ex: 90 -> "1.5h"
 * Ex: 120 -> "2h"
 */
export function formatTime(minutes: number | undefined) {
  if (!minutes || minutes === 0) return '0h';

  const hours = minutes / 60;

  // Se for inteiro (ex: 2.0), mostra "2h" para ficar limpo
  if (Number.isInteger(hours)) {
    return `${hours}h`;
  }

  // Se tiver decimal, mostra 1 casa (ex: 1.5h)
  return `${hours.toFixed(1)}h`;
}
