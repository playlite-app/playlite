import { useMemo } from 'react';

import { WishlistGame } from '@/types';

/**
 * Hook para filtrar jogos da wishlist por termo de busca.
 * Busca no nome do jogo (case-insensitive).
 *
 * @param games - Lista completa de jogos da wishlist
 * @param searchTerm - Termo de busca
 * @returns Jogos filtrados
 */
export function useWishlistFilter(games: WishlistGame[], searchTerm: string) {
  return useMemo(() => {
    if (!searchTerm) return games;

    const lowerTerm = searchTerm.toLowerCase();

    return games.filter(game => game.name.toLowerCase().includes(lowerTerm));
  }, [games, searchTerm]);
}

/**
 * Hook para formatar dados de preço de um jogo da wishlist.
 *
 * @param currentPrice - Preço atual (pode ser null/undefined)
 * @param currency - Moeda (BRL, USD, etc)
 * @returns String formatada do preço ou "Aguardando..."
 */
export function useFormattedPrice(
  currentPrice: number | null | undefined,
  currency?: string
): string {
  return useMemo(() => {
    if (currentPrice === null || currentPrice === undefined) {
      return 'Aguardando...';
    }

    const currencySymbol =
      currency === 'BRL' ? 'R$' : currency === 'USD' ? 'US$' : currency || '';

    return `${currencySymbol} ${currentPrice.toFixed(2)}`;
  }, [currentPrice, currency]);
}

/**
 * Hook para construir URL de loja para jogos da wishlist.
 * Prioriza storeUrl, depois constrói URL do ITAD se tiver itadId.
 *
 * @param storeUrl - URL direta da loja (opcional)
 * @param itadId - ID do IsThereAnyDeal (opcional)
 * @param storePlatform - Nome da plataforma (Steam, Epic, etc)
 * @returns Objeto com URL e label da loja
 */
export function useStoreUrl(
  storeUrl: string | null | undefined,
  itadId: string | null | undefined,
  storePlatform?: string | null
) {
  return useMemo(() => {
    const url =
      storeUrl ||
      (itadId ? `https://isthereanydeal.com/game/${itadId}/` : null);

    const label = storePlatform
      ? `Abrir em ${storePlatform}`
      : url
        ? 'Ver na ITAD'
        : 'Link indisponível';

    return { url, label };
  }, [storeUrl, itadId, storePlatform]);
}
