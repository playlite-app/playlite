import { Store } from '@tauri-apps/plugin-store';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Game } from '@/types';

const STORE_FILENAME = 'playlist.store';
const STORE_KEY = 'user_playlist_queue';

/**
 * Gerencia a fila de jogos a jogar com persistência local (Tauri Store).
 * Suporta reordenação manual e drag & drop.
 *
 * @param allGames - Lista completa para popular detalhes dos IDs salvos
 * @returns Objeto com:
 *   - playlistGames: Jogos completos na ordem da fila
 *   - isLoading: Estado de carregamento inicial
 *   - addToPlaylist: Adiciona jogo (evita duplicatas)
 *   - removeFromPlaylist: Remove da fila
 *   - moveUp/moveDown: Move posição individual
 *   - reorderPlaylist: Reordena via índices (para drag & drop)
 *   - isInPlaylist: Verifica se jogo está na fila
 */
export function usePlaylist(allGames: Game[]) {
  const [queueIds, setQueueIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const allGamesRef = useRef<Game[]>(allGames);

  // Atualiza a ref sempre que allGames muda
  useEffect(() => {
    allGamesRef.current = allGames;

    // Limpa IDs inválidos quando allGames é carregado
    if (allGames.length > 0 && queueIds.length > 0) {
      const validIds = queueIds.filter(id =>
        allGames.some(game => game.id === id)
      );

      if (validIds.length !== queueIds.length) {
        console.warn('Limpando IDs inválidos da playlist:', {
          antes: queueIds.length,
          depois: validIds.length,
          removidos: queueIds.filter(id => !validIds.includes(id)),
        });
        setQueueIds(validIds);

        // Salva a lista limpa no store
        (async () => {
          try {
            const store = await Store.load(STORE_FILENAME);
            await store.set(STORE_KEY, validIds);
            await store.save();
          } catch (e) {
            console.error('Erro ao salvar playlist limpa:', e);
          }
        })();
      }
    }
  }, [allGames, queueIds]);

  useEffect(() => {
    async function loadQueue() {
      try {
        const store = await Store.load(STORE_FILENAME);
        const saved = await store.get<string[]>(STORE_KEY);

        if (saved) {
          setQueueIds(saved);
        }
      } catch (e) {
        console.error('Erro ao carregar playlist:', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadQueue();
  }, []);

  const saveQueue = (newQueue: string[]) => {
    // Atualiza o estado imediatamente (síncrono)
    setQueueIds(newQueue);

    // Salva no store de forma assíncrona (não bloqueia a UI)
    (async () => {
      try {
        const store = await Store.load(STORE_FILENAME);
        await store.set(STORE_KEY, newQueue);
        await store.save();
      } catch (e) {
        console.error('Erro ao salvar playlist:', e);
      }
    })();
  };

  const addToPlaylist = (gameId: string) => {
    if (!queueIds.includes(gameId)) {
      saveQueue([...queueIds, gameId]);
    }
  };

  const removeFromPlaylist = (gameId: string) => {
    saveQueue(queueIds.filter(id => id !== gameId));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;

    const newQueue = [...queueIds];
    [newQueue[index - 1], newQueue[index]] = [
      newQueue[index],
      newQueue[index - 1],
    ];
    saveQueue(newQueue);
  };

  const moveDown = (index: number) => {
    if (index === queueIds.length - 1) return;

    const newQueue = [...queueIds];
    [newQueue[index + 1], newQueue[index]] = [
      newQueue[index],
      newQueue[index + 1],
    ];
    saveQueue(newQueue);
  };

  const reorderPlaylist = (startIndex: number, endIndex: number) => {
    const newQueue = Array.from(queueIds);
    const [removed] = newQueue.splice(startIndex, 1);
    newQueue.splice(endIndex, 0, removed);
    saveQueue(newQueue);
  };

  const playlistGames = useMemo(() => {
    return queueIds
      .map(id => allGamesRef.current.find(g => g.id === id))
      .filter((g): g is Game => !!g);
  }, [queueIds]);

  return {
    playlistGames,
    isLoading,
    addToPlaylist,
    removeFromPlaylist,
    moveUp,
    moveDown,
    reorderPlaylist,
    isInPlaylist: (id: string) => queueIds.includes(id),
  };
}
