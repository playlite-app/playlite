export interface WishlistGame {
  id: string;
  name: string;
  coverUrl: string | null;
  storeUrl: string | null;
  currentPrice: number | null;
  lowestPrice: number | null;
  onSale: boolean;
  localizedPrice: number | null;
  localizedCurrency: string | null;
  steamAppId: number | null;
  addedAt: string;
}
