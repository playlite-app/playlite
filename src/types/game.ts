export interface GameTag {
  slug: string;
  name: string;
  category: TagCategory;
  relevance: number;
}

export type TagCategory =
  | 'mode'
  | 'narrative'
  | 'theme'
  | 'gameplay'
  | 'meta'
  | 'technical'
  | 'input';

export const CATEGORY_MULTIPLIERS: Record<TagCategory | 'unknown', number> = {
  gameplay: 2.0,
  theme: 1.5,
  narrative: 1.3,
  mode: 1.2,
  meta: 0.8,
  technical: 0.7,
  input: 0.5,
  unknown: 0.5,
};

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

export type SteamReviewSummary =
  | 'Overwhelmingly Positive'
  | 'Very Positive'
  | 'Positive'
  | 'Mostly Positive'
  | 'Mixed'
  | 'Mostly Negative'
  | 'Negative'
  | 'Very Negative'
  | 'Overwhelmingly Negative'
  | 'No user reviews';

export const steamReviewMap: Record<SteamReviewSummary, string> = {
  'Overwhelmingly Positive': 'Extremamente positivas',
  'Very Positive': 'Muito positivas',
  Positive: 'Positivas',
  'Mostly Positive': 'Ligeiramente positivas',
  Mixed: 'Mistas',
  'Mostly Negative': 'Ligeiramente negativas',
  Negative: 'Negativas',
  'Very Negative': 'Muito negativas',
  'Overwhelmingly Negative': 'Extremamente negativas',
  'No user reviews': 'Sem análises de usuários',
};

export function traduzirSteamReview(label?: SteamReviewSummary): string {
  if (!label) return 'Sem classificação';

  return steamReviewMap[label];
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
