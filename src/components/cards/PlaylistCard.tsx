import { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  ImageOff,
  Play,
  Trash2,
} from 'lucide-react';

import { Game } from '@/types';
import { Button } from '@/ui/button';
import { launchGame } from '@/utils/launcher';

interface PlaylistItemProps {
  game: Game;
  index: number;
  total: number;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (game: Game) => void;
  onPlay: (game: Game) => void;
  onClick: (game: Game) => void;
}

/**
 * Item individual da fila de jogos (Playlist).
 * Suporta drag & drop e reordenação manual via setas.
 */
export default function PlaylistCard({
  game,
  index,
  total,
  dragHandleProps,
  onMoveUp,
  onMoveDown,
  onRemove,
  onPlay,
  onClick,
}: Readonly<PlaylistItemProps>) {
  return (
    <div className="group bg-card border-border hover:border-primary/50 animate-in fade-in slide-in-from-left-4 relative flex items-center gap-3 rounded-xl border p-2.5 transition-all duration-300 hover:shadow-md lg:gap-4 lg:p-3">
      <div
        {...dragHandleProps}
        className="bg-background/95 text-muted-foreground hover:text-primary border-border pointer-events-none absolute top-1.5 left-1/2 z-40 flex h-7 w-12 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border opacity-0 shadow-sm transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 active:cursor-grabbing"
        aria-label={`Arrastar ${game.name}`}
      >
        <GripVertical size={16} />
      </div>

      <button
        type="button"
        className="absolute inset-0 z-20"
        aria-label={`Abrir detalhes de ${game.name}`}
        onClick={() => onClick(game)}
      />

      <div className="relative z-30 mr-1 flex items-center gap-0">
        <div className="text-muted-foreground flex flex-col items-center justify-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="hover:text-primary h-6 w-6 rounded-full disabled:opacity-20"
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              onMoveUp(index);
            }}
            onMouseDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
            disabled={index === 0}
            title="Mover para cima"
          >
            <ArrowUp size={13} className="lg:h-3.5 lg:w-3.5" />
          </Button>

          <span className="w-6 text-center font-mono text-[11px] font-bold select-none lg:text-xs">
            {index + 1}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="hover:text-primary h-6 w-6 rounded-full disabled:opacity-20"
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              onMoveDown(index);
            }}
            onMouseDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
            disabled={index === total - 1}
            title="Mover para baixo"
          >
            <ArrowDown size={13} className="lg:h-3.5 lg:w-3.5" />
          </Button>
        </div>
      </div>

      <div className="bg-muted group/img relative z-30 h-14 w-10 shrink-0 cursor-pointer overflow-hidden rounded shadow-sm lg:h-16 lg:w-12">
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[8px]">
            <ImageOff className="h-4 w-4 opacity-50" />
          </div>
        )}
        <button
          type="button"
          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover/img:opacity-100"
          aria-label={`Jogar ${game.name}`}
          onClick={e => {
            e.stopPropagation();
            e.preventDefault();
            onPlay(game);
          }}
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
        >
          <Play size={15} className="fill-white text-white lg:h-4 lg:w-4" />
        </button>
      </div>

      <div className="min-w-0 flex-1 cursor-pointer select-none">
        <h4 className="group-hover:text-primary truncate text-sm font-semibold transition-colors">
          {game.name}
        </h4>
        <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
          <span className="bg-secondary/50 text-secondary-foreground border-border/50 max-w-25 truncate rounded border px-1.5 py-0.5 lg:max-w-none">
            {game.genres || 'Geral'}
          </span>
          <span>{'\u2022'}</span>
          <span>
            {(game.playtime ?? 0) > 0
              ? `${Math.floor((game.playtime ?? 0) / 60)}h`
              : '0h'}
          </span>
        </div>
      </div>

      <div className="relative z-30 flex items-center gap-1.5 lg:gap-2">
        <Button
          size="sm"
          className="bg-primary/90 hover:bg-primary text-primary-foreground flex h-7 items-center gap-1 px-2 shadow-sm"
          onClick={e => {
            e.stopPropagation();
            e.preventDefault();
            launchGame(game);
          }}
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          title="Jogar Agora"
        >
          <Play size={11} className="fill-current lg:h-3 lg:w-3" />
          <span className="text-xs font-bold">Play</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
          onClick={e => {
            e.stopPropagation();
            e.preventDefault();
            onRemove(game);
          }}
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          title="Remover da fila"
        >
          <Trash2 size={15} className="lg:h-4 lg:w-4" />
        </Button>
      </div>
    </div>
  );
}
