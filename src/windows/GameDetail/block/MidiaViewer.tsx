import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { MediaItem } from '@/windows';

interface MediaViewerProps {
  items: MediaItem[];
  activeIndex: number;
  onNavigate: (index: number) => void;
  onFullscreen: () => void;
}

export function MediaViewer({
  items,
  activeIndex,
  onNavigate,
  onFullscreen,
}: MediaViewerProps) {
  const { t } = useTranslation('game_detail');
  const item = items[activeIndex];

  if (!item) return null;

  const canPrev = activeIndex > 0;
  const canNext = activeIndex < items.length - 1;

  const getItemLabel = (mediaItem: MediaItem): string => {
    if (mediaItem.kind === 'screenshot') return t('media_label_screenshot');

    if (mediaItem.kind === 'trailer') return t('media_label_trailer');

    return t('media_label_video');
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg bg-black"
      style={{ aspectRatio: '16/9' }}
    >
      {item.kind === 'screenshot' && (
        <img
          key={item.url}
          src={item.url}
          alt="Screenshot"
          className="h-full w-full object-contain"
        />
      )}

      {item.kind === 'trailer' && (
        <video
          key={item.url}
          src={item.url}
          controls
          autoPlay
          className="h-full w-full object-contain"
        />
      )}

      {item.kind === 'youtube' && (
        <iframe
          key={item.url}
          src={`${item.url}?autoplay=1&rel=0`}
          className="h-full w-full"
          allow="autoplay; fullscreen"
          allowFullScreen
          title={t('media_label_video')}
        />
      )}

      {canPrev && (
        <button
          onClick={() => onNavigate(activeIndex - 1)}
          className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {canNext && (
        <button
          onClick={() => onNavigate(activeIndex + 1)}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      <div className="absolute right-2 bottom-2 left-2 flex items-center justify-between">
        <span className="rounded bg-black/60 px-2 py-0.5 text-[11px] text-white/80 backdrop-blur-sm">
          {getItemLabel(item)} · {activeIndex + 1}/{items.length}
        </span>

        {item.kind === 'screenshot' && (
          <button
            onClick={onFullscreen}
            className="rounded bg-black/60 p-1 text-white/80 backdrop-blur-sm transition-colors hover:text-white"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
