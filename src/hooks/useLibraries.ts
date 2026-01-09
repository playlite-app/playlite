import { useCallback, useEffect, useState } from 'react';

import { Game } from '@/types';

import { librariesService } from '../services/librariesService.ts';

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
    // AQUI ESTAVA O PROBLEMA:
    // Você estava filtrando os dados novos e enviando campos antigos.

    const payload = {
      id: editingId || crypto.randomUUID(),
      name: gameData.name || 'Sem Nome',
      // genre: REMOVIDO (O Rust v2.0 não aceita gênero no add_game)

      platform: gameData.platform || 'Manual',
      coverUrl: gameData.coverUrl || null,
      playtime: gameData.playtime || 0,

      // Mapeamento correto para v2.0
      userRating: gameData.userRating || null, // O Modal já manda como userRating
      status: gameData.status || 'backlog',

      // Novos campos de execução
      installPath: gameData.installPath || null,
      executablePath: gameData.executablePath || null,
      launchArgs: gameData.launchArgs || null,
    };

    if (editingId) {
      await librariesService.updateGame(payload); // O Rust update_game espera userRating, status, etc.
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
