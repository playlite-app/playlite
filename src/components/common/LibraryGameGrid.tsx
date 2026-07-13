import { useMemo } from 'react';
import { type CellComponentProps, Grid } from 'react-window';

import { LibraryGameCard } from '@/components';
import { useElementWidth } from '@/hooks/ui';
import { Game } from '@/types';

// Equivalente ao `gap-6` (1.5rem) usado na grade não-virtualizada anterior.
const GAP = 24;

const CARD_TEXT_AREA_HEIGHT = 76;

let cachedScrollbarWidth: number | null = null;

function getScrollbarWidth(): number {
  if (cachedScrollbarWidth !== null) return cachedScrollbarWidth;

  if (typeof document === 'undefined') return 0;

  const outer = document.createElement('div');
  outer.className = 'custom-scrollbar';
  Object.assign(outer.style, {
    visibility: 'hidden',
    position: 'absolute',
    top: '-9999px',
    width: '100px',
    height: '100px',
    overflowY: 'scroll',
  });

  const inner = document.createElement('div');
  inner.style.height = '200px';
  outer.appendChild(inner);
  document.body.appendChild(outer);

  cachedScrollbarWidth = outer.offsetWidth - outer.clientWidth;
  document.body.removeChild(outer);

  return cachedScrollbarWidth;
}

interface LibraryGameGridProps {
  games: Game[];
  onGameClick: (game: Game) => void;
  onToggleFavorite: (id: string) => void;
  onAddToPlaylist: (id: string) => void;
  onEditGame: (game: Game) => void;
  onDeleteGame: (id: string) => void;
  isInPlaylist: (id: string) => boolean;
}

interface CellProps {
  games: Game[];
  columnCount: number;
  onGameClick: (game: Game) => void;
  onToggleFavorite: (id: string) => void;
  onAddToPlaylist: (id: string) => void;
  onEditGame: (game: Game) => void;
  onDeleteGame: (id: string) => void;
  isInPlaylist: (id: string) => boolean;
}

function GridCell({
  columnIndex,
  rowIndex,
  style,
  games,
  columnCount,
  onGameClick,
  onToggleFavorite,
  onAddToPlaylist,
  onEditGame,
  onDeleteGame,
  isInPlaylist,
}: CellComponentProps<CellProps>) {
  const index = rowIndex * columnCount + columnIndex;
  const game = games[index];

  if (!game) {
    return <div style={style} />;
  }

  return (
    <div style={{ ...style, padding: GAP / 2 }}>
      <LibraryGameCard
        game={game}
        onGameClick={onGameClick}
        onToggleFavorite={onToggleFavorite}
        onAddToPlaylist={onAddToPlaylist}
        onEditGame={onEditGame}
        onDeleteGame={onDeleteGame}
        isInPlaylist={isInPlaylist}
      />
    </div>
  );
}

function getColumnCount(containerWidth: number): number {
  if (containerWidth >= 1280) return 5;

  if (containerWidth >= 1024) return 4;

  if (containerWidth >= 768) return 3;

  return 2;
}

export function LibraryGameGrid({
  games,
  onGameClick,
  onToggleFavorite,
  onAddToPlaylist,
  onEditGame,
  onDeleteGame,
  isInPlaylist,
}: Readonly<LibraryGameGridProps>) {
  const { ref, width } = useElementWidth<HTMLDivElement>();

  const { columnCount, columnWidth, rowHeight, rowCount } = useMemo(() => {
    // Breakpoints continuam baseados na largura "crua" do contêiner
    const count = getColumnCount(width);

    // Cálculo de largura de coluna desconta a scrollbar vertical que o Grid vai renderizar.
    const scrollbarWidth = getScrollbarWidth();
    const availableWidth = Math.max(width - scrollbarWidth, 0);
    const colWidth = availableWidth > 0 ? availableWidth / count : 0;

    const cardWidth = Math.max(colWidth - GAP, 0);
    const cardImageHeight = cardWidth * (4 / 3);
    const cardHeight = cardImageHeight + CARD_TEXT_AREA_HEIGHT;

    return {
      columnCount: count,
      columnWidth: colWidth,
      rowHeight: cardHeight + GAP,
      rowCount: Math.ceil(games.length / count),
    };
  }, [width, games.length]);

  const cellProps: CellProps = {
    games,
    columnCount,
    onGameClick,
    onToggleFavorite,
    onAddToPlaylist,
    onEditGame,
    onDeleteGame,
    isInPlaylist,
  };

  return (
    <div ref={ref} className="h-full w-full">
      {width > 0 && (
        <Grid
          className="custom-scrollbar overflow-x-hidden"
          cellComponent={GridCell}
          cellProps={cellProps}
          columnCount={columnCount}
          columnWidth={columnWidth}
          rowCount={rowCount}
          rowHeight={rowHeight}
        />
      )}
    </div>
  );
}
