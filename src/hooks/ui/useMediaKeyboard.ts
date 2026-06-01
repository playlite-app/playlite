import { useEffect } from 'react';

interface UseMediaKeyboardProps {
  enabled: boolean;
  activeIndex: number;
  totalItems: number;
  onNavigate: (index: number) => void;
}

/**
 * Hook para navegação por teclado (← →) em uma fila de mídia.
 *
 * @param enabled - Ativa o listener apenas quando a mídia está carregada
 * @param activeIndex - Índice do item atualmente ativo
 * @param totalItems - Total de itens na fila
 * @param onNavigate - Callback chamado com o novo índice
 */
export function useMediaKeyboard({
  enabled,
  activeIndex,
  totalItems,
  onNavigate,
}: UseMediaKeyboardProps): void {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && activeIndex > 0) {
        onNavigate(activeIndex - 1);
      }

      if (e.key === 'ArrowRight' && activeIndex < totalItems - 1) {
        onNavigate(activeIndex + 1);
      }
    };

    window.addEventListener('keydown', handler);

    return () => window.removeEventListener('keydown', handler);
  }, [enabled, activeIndex, totalItems, onNavigate]);
}
