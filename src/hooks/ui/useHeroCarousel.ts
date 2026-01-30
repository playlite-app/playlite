import { useState } from 'react';

/**
 * Hook para gerenciar o carrossel de jogos no Hero.
 * Controla navegação entre os jogos destacados.
 *
 * @param totalItems - Total de itens no carrossel
 * @returns {Object} Estado e funções do carrossel
 *   - currentIndex: Índice do item atual
 *   - next: Avança para o próximo item
 *   - prev: Retorna para o item anterior
 *   - goTo: Vai para um índice específico
 */
export function useHeroCarousel(totalItems: number): object {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex(prev => (prev + 1) % totalItems);
  };

  const prev = () => {
    setCurrentIndex(prev => (prev - 1 + totalItems) % totalItems);
  };

  const goTo = (index: number) => {
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
