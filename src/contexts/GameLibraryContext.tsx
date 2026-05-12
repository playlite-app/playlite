import { listen } from '@tauri-apps/api/event';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { toast } from '@/utils/toast';

import { librariesService } from '@/services/librariesService';
import { Game } from '@/types';

interface GameLibraryContextType {
  games: Game[];
  isLoading: boolean;
  refreshGames: () => Promise<void>;
  saveGame: (data: Partial<Game>, editId?: string) => Promise<void>;
  removeGame: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
}

const GameLibraryContext = createContext<GameLibraryContextType | undefined>(
  undefined
);

export function GameLibraryProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega jogos na montagem
  useEffect(() => {
    refreshGames();
  }, []);

  // Escuta por atualizações na biblioteca
  useEffect(() => {
    const unlisten = listen('library_updated', () => {
      refreshGames();
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);

  const refreshGames = async () => {
    try {
      setIsLoading(true);
      const allGames = await librariesService.getGames();
      setGames(allGames);
    } catch (error) {
      console.error('Erro ao carregar jogos:', error);
      toast.error('Erro ao carregar biblioteca');
    } finally {
      setIsLoading(false);
    }
  };

  const buildServiceGame = (data: Partial<Game>, id?: string) => {
    const ensureId =
      id ||
      data.id ||
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}`);

    return {
      id: ensureId,
      name: data.name ?? 'Untitled',
      platform: data.platform ?? 'Manual',
      platformGameId: data.platformGameId ?? '',
      coverUrl: data.coverUrl ?? null,
      installed: data.installed ?? false,
      importConfidence: data.importConfidence ?? null,
      playtime: data.playtime ?? 0,
      userRating: data.userRating ?? null,
      status:
        (data.status as
          | 'playing'
          | 'completed'
          | 'backlog'
          | 'abandoned'
          | 'plan_to_play') ?? 'backlog',
      installPath: data.installPath ?? null,
      executablePath: data.executablePath ?? null,
      launchArgs: data.launchArgs ?? null,
      favorite: data.favorite ?? false,
      isAdult: data.isAdult ?? false,
      addedAt: data.addedAt ?? new Date().toISOString(),
    };
  };

  const saveGame = async (data: Partial<Game>, editId?: string) => {
    try {
      if (editId || data.id) {
        const gamePayload = buildServiceGame(data, editId ?? data.id);
        await librariesService.updateGame(gamePayload);
        toast.success('Jogo atualizado!');
      } else {
        const gamePayload = buildServiceGame(data);
        await librariesService.addGame(gamePayload);
        toast.success('Jogo adicionado!');
      }

      await refreshGames();
    } catch (error) {
      console.error('Erro ao salvar jogo:', error);
      throw error;
    }
  };

  const removeGame = async (id: string) => {
    try {
      await librariesService.deleteGame(id);
      await refreshGames();
    } catch (error) {
      console.error('Erro ao remover jogo:', error);
      throw error;
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      await librariesService.toggleFavorite(id);
      await refreshGames();
    } catch (error) {
      console.error('Erro ao favoritar:', error);
      toast.error('Erro ao favoritar jogo');
    }
  };

  const contextValue = useMemo(
    () => ({
      games,
      isLoading,
      refreshGames,
      saveGame,
      removeGame,
      toggleFavorite,
    }),
    [games, isLoading]
  );

  return (
    <GameLibraryContext.Provider value={contextValue}>
      {children}
    </GameLibraryContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGameLibrary() {
  const context = useContext(GameLibraryContext);

  if (!context) {
    throw new Error('useGameLibrary must be used within GameLibraryProvider');
  }

  return context;
}

