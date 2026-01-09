export interface Game {
  id: string;
  name: string;
  coverUrl?: string;
  platform: string;
  platformId?: string;

  // Campos para execução
  installPath?: string;
  executablePath?: string;
  launchArgs?: string;

  // Dados do usuário
  status?: 'playing' | 'completed' | 'backlog' | 'abandoned' | 'plan_to_play';
  userRating?: number;
  favorite: boolean;

  // Dados de tempo
  playtime?: number;
  lastPlayed?: string;
  addedAt: string;
}

/**
 * Dados usados para criar ou atualizar um jogo
 * (frontend → backend)
 */
export interface GameInput {
  id?: string;
  name: string;
  platform?: string;
  coverUrl: string | null;
  playtime: number;
  userRating?: number | null;
  status?: string;
  installPath?: string;
  executablePath?: string;
  launchArgs?: string;
}

/**
 * Detalhes dos jogos vindos da API (RAWG) OU do Banco de Dados
 * OBS: Você provavelmente precisará de uma interface separada para o banco
 * v2.0 (GameLibraryDetails) vs API RAWG pura.
 * Por enquanto, mantive a sua da RAWG, mas adicionei os campos do banco v2 como opcionais
 */
export interface GameDetails {
  // Campos legados (RAWG API direta)
  descriptionRaw?: string;
  metacritic?: number | null;
  website?: string;
  tags?: { id: number; name: string }[];
  developers?: { name: string }[];
  publishers?: { name: string }[];

  // Campos novos do Banco de Dados (v2.0)
  description?: string;
  steamAppId?: string;
  releaseDate?: string;
  genres?: string; // No banco salvamos string separada por vírgula
  series?: string;
  ageRating?: string;
  backgroundImage?: string;
  criticScore?: number;
  usersScore?: number;

  // Links
  websiteUrl?: string;
  igdbUrl?: string;
  rawgUrl?: string;
  pcgamingwikiUrl?: string;

  // HLTB
  hltbMainStory?: number;
  hltbMainExtra?: number;
  hltbCompletionist?: number;
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
