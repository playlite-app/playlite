import { Play } from 'lucide-react';
import { useState } from 'react';

export type MediaItem =
  | { kind: 'screenshot'; url: string }
  | { kind: 'trailer'; url: string }
  | { kind: 'youtube'; url: string };

interface MediaThumbnailProps {
  item: MediaItem;
  active: boolean;
  onClick: () => void;
}

export function MediaThumbnail({ item, active, onClick }: MediaThumbnailProps) {
  const [imgErr, setImgErr] = useState(false);

  const isVideo = item.kind === 'trailer' || item.kind === 'youtube';

  const bgUrl =
    item.kind === 'youtube'
      ? (() => {
          const match = item.url.match(/embed\/([\w-]+)/);

          return match
            ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`
            : null;
        })()
      : item.kind === 'screenshot' && !imgErr
        ? item.url
        : null;

  return (
    <button
      onClick={onClick}
      className={`relative h-16 w-28 shrink-0 overflow-hidden rounded-md border-2 transition-all duration-150 ${
        active
          ? 'border-primary'
          : 'hover:border-border border-transparent opacity-60 hover:opacity-100'
      }`}
    >
      {bgUrl ? (
        <img
          src={bgUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImgErr(true)}
        />
      ) : (
        <div className="bg-muted/40 flex h-full w-full items-center justify-center">
          {isVideo && <Play className="text-muted-foreground h-4 w-4" />}
        </div>
      )}

      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="rounded-full bg-black/50 p-1">
            <Play className="h-3 w-3 fill-white text-white" />
          </div>
        </div>
      )}
    </button>
  );
}
