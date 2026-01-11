export interface Game {
  id: string;
  name: string;
  coverUrl?: string;
  platform: string;
  platformId?: string;
  genres?: string;
  developer?: string;

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
 * Detalhes adicionais do jogo - Schema 2.0
 *
 * Metadados enriquecidos armazenados no banco de dados local,
 * provenientes de APIs externas (IGDB, RAWG, HLTB).
 */
export interface GameDetails {
  // Conectores Extras
  steamAppId?: string;

  // Dados Descritivos
  description?: string;
  developer?: string;
  publisher?: string;
  releaseDate?: string;
  genres?: string;
  tags?: string; // String separada por vírgulas
  series?: string;
  ageRating?: string;

  // Mídia
  backgroundImage?: string;

  // Avaliações
  criticScore?: number;
  usersScore?: number;

  // Links Externos
  websiteUrl?: string;
  igdbUrl?: string;
  rawgUrl?: string;
  pcgamingwikiUrl?: string;

  // HowLongToBeat
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
