import { useEffect, useState } from 'react';

/**
 * Hook para atrasar a atualização de um valor até que o usuário pare de modificá-lo.
 * Útil para otimizar buscas em tempo real ou validações custosas.
 *
 * @example
 * const searchQuery = useDebounce(inputValue, 500);
 * searchQuery só muda 500ms após o usuário parar de digitar
 *
 * @param value - Valor a ser observado
 * @param delay - Tempo de espera em milissegundos antes de atualizar
 * @returns Valor atualizado após o delay
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
