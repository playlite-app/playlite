import { useState } from 'react';

interface HeroCarouselReturn {
  currentIndex: number;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
}

/**
 * Hook para gerenciar o carrossel de jogos no Hero.
 * Controla navegação entre os jogos destacados.
 *
 * @param totalItems - Total de itens no carrossel
 * @returns {HeroCarouselReturn} Estado e funções do carrossel
 *   - currentIndex: Índice do item atual
 *   - next: Avança para o próximo item
 *   - prev: Retorna para o item anterior
 *   - goTo: Vai para um índice específico
 */
export function useHeroCarousel(totalItems: number): HeroCarouselReturn {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    if (totalItems === 0) return;

    setCurrentIndex(prev => (prev + 1) % totalItems);
  };

  const prev = () => {
    if (totalItems === 0) return;

    setCurrentIndex(prev => (prev - 1 + totalItems) % totalItems);
  };

  const goTo = (index: number) => {
    if (totalItems === 0) return;

    if (index >= 0 && index < totalItems) {
      setCurrentIndex(index);
    }
  };

  return {
    currentIndex,
    next,
    prev,
    goTo,
  };
}
