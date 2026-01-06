export interface RawgGame {
  id: number;
  name: string;
  background_image: string | null;
  rating: number;
  released: string | null;
  genres: { name: string }[];
}

export interface KeysBatch {
  steam_id: string;
  steam_api_key: string;
  rawg_api_key: string;
}

export interface ImportSummary {
  success_count: number;
  error_count: number;
  total_processed: number;
  message: string;
  errors: string[];
}
