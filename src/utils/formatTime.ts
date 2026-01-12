/**
 * Converte minutos (do banco de dados) em ‘string’ formatada.
 * - Menos de 1h: Retorna em minutos (ex: "45m")
 * - Mais de 1h: Retorna em horas (ex: "1.5h", "2h")
 */
export function formatTime(minutes: number | undefined) {
  if (!minutes || minutes === 0) return '0h';

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = minutes / 60;

  if (Number.isInteger(hours)) {
    return `${hours}h`;
  }

  return `${hours.toFixed(1)}h`;
}
