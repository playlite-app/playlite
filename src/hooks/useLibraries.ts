import { useCallback, useEffect, useState } from 'react';

import { librariesService } from '../services/librariesService.ts';
import { Game } from '../types';

/**
 * Gerencia a biblioteca de jogos do usuário com operações CRUD.
 * Inicializa o banco SQLite e mantém estado sincronizado.
 *
 * @returns Objeto com:
 *   - games: Array de jogos na biblioteca
 *   - isLoading: true durante inicialização do DB
 *   - refreshGames: Recarrega lista do banco
 *   - saveGame: Adiciona ou atualiza jogo
 *   - removeGame: Remove jogo por ID
 *   - toggleFavorite: Marca/desmarca favorito (atualização otimista)
 */
export function useLibraries() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função centralizada para recarregar jogos
  const refreshGames = useCallback(async () => {
    try {
      const result = await librariesService.getGames();
      setGames(result);
    } catch (error) {
      console.error('Erro ao buscar jogos:', error);
    }
  }, []);

  // Inicialização do Banco
  useEffect(() => {
    const init = async () => {
      try {
        await librariesService.initDb();
        await refreshGames();
      } catch (error) {
        console.error('Erro ao iniciar DB:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [refreshGames]);

  // Ações CRUD
  const saveGame = async (gameData: Partial<Game>, editingId?: string) => {
    const payload = {
      id: editingId || crypto.randomUUID(),
      name: gameData.name || 'Sem Nome',
      genre: gameData.genre || 'Desconhecido',
      platform: gameData.platform || 'Manual',
      coverUrl: gameData.cover_url || null,
      playtime: gameData.playtime || 0,
      rating: gameData.rating || null,
    };

    if (editingId) {
      await librariesService.updateGame(payload);
    } else {
      await librariesService.addGame(payload);
    }

    await refreshGames();
  };

  const removeGame = async (id: string) => {
    await librariesService.deleteGame(id);
    await refreshGames();
  };

  const toggleFavorite = async (id: string) => {
    // Atualização otimista na UI
    setGames(prev =>
      prev.map(g => (g.id === id ? { ...g, favorite: !g.favorite } : g))
    );
    await librariesService.toggleFavorite(id);
  };

  return {
    games,
    isLoading,
    refreshGames,
    saveGame,
    removeGame,
    toggleFavorite,
  };
}
