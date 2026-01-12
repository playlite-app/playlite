export interface UserPreferenceVector {
  genres: Record<string, number>;
  tags: Record<string, number>;
  series: Record<string, number>;
  totalPlaytime: number;
  totalGames: number;
}
