export interface GenreScore {
  name: string;
  score: number;
  game_count: number;
}

export interface UserProfile {
  top_genres: GenreScore[];
  total_playtime: number;
  total_games: number;
}
