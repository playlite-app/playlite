import { Check, Edit, ListPlus, MoreVertical, Trash2 } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionButton } from '@/components/common';
import { Game } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu';

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
 * Notificações (toasts) devem ser gerenciadas pelo componente pai.
 *
 * Memoizado: usado dentro de grades com centenas de cards — depende de
 * `onAddToPlaylist`/`onEdit`/`onDelete` estáveis vindos do componente pai
 * para a memoização funcionar de fato.
 *
 * @param game - Dados completos do jogo para edição/exclusão
 * @param inPlaylist - Se true, opção "Playlist" fica desabilitada com visual de confirmação
 * @param onAddToPlaylist - Callback para adicionar à fila (recebe apenas ID)
 * @param onEdit - Callback para abrir modal de edição (recebe jogo completo)
 * @param onDelete - Callback para excluir jogo (recebe apenas ID)
 */
export const GameActionsMenu = memo(function GameActionsMenu({
  game,
  inPlaylist,
  onAddToPlaylist,
  onEdit,
  onDelete,
}: GameActionsMenuProps) {
  const { t } = useTranslation('library');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ActionButton
          icon={MoreVertical}
          variant="glass"
          tooltip={t('game_actions_more_options')}
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
            }
          }}
        >
          {inPlaylist ? (
            <>
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">
                {t('game_actions_in_playlist')}
              </span>
            </>
          ) : (
            <>
              <ListPlus className="mr-2 h-4 w-4" />
              <span>{t('game_actions_add_to_playlist')}</span>
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
          <span>{t('game_actions_edit')}</span>
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
          <span>{t('game_actions_delete')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
