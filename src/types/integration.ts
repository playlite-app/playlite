export interface RawgGame {
  id: number;
  name: string;
  backgroundImage: string | null;
  rating: number;
  released: string | null;
  genres: { name: string }[];
  tags?: { name: string }[];
  series?: string | null;
}

export interface KeysBatch {
  steamId: string;
  steamApiKey: string;
  rawgApiKey: string;
  igdbClientId: string;
  igdbClientSecret: string;
}

export interface ImportSummary {
  successCount: number;
  errorCount: number;
  totalProcessed: number;
  message: string;
  errors: string[];
}
