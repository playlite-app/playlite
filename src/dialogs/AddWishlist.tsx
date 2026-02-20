import { ImageOff, Loader2, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { SearchResult, wishlistService } from '@/services/wishlistService';
import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog';
import { Input } from '@/ui/input';

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
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);

    try {
      const data = await wishlistService.searchWishlistGame(query);
      setResults(data);
    } catch {
      toast.error('Erro ao buscar jogos');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (game: SearchResult) => {
    setAddingId(game.id);

    try {
      await wishlistService.addToWishlist(game);
      toast.success('Adicionado à lista!');
      onSuccess();
      onClose();
      setResults([]);
      setQuery('');
    } catch {
      toast.error('Erro ao adicionar jogo');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar à Lista de Desejos</DialogTitle>
        </DialogHeader>

        <div className="my-2 flex gap-2">
          <Input
            placeholder="Nome do jogo..."
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
                <p className="text-muted-foreground text-xs">ID: {game.id}</p>
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
              Nenhum jogo encontrado.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
