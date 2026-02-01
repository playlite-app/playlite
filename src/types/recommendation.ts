import { Game } from '@/types/game.ts';

export interface RecommendationReason {
  label: string; // Ex: "Fãs de RPG", "Série Favorita"
  type_id: string; // "genre", "series", "community", "tag"
  score_contribution: number;
}

export interface RecommendationConfig {
  content_weight: number; // Default: 0.65
  collaborative_weight: number; // Default: 0.35
  age_decay: number; // Default: 0.95
  favor_series: boolean; // Default: true
  filter_adult_content: boolean; // Default: false
  series_limit: 'none' | 'moderate' | 'aggressive'; // Default: 'moderate'
}

// Interface estendida para jogos recomendados na UI
// Une os dados do jogo (Game) com os metadados da recomendação (Score + Reason)
export interface RecommendedGame extends Game {
  matchScore: number;
  reason?: RecommendationReason;
}
