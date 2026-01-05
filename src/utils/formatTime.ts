/**
 * Formata o tempo em horas para uma string legível, como "0m", "5h" ou "30m".
 * Trata valores undefined ou inválidos, convertendo para minutos e arredondando.
 * @param hours - O número de horas a ser formatado, pode ser undefined.
 * @returns Uma string representando o tempo formatado em horas ou minutos.
 */
export function formatTime(hours: number | undefined) {
  const numericHours = Number.isFinite(hours ?? NaN)
    ? (hours as number)
    : Number(hours);
  const usableHours = Math.max(0, numericHours || 0);
  const totalMinutes = Math.round(usableHours * 60);

  if (totalMinutes === 0) return '0m';

  const fullHours = Math.floor(totalMinutes / 60);

  if (fullHours >= 1) {
    return `${fullHours}h`;
  }

  return `${totalMinutes}m`;
}
