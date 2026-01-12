/**
 * Busca detalhes enriquecidos de um jogo do banco de dados local e identifica versões em outras plataformas.
 *
 * @param selectedGame - Jogo para buscar detalhes, ou null
 * @param allGames - Lista completa para identificar versões multiplataforma
 * @returns Objeto com:
 *   - details: Dados do banco local (descrição, avaliações, links, HLTB, etc)
 *   - loading: Estado da requisição
 *   - siblings: Mesmo jogo em outras plataformas (array de {'id', platform})
 */
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';

import { Game, GameDetails, GamePlatformLink } from '@/types';

export function useGameDetails(selectedGame: Game | null, allGames: Game[]) {
  const [details, setDetails] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [siblings, setSiblings] = useState<GamePlatformLink[]>([]);

  useEffect(() => {
    if (!selectedGame) {
      setDetails(null);

      return;
    }

    // 1. Identifica versões em outras plataformas (Siblings)
    const related = allGames
      .filter(
        g =>
          g.name.toLowerCase() === selectedGame.name.toLowerCase() &&
          g.id !== selectedGame.id
      )
      .map(g => ({ id: g.id, platform: g.platform || 'Outra' }));
    setSiblings(related);

    // 2. Busca do Banco Local (Schema 2.0)
    const fetchLocal = async () => {
      setLoading(true);

      try {
        const data = await invoke<any>('get_library_game_details', {
          gameId: selectedGame.id,
        });

        if (data) {
          // Dados já vêm no formato correto do banco (Schema 2.0)
          setDetails(data);
        } else {
          setDetails(null);
        }
      } catch (err) {
        console.error('Erro ao carregar detalhes locais:', err);
        setDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLocal();
  }, [selectedGame, allGames]);

  return { details, loading, siblings };
}
