import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import {
  Copy,
  ExternalLink,
  FileJson,
  Loader2,
  Plus,
  RefreshCw,
  ShoppingCart,
  Ticket,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import StandardGameCard from '@/components/cards/StandardGameCard';
import { ActionButton } from '@/components/common';
import AddWishlist from '@/dialogs/AddWishlist.tsx';
import { useWishlist, useWishlistFilter } from '@/hooks';
import { useConfirm } from '@/providers/ConfirmProvider';
import { Button } from '@/ui/button';
import { Separator } from '@/ui/separator';

import { openExternalLink } from '../utils/openLink.ts';

interface WishlistProps {
  searchTerm?: string;
}

export default function Wishlist({ searchTerm = '' }: WishlistProps) {
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
      toast.success('Preços atualizados com sucesso!');
    } catch {
      toast.error('Erro ao atualizar preços.');
    }
  };

  // Função para importar via JSON (Steam ou ITAD)
  useEffect(() => {
    const unlisten = listen('wishlist_updated', () => {
      toast.success('Capas atualizadas!');
      refreshList();
    });

    return () => {
      unlisten.then(f => f());
    };
  }, [refreshList]);

  // Usa hook para filtrar jogos
  const filteredGames = useWishlistFilter(games, searchTerm);

  const handleImportJson = async () => {
    let loadingToast: string | number | undefined;

    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });

      if (selected) {
        loadingToast = toast.loading('Importando lista...');
        const count = await invoke<number>('import_wishlist', {
          filePath: selected,
        });
        toast.dismiss(loadingToast);

        if (count > 0) {
          toast.success(`${count} jogos importados! Buscando capas...`);
          refreshList();
          invoke('fetch_wishlist_covers').catch(console.error);
        } else {
          toast.info('Nenhum jogo novo encontrado.');
        }
      }
    } catch (error) {
      console.error(error);

      if (loadingToast) {
        toast.dismiss(loadingToast);
      }

      toast.error('Erro na importação: ' + error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={32} />
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
          Você pode importar sua lista da Steam/ITAD ou adicionar manualmente.
        </p>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddModal(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Adicionar Manualmente
          </Button>
          <Button onClick={handleImportJson} variant="outline">
            <FileJson className="mr-2 h-4 w-4" /> Importar JSON
          </Button>
        </div>

        <AddWishlist
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={refreshList}
        />
      </div>
    );
  }

  return (
    <div className="custom-scrollbar flex-1 overflow-y-auto p-8 pb-20">
      {/* HEADER DA PÁGINA */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
            <ShoppingCart size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Lista de Desejos</h1>
            <p className="text-muted-foreground text-sm">
              Monitorando {games.length} {games.length === 1 ? 'jogo' : 'jogos'}
            </p>
          </div>
        </div>

        {/* BARRA DE FERRAMENTAS (Abaixo do Header) */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleRefreshClick}
            disabled={isRefreshing || games.length === 0}
            variant="outline"
            className="flex-1 sm:flex-none"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            {isRefreshing ? 'Buscando Ofertas...' : 'Atualizar Preços'}
          </Button>
          <div className="flex-1 sm:flex-none" /> {/* Espaçador */}
          <Button
            onClick={() => setShowAddModal(true)}
            variant="secondary"
            className="flex-1 sm:flex-none"
          >
            <Plus className="mr-2 h-4 w-4" /> Adicionar Jogo
          </Button>
          <Button
            onClick={handleImportJson}
            variant="secondary"
            className="flex-1 sm:flex-none"
          >
            <FileJson className="mr-2 h-4 w-4" /> Importar Arquivo
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      {/* GRID DE JOGOS */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filteredGames.length === 0 ? (
          <div className="text-muted-foreground col-span-full py-10 text-center">
            Nenhum jogo encontrado para "{searchTerm}"
          </div>
        ) : (
          filteredGames.map(game => {
            // Formata preço (lógica inline sem hooks)
            let priceDisplay = 'Aguardando...';

            if (game.currentPrice !== null && game.currentPrice !== undefined) {
              const currencySymbol =
                game.currency === 'BRL'
                  ? 'R$'
                  : game.currency === 'USD'
                    ? 'US$'
                    : game.currency || '';
              priceDisplay = `${currencySymbol} ${game.currentPrice.toFixed(2)}`;
            }

            // Constrói URL de loja (lógica inline sem hooks)
            const targetUrl =
              game.storeUrl ||
              (game.itadId
                ? `https://isthereanydeal.com/game/${game.itadId}/`
                : null);
            const storeLabel = game.storePlatform
              ? `Abrir em ${game.storePlatform}`
              : targetUrl
                ? 'Ver na ITAD'
                : 'Link indisponível';

            return (
              <StandardGameCard
                id={game.id.toString()}
                key={game.id}
                title={game.name}
                coverUrl={game.coverUrl}
                subtitle={priceDisplay}
                badge={
                  game.voucher ? (
                    <div className="flex items-center gap-1 font-mono text-xs">
                      <Ticket size={10} />
                      <span>{game.voucher}</span>
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
                      tooltip={storeLabel}
                    />
                  </>
                }
              />
            );
          })
        )}
      </div>
      <AddWishlist
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={refreshList}
      />
    </div>
  );
}
