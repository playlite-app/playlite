import {
  Copy,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  ShoppingCart,
  Ticket,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { ActionButton } from '@/components/ActionButton.tsx';
import AddWishlistModal from '@/components/AddWishlistModal';
import StandardGameCard from '@/components/StandardGameCard';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/providers/ConfirmProvider';

import { useWishlist } from '../hooks/useWishlist';
import { openExternalLink } from '../utils/navigation';

export default function Wishlist() {
  const {
    games,
    isLoading,
    isRefreshing,
    removeGame,
    refreshPrices,
    refreshList,
  } = useWishlist();

  const [showAddModal, setShowAddModal] = useState(false);
  const { confirm } = useConfirm();

  const handleRemoveClick = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Remover da Lista de Desejos',
      description: `Tem certeza que deseja remover ${name} da lista de desejos?`,
      confirmText: 'Remover',
      cancelText: 'Cancelar',
    });

    if (!confirmed) return;

    try {
      await removeGame(id);
      toast.success(
        `O jogo ${name} foi removido com sucesso da sua lista de desejos!`
      );
    } catch {
      toast.error('Erro ao remover jogo.');
    }
  };

  const handleRefreshClick = async () => {
    try {
      await refreshPrices();
    } catch {
      toast.error('Erro ao atualizar preços.');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  // Empty state
  if (games.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center">
        <ShoppingCart className="mb-4 h-16 w-16 opacity-20" />
        <h3 className="text-lg font-medium">Sua lista está vazia</h3>
        <p className="mb-4 text-sm">
          Vá para a aba "Em Alta" para descobrir novos jogos.
        </p>
        <Button onClick={() => setShowAddModal(true)} variant="outline">
          <Plus /> Adicionar na Lista
        </Button>
        <AddWishlistModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={refreshList}
        />
      </div>
    );
  }

  return (
    <div className="custom-scrollbar flex-1 overflow-y-auto p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-red-500/10 p-2 text-red-500">
            <ShoppingCart size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Lista de Desejos</h1>
            <p className="text-muted-foreground text-sm">
              Monitorando {games.length} {games.length === 1 ? 'jogo' : 'jogos'}
            </p>
          </div>
        </div>
        <Button
          onClick={handleRefreshClick}
          disabled={isRefreshing || games.length === 0}
          variant="outline"
        >
          <RefreshCw className={`${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Buscando Ofertas...' : 'Atualizar Preços'}
        </Button>
        <Button onClick={() => setShowAddModal(true)} variant="outline">
          <Plus /> Adicionar na Lista
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {games.map(game => {
          let priceDisplay = 'Aguardando preço...';

          if (game.currentPrice !== null && game.currentPrice !== undefined) {
            const currency = game.currency || 'USD';
            const currencySymbol =
              currency === 'BRL' ? 'R$' : currency === 'USD' ? 'US$' : currency;
            priceDisplay = `${currencySymbol} ${game.currentPrice.toFixed(2)}`;
          }

          // Use a URL da loja retornada pela ITAD ou construa URL do ITAD se tiver itadId
          const targetUrl =
            game.storeUrl ||
            (game.itadId
              ? `https://isthereanydeal.com/game/${game.itadId}/`
              : null);

          return (
            <StandardGameCard
              key={game.id}
              title={game.name}
              coverUrl={game.coverUrl}
              subtitle={priceDisplay}
              badge={
                game.voucher ? (
                  <div className="flex items-center gap-1">
                    <Ticket size={10} />
                    <span>CUPOM: {game.voucher}</span>
                  </div>
                ) : game.onSale ? (
                  'OFERTA!'
                ) : undefined
              }
              actions={
                <>
                  {/* Botão de Copiar Cupom (Só aparece se tiver voucher) */}
                  {game.voucher && (
                    <ActionButton
                      icon={Copy}
                      variant="glass"
                      size={16}
                      onClick={() => {
                        navigator.clipboard.writeText(game.voucher || '');
                        toast.success('Cupom copiado: ' + game.voucher);
                      }}
                      tooltip={`Copiar: ${game.voucher}`}
                    />
                  )}
                  <ActionButton
                    icon={Trash2}
                    variant="destructive"
                    size={16}
                    onClick={() => handleRemoveClick(game.id, game.name)}
                    tooltip="Remover"
                  />
                  <ActionButton
                    icon={ExternalLink}
                    variant="secondary"
                    size={16}
                    disabled={!targetUrl}
                    onClick={() => {
                      if (targetUrl) openExternalLink(targetUrl);
                    }}
                    tooltip={
                      game.storePlatform
                        ? `Abrir em ${game.storePlatform}`
                        : 'Ver na ITAD'
                    }
                  />
                </>
              }
            />
          );
        })}
      </div>
      <AddWishlistModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={refreshList}
      />
    </div>
  );
}
