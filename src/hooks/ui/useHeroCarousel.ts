import { useCallback, useEffect, useRef, useState } from 'react';

interface UseHeroCarouselOptions {
  /**
   * Intervalo do avanço automático em milissegundos. Se omitido, o
   * carrossel fica só com navegação manual (comportamento original).
   */
  autoAdvanceMs?: number;
}

interface HeroCarouselReturn {
  currentIndex: number;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  pauseAutoAdvance: () => void; // Pausa o avanço automático (ex: quando o mouse está sobre o Hero).
  resumeAutoAdvance: () => void; // Retoma o avanço automático.
}

/**
 * Hook para gerenciar o carrossel de jogos no Hero.
 * Controla navegação entre os jogos destacados.
 *
 * @param totalItems - Total de itens no carrossel
 * @param autoAdvanceMs - Intervalo do avanço automático; omitir desativa
 *
 * @returns {HeroCarouselReturn} Estado e funções do carrossel
 *   - currentIndex: Índice do item atual
 *   - next: Avança para o próximo item
 *   - prev: Retorna para o item anterior
 *   - goTo: Vai para um índice específico
 */
export function useHeroCarousel(
  totalItems: number,
  { autoAdvanceMs }: UseHeroCarouselOptions = {}
): HeroCarouselReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const next = useCallback(() => {
    if (totalItems === 0) return;

    setCurrentIndex(prev => (prev + 1) % totalItems);
  }, [totalItems]);

  const prev = useCallback(() => {
    if (totalItems === 0) return;

    setCurrentIndex(prev => (prev - 1 + totalItems) % totalItems);
  }, [totalItems]);

  const goTo = useCallback(
    (index: number) => {
      if (totalItems === 0) return;

      if (index >= 0 && index < totalItems) {
        setCurrentIndex(index);
      }
    },
    [totalItems]
  );

  // Avanço automático. Reinicia a contagem sempre que o usuário navega manualmente e
  // desliga quando pausado, sem itens suficientes, ou sem intervalo configurado.
  useEffect(() => {
    clearTimer();

    if (!autoAdvanceMs || isPaused || totalItems <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % totalItems);
    }, autoAdvanceMs);

    return clearTimer;
  }, [autoAdvanceMs, isPaused, totalItems, currentIndex, clearTimer]);

  return {
    currentIndex,
    next,
    prev,
    goTo,
    pauseAutoAdvance: () => setIsPaused(true),
    resumeAutoAdvance: () => setIsPaused(false),
  };
}
