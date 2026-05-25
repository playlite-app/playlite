import { ImageOff, Loader2, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SearchResult, wishlistService } from '@/services/wishlistService';
import { Button } from '@/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import { Input } from '@/ui/input';
import { toast } from '@/utils/toast';

interface AddWishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddWishlist({
  isOpen,
  onClose,
  onSuccess,
}: AddWishlistModalProps) {
  const { t } = useTranslation('wishlist');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'name' | 'features'>('name');

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);

    try {
      const data =
        searchMode === 'name'
          ? await wishlistService.searchWishlistGame(query)
          : await wishlistService.searchWishlistGameByFeatures(query);
      setResults(data);
    } catch {
      toast.error(t('add_wishlist_search_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (game: SearchResult) => {
    setAddingId(game.id);

    try {
      await wishlistService.addToWishlist(game);
      toast.success(t('add_wishlist_added_success'));
      onSuccess();
      onClose();
      setResults([]);
      setQuery('');
    } catch {
      toast.error(t('add_wishlist_add_error'));
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('add_wishlist_title')}</DialogTitle>
        </DialogHeader>

        <div className="my-2 flex gap-2">
          <div className="mb-2 flex gap-1 rounded-lg border p-1">
            <Button
              size="sm"
              variant={searchMode === 'name' ? 'default' : 'ghost'}
              className="flex-1"
              onClick={() => {
                setSearchMode('name');
                setResults([]);
              }}
            >
              {t('add_wishlist_mode_name')}
            </Button>
            <Button
              size="sm"
              variant={searchMode === 'features' ? 'default' : 'ghost'}
              className="flex-1"
              onClick={() => {
                setSearchMode('features');
                setResults([]);
              }}
            >
              {t('add_wishlist_mode_features')}
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder={
              searchMode === 'name'
                ? t('add_wishlist_search_placeholder')
                : t('add_wishlist_features_placeholder')
            }
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <Button
            className="bg-muted-foreground"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Search size={18} />
            )}
          </Button>
        </div>

        <div className="custom-scrollbar max-h-75 space-y-2 overflow-y-auto">
          {results.map(game => (
            <div
              key={game.id}
              className="hover:bg-muted/50 hover:border-border mr-2 flex items-center gap-3 rounded-lg border border-transparent p-2 transition-colors"
            >
              <div className="bg-background h-12 w-12 shrink-0 overflow-hidden rounded">
                {game.cover_url ? (
                  <img
                    src={game.cover_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageOff size={16} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{game.name}</p>
                <p className="text-muted-foreground text-xs">
                  {t('add_wishlist_id_label')} {game.id}
                </p>
              </div>
              <Button
                size="sm"
                className="bg-muted-foreground"
                disabled={addingId === game.id}
                onClick={() => handleAdd(game)}
              >
                {addingId === game.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus size={18} />
                )}
              </Button>
            </div>
          ))}
          {results.length === 0 && !loading && query && (
            <p className="text-muted-foreground py-4 text-center text-sm">
              {t('add_wishlist_no_results_message')}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
