import { useMemo } from 'react';

import { Game } from '@/types';

interface UseLibraryFilterOptions {
  games: Game[];
  searchTerm: string;
  hideAdult?: boolean;
}

/**
 * Hook para filtrar jogos da biblioteca por busca e conteúdo adulto.
 * Busca em: nome, gêneros e plataforma.
 *
 * @param options.games - Lista completa de jogos
 * @param options.searchTerm - Termo de busca
 * @param options.hideAdult - Se true, oculta jogos marcados como adultos
 * @returns Jogos filtrados
 */
export function useLibraryFilter({
  games,
  searchTerm,
  hideAdult,
}: UseLibraryFilterOptions) {
  return useMemo(() => {
    // 1. Aplica filtro de conteúdo adulto
    const safeGames = hideAdult ? games.filter(game => !game.isAdult) : games;

    // 2. Se não há busca, retorna games filtrados por adulto
    if (!searchTerm) return safeGames;

    // 3. Aplica filtro de busca
    const term = searchTerm.toLowerCase();

    return safeGames.filter(
      game =>
        game.name.toLowerCase().includes(term) ||
        (game.genres && game.genres.toLowerCase().includes(term)) ||
        (game.platform && game.platform.toLowerCase().includes(term))
    );
  }, [games, hideAdult, searchTerm]);
}

/**
 * Hook para gerar estatísticas da biblioteca.
 *
 * @param games - Lista de jogos
 * @returns Estatísticas calculadas
 */
export function useLibraryStats(games: Game[]) {
  return useMemo(() => {
    const totalPlaytime = games.reduce(
      (acc, game) => acc + (game.playtime ?? 0),
      0
    );

    const favoriteGames = games.filter(game => game.favorite);
    const completedGames = games.filter(game => game.status === 'completed');
    const playingGames = games.filter(game => game.status === 'playing');

    return {
      totalGames: games.length,
      totalPlaytime,
      totalFavorites: favoriteGames.length,
      totalCompleted: completedGames.length,
      totalPlaying: playingGames.length,
    };
  }, [games]);
}

/**
 * Hook para gerar subtítulo de um card de jogo.
 * Combina primeiro gênero e desenvolvedor.
 *
 * @param genres - String de gêneros separados por vírgula
 * @param developer - Nome do desenvolvedor
 * @returns Subtítulo formatado
 */
export function useGameCardSubtitle(
  genres?: string,
  developer?: string
): string {
  return useMemo(() => {
    const parts = [genres?.split(',')[0]?.trim(), developer].filter(Boolean);

    return parts.length > 0 ? parts.join(' • ') : 'Sem dados';
  }, [genres, developer]);
}
