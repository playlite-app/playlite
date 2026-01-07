export interface GenreScore {
  name: string;
  score: number;
  gameCount: number;
}

export interface UserProfile {
  topGenres: GenreScore[];
  totalPlaytime: number;
  totalGames: number;
}
