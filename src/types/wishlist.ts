export interface WishlistGame {
  id: string;
  name: string;
  cover_url: string | null;
  store_url: string | null;
  current_price: number | null;
  lowest_price: number | null;
  on_sale: boolean;
  localized_price: number | null;
  localized_currency: string | null;
  steam_app_id: number | null;
  added_at: string;
}
