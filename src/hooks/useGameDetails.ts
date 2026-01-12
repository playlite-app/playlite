import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';

import { Game, GameDetails, GamePlatformLink } from '@/types';

export function useGameDetails(selectedGame: Game | null, allGames: Game[]) {
  const [details, setDetails] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [siblings, setSiblings] = useState<GamePlatformLink[]>([]);

  useEffect(() => {
    // Se nenhum jogo foi selecionado, limpa o estado
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

    // 2. Busca detalhes do banco de dados local
    const loadData = async () => {
      setLoading(true);

      try {
        const localData = await invoke<GameDetails>(
          'get_library_game_details',
          {
            gameId: selectedGame.id,
          }
        );

        // Se encontrou, define os detalhes; senão, define como null
        setDetails(localData || null);
      } catch (err) {
        console.error('Erro ao carregar detalhes locais:', err);
        setDetails(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedGame, allGames]);

  return { details, loading, siblings };
}
