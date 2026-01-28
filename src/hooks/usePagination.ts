import { useCallback, useState } from 'react';

/**
 * Hook para gerenciar paginação incremental (Ver Mais).
 * Útil para listas longas com carregamento progressivo.
 *
 * @param initialLimit - Quantidade inicial de itens
 * @param increment - Quantidade a adicionar ao clicar "Ver Mais"
 * @returns Objeto com limite atual e função para aumentar
 */
export function usePagination(
  initialLimit: number = 10,
  increment: number = 10
) {
  const [limit, setLimit] = useState(initialLimit);

  const loadMore = useCallback(() => {
    setLimit(prev => prev + increment);
  }, [increment]);

  const reset = useCallback(() => {
    setLimit(initialLimit);
  }, [initialLimit]);

  return {
    limit,
    loadMore,
    reset,
  };
}

/**
 * Hook para gerenciar lista com paginação e filtro.
 * Combina paginação com capacidade de filtrar itens.
 *
 * @param items - Lista completa de itens
 * @param filterFn - Função de filtro (retorna true para manter o item)
 * @param initialLimit - Quantidade inicial visível
 * @returns Objeto com itens paginados e controles
 */
export function usePaginatedList<T>(
  items: T[],
  filterFn: (item: T) => boolean,
  initialLimit: number = 10
) {
  const { limit, loadMore, reset } = usePagination(initialLimit);

  const filteredItems = items.filter(filterFn);
  const paginatedItems = filteredItems.slice(0, limit);
  const hasMore = filteredItems.length > limit;

  return {
    items: paginatedItems,
    totalFiltered: filteredItems.length,
    totalItems: items.length,
    hasMore,
    loadMore,
    reset,
    currentLimit: limit,
  };
}
