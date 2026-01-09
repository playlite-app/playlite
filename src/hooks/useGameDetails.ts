/**
 * Busca detalhes enriquecidos de um jogo na API RAWG e identifica versões em outras plataformas.
 *
 * @param selectedGame - Jogo para buscar detalhes, ou null
 * @param allGames - Lista completa para identificar versões multiplataforma
 * @returns Objeto com:
 *   - details: Dados da RAWG (descrição, screenshots, metacritic, etc)
 *   - loading: Estado da requisição
 *   - siblings: Mesmo jogo em outras plataformas (array de {id, platform})
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

    // 2. Busca do Banco Local e ADAPTA para a UI
    const fetchLocal = async () => {
      setLoading(true);

      try {
        // O Rust retorna o objeto com campos como 'criticScore', 'developer' (string)
        // Usamos <any> aqui porque o retorno do Rust não bate 100% com a interface da UI ainda
        const data = await invoke<any>('get_library_game_details', {
          gameId: selectedGame.id,
        });

        if (data) {
          // === ADAPTER: Banco (v2) -> UI (Legacy/RAWG Format) ===
          // Transforma os dados do banco em objetos para o componente
          const adapted: GameDetails = {
            ...data,
            // Mapeia descrição: O banco manda 'description', o modal lê 'descriptionRaw'
            descriptionRaw: data.description || '',

            // Mapeia Developer: String -> Array[{name}]
            // O modal espera um array para poder fazer .map()
            developers: data.developer ? [{ name: data.developer }] : [],

            // Mapeia Publisher: String -> Array[{name}]
            publishers: data.publisher ? [{ name: data.publisher }] : [],

            // Mapeia Tags: String "Action, RPG" -> Array[{id, name}]
            tags: data.tags
              ? data.tags
                  .split(',')
                  .map((t: string, i: number) => ({ id: i, name: t.trim() }))
              : [],

            // Mapeia Metacritic (no banco chama criticScore)
            metacritic: data.criticScore || null,
          };

          setDetails(adapted);
        } else {
          // Se não tiver detalhes no banco, deixa nulo (ou poderia buscar da API aqui)
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
