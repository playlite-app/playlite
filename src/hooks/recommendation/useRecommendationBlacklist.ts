import { Store } from '@tauri-apps/plugin-store';
import { useCallback, useEffect, useState } from 'react';

const STORE_FILENAME = 'tooltips.store';

/**
 * Hook para gerenciar a blacklist de jogos ignorados (feedback negativo).
 *
 * Quando um usuário marca um jogo como "Não Útil", ele é adicionado à blacklist
 * e não aparecerá mais nas recomendações futuras.
 * A blacklist é persistida localmente usando Tauri Store.
 *
 * @returns Objeto com lista de ignorados e ações de gerenciamento
 */
export function useRecommendationBlacklist() {
  const [ignoredIds, setIgnoredIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  // Carregar blacklist do store
  useEffect(() => {
    const loadBlacklist = async () => {
      try {
        const store = await Store.load(STORE_FILENAME);
        const savedIgnored = await store.get<string[]>('ignored_ids');

        if (savedIgnored) {
          setIgnoredIds(savedIgnored);
        }
      } catch (e) {
        console.warn('Erro ao carregar blacklist:', e);
      } finally {
        setReady(true);
      }
    };

    loadBlacklist();
  }, []);

  // Adiciona um jogo à blacklist
  const addToBlacklist = useCallback(
    async (gameId: string) => {
      const newIgnored = [...ignoredIds, gameId];
      setIgnoredIds(newIgnored);

      try {
        const store = await Store.load(STORE_FILENAME);
        await store.set('ignored_ids', newIgnored);
        await store.save();
      } catch (e) {
        console.error('Erro ao salvar blacklist:', e);
      }
    },
    [ignoredIds]
  );

  // Remove um jogo da blacklist
  const removeFromBlacklist = useCallback(
    async (gameId: string) => {
      const newIgnored = ignoredIds.filter(id => id !== gameId);
      setIgnoredIds(newIgnored);

      try {
        const store = await Store.load(STORE_FILENAME);
        await store.set('ignored_ids', newIgnored);
        await store.save();
      } catch (e) {
        console.error('Erro ao remover da blacklist:', e);
      }
    },
    [ignoredIds]
  );

  // Limpa toda a blacklist (reseta feedback)
  const clearBlacklist = useCallback(async () => {
    setIgnoredIds([]);

    try {
      const store = await Store.load(STORE_FILENAME);
      await store.set('ignored_ids', []);
      await store.save();
    } catch (e) {
      console.error('Erro ao limpar blacklist:', e);
    }
  }, []);

  return {
    ignoredIds,
    ready,
    addToBlacklist,
    removeFromBlacklist,
    clearBlacklist,
  };
}
