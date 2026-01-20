/**
 * Informações básicas do jogo - Schema 2.0
 *
 * Dados básicos armazenados no banco de dados local.
 * Esses dados são essenciais para a exibição e gerenciamento dos jogos na biblioteca.
 * Também incluem campos para execução e dados do usuário.
 */
export interface Game {
  id: string;
  name: string;
  coverUrl?: string;
  platform: string;
  platformId?: string;
  genres?: string;
  tags?: string;
  series?: string;
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

  isAdult: boolean;
}

export interface GameTag {
  slug: string;
  name: string;
  category:
    | 'mode'
    | 'narrative'
    | 'theme'
    | 'gameplay'
    | 'meta'
    | 'technical'
    | 'input';
  relevance: number;
}

/**
 * Detalhes adicionais do jogo - Schema 3.0
 *
 * Metadados enriquecidos armazenados no banco de dados local,
 * provenientes de APIs externas (RAWG, STEAM).
 */
export interface GameDetails {
  gameId: string;
  steamAppId?: string;

  // Metadados
  descriptionRaw?: string;
  descriptionPtbr?: string;
  releaseDate?: string;
  developer?: string;
  publisher?: string;
  genres?: string;
  tags?: GameTag[] | string;
  series?: string;
  backgroundImage?: string;

  // Scores & Reviews
  criticScore?: number; // Metacritic
  steamReviewLabel?: string; // "Very Positive"
  steamReviewCount?: number;
  steamReviewScore?: number; // % (0-100)
  steamReviewUpdatedAt?: string;

  // Classificação & Conteúdo
  esrbRating?: string; // "Mature", "Teen", etc.
  isAdult?: boolean;
  adultTags?: string;

  // Links & Tempo
  externalLinks?: Record<string, string>; // { "steam": "url", "website": "url" }
  medianPlaytime?: number; // Horas (SteamSpy)
  estimatedPlaytime?: number; // Tempo estimado em horas (float)
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
