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

    // 2. Lógica de Busca Inteligente
    const loadData = async () => {
      setLoading(true);

      try {
        const localData = await invoke<GameDetails>(
          'get_library_game_details',
          {
            gameId: selectedGame.id,
          }
        );

        if (localData) {
          setDetails(localData);

          const hasHltbData =
            localData.hltbMainStory && localData.hltbMainStory > 0;

          if (!hasHltbData) {
            console.log('Dados HLTB ausentes. Buscando em background...');

            // Chama o comando do Rust sem 'await' para não travar a UI (Fire and Forget)
            invoke('fetch_hltb_data', {
              gameId: selectedGame.id,
              gameName: selectedGame.name,
            })
              .then(async () => {
                // Sucesso: busca os detalhes novamente no banco para atualizar a tela
                const updatedData = await invoke<GameDetails>(
                  'get_library_game_details',
                  {
                    gameId: selectedGame.id,
                  }
                );
                setDetails(updatedData);
              })
              .catch(err => {
                console.warn('Não foi possível encontrar dados no HLTB:', err);
              });
          }
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

    loadData();
  }, [selectedGame, allGames]);

  return { details, loading, siblings };
}
