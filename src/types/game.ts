export interface Game {
  id: string;
  name: string;
  genre: string;
  platform: string;
  cover_url?: string;
  playtime: number;
  rating?: number;
  favorite: boolean;
}

/**
 * Dados usados para criar ou atualizar um jogo
 * (frontend → backend)
 */
export interface GameInput {
  id: string;
  name: string;
  genre?: string;
  platform?: string;
  coverUrl: string | null;
  playtime: number;
  rating?: number | null;
}

/**
 * Detalhes dos jogos vindos da API (RAWG)
 */
export interface GameDetails {
  description_raw: string;
  metacritic: number | null;
  website: string;
  tags: { id: number; name: string }[];
  developers: { name: string }[];
  publishers: { name: string }[];
}

export interface GamePlatformLink {
  id: string;
  platform: string;
}

export interface GameActions {
  onToggleFavorite: (id: string) => void;
  onGameClick: (game: Game) => void;
  onDeleteGame: (id: string) => void;
  onEditGame: (game: Game) => void;
}
