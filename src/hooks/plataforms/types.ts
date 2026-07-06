/**
 * Status exibido nas telas de configuração de plataformas (StatusBadge).
 */
export interface ImportStatus {
  type: 'success' | 'error' | null;
  message: string;
}

/**
 * Payload emitido pelo backend durante uma importação em andamento.
 */
export interface ImportProgressPayload {
  current: number;
  total: number;
  game: string;
}
