import { Check, Edit, ListPlus, MoreVertical, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { ActionButton } from '@/components/ActionButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Game } from '@/types';

interface GameActionsMenuProps {
  game: Game;
  inPlaylist: boolean;
  onAddToPlaylist: (id: string) => void;
  onEdit: (game: Game) => void;
  onDelete: (id: string) => void;
}

/**
 * Menu dropdown de ações secundárias para jogos (ícone três pontos).
 * Usado no overlay de StandardGameCard e em outras listas de jogos.
 *
 * Ações disponíveis:
 * - Adicionar à Playlist (desabilitado se já estiver na fila, mostra checkmark verde)
 * - Editar jogo (abre modal de edição)
 * - Excluir jogo (confirmação e remoção permanente)
 *
 * Todos os cliques propagam stopPropagation para não acionar onClick do card pai.
 * Toast de sucesso é exibido automaticamente ao adicionar à playlist.
 *
 * @param game - Dados completos do jogo para edição/exclusão
 * @param inPlaylist - Se true, opção "Playlist" fica desabilitada com visual de confirmação
 * @param onAddToPlaylist - Callback para adicionar à fila (recebe apenas ID)
 * @param onEdit - Callback para abrir modal de edição (recebe jogo completo)
 * @param onDelete - Callback para excluir jogo (recebe apenas ID)
 */
export function GameActionsMenu({
  game,
  inPlaylist,
  onAddToPlaylist,
  onEdit,
  onDelete,
}: GameActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ActionButton
          icon={MoreVertical}
          variant="glass"
          tooltip="Mais Opções"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* OPÇÃO: Playlist */}
        <DropdownMenuItem
          disabled={inPlaylist}
          onClick={e => {
            e.stopPropagation();

            if (!inPlaylist) {
              onAddToPlaylist(game.id);
              toast.success(`${game.name} adicionado à playlist!`);
            }
          }}
        >
          {inPlaylist ? (
            <>
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">Na Playlist</span>
            </>
          ) : (
            <>
              <ListPlus className="mr-2 h-4 w-4" />
              <span>Playlist</span>
            </>
          )}
        </DropdownMenuItem>

        {/* OPÇÃO: Editar */}
        <DropdownMenuItem
          onClick={e => {
            e.stopPropagation();
            onEdit(game);
          }}
        >
          <Edit className="mr-2 h-4 w-4" />
          <span>Editar</span>
        </DropdownMenuItem>

        {/* OPÇÃO: Excluir */}
        <DropdownMenuItem
          className="text-red-600 focus:bg-red-100/10 focus:text-red-600"
          onClick={e => {
            e.stopPropagation();
            onDelete(game.id);
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Excluir</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
