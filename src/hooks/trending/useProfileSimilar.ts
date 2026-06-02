import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';

import { SimilarGame } from '@/types';
import { Game } from '@/types/game';

interface UseProfileSimilarResult {
  games: SimilarGame[];
  loading: boolean;
  error: string | null;
  hasAnchors: boolean; // false se biblioteca vazia — oculta a seção
}

export function useProfileSimilar(userGames: Game[]): UseProfileSimilarResult {
  const [games, setGames] = useState<SimilarGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Só executa se tiver jogos na biblioteca
  const hasAnchors = userGames.length > 0;

  useEffect(() => {
    if (!hasAnchors) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await invoke<SimilarGame[]>(
          'get_profile_similar_games',
          { userGames }
        );

        if (!cancelled) {
          setGames(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(typeof err === 'string' ? err : 'Erro ao buscar sugestões');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
    // Roda apenas uma vez por montagem — userGames é estável após carga inicial
  }, [hasAnchors]);

  return { games, loading, error, hasAnchors };
}
