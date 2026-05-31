import { invoke } from '@tauri-apps/api/core';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize2,
  Meh,
  Play,
  WifiOff,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useNetworkStatus } from '@/hooks';
import { Game } from '@/types/game';

// === TIPOS ===

interface GameMediaData {
  screenshots: string[];
  trailers: string[];
  youtube_embeds: string[];
  micro_trailer: string | null;
}

// Item unificado da fila de mídia
type MediaItem =
  | { kind: 'screenshot'; url: string }
  | { kind: 'trailer'; url: string }
  | { kind: 'youtube'; url: string };

interface GameMediaProps {
  game: Game;
}

// === HELPERS ===

function buildMediaQueue(data: GameMediaData): MediaItem[] {
  const queue: MediaItem[] = [];

  // Intercala: primeiro trailer, depois screenshots, depois mais trailers, depois YouTube
  // Objetivo: o primeiro item ser sempre vídeo se disponível
  const [firstTrailer, ...restTrailers] = data.trailers;

  if (firstTrailer) queue.push({ kind: 'trailer', url: firstTrailer });

  data.screenshots.forEach(url => queue.push({ kind: 'screenshot', url }));
  restTrailers.forEach(url => queue.push({ kind: 'trailer', url }));
  data.youtube_embeds.forEach(url => queue.push({ kind: 'youtube', url }));

  return queue;
}

function getItemLabel(item: MediaItem): string {
  if (item.kind === 'screenshot') return 'Screenshot';

  if (item.kind === 'trailer') return 'Trailer';

  return 'Vídeo';
}

// === THUMBNAIL DO ITEM ===

interface ThumbnailProps {
  item: MediaItem;
  active: boolean;
  onClick: () => void;
}

function MediaThumbnail({ item, active, onClick }: ThumbnailProps) {
  const [imgErr, setImgErr] = useState(false);

  const isVideo = item.kind === 'trailer' || item.kind === 'youtube';

  // Para YouTube, extrai o thumbnail direto do ID
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
      className={`relative h-16 w-28 shrink-0 overflow-hidden rounded-md border-2 transition-all duration-150 ${active ? 'border-primary' : 'hover:border-border border-transparent opacity-60 hover:opacity-100'} `}
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

      {/* Overlay de play para vídeos */}
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

// === VIEWER PRINCIPAL ===

interface MediaViewerProps {
  items: MediaItem[];
  activeIndex: number;
  onNavigate: (index: number) => void;
  onFullscreen: () => void;
}

function MediaViewer({
  items,
  activeIndex,
  onNavigate,
  onFullscreen,
}: MediaViewerProps) {
  const item = items[activeIndex];

  if (!item) return null;

  const canPrev = activeIndex > 0;
  const canNext = activeIndex < items.length - 1;

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg bg-black"
      style={{ aspectRatio: '16/9' }}
    >
      {/* Conteúdo */}
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
          title="Vídeo do jogo"
        />
      )}

      {/* Navegação — setas */}
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

      {/* Label do tipo + botão fullscreen (screenshots) */}
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

// === LIGHTBOX (fullscreen de screenshot) ===

interface LightboxProps {
  url: string;
  onClose: () => void;
}

function Lightbox({ url, onClose }: LightboxProps) {
  // Fecha com ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);

    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={url}
        alt="Screenshot"
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
}

// === ESTADOS DE UI ===

function MediaLoading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        <p className="text-muted-foreground text-sm">Carregando mídia…</p>
      </div>
    </div>
  );
}

function MediaEmpty({ gameName }: { gameName: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
      <Meh className="text-muted-foreground/50 h-8 w-8" />
      <p className="text-foreground text-sm font-medium">
        Sem mídia disponível
      </p>
      <p className="text-muted-foreground max-w-xs text-xs">
        A GameBrain não possui screenshots ou trailers para{' '}
        <span className="text-foreground font-medium">{gameName}</span>.
      </p>
    </div>
  );
}

function MediaError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
      <p className="text-foreground text-sm font-medium">
        Não foi possível carregar
      </p>
      <p className="text-muted-foreground max-w-xs text-xs">{message}</p>
      <button
        onClick={onRetry}
        className="border-border text-foreground hover:bg-muted mt-1 rounded-md border px-3 py-1.5 text-xs transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  );
}

function MediaOffline() {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
      <div className="bg-muted/40 rounded-full p-4">
        <WifiOff className="text-muted-foreground h-8 w-8" />
      </div>

      <div className="space-y-1">
        <p className="text-foreground text-sm font-medium">
          Sem conexão com a internet
        </p>

        <p className="text-muted-foreground max-w-sm text-xs leading-relaxed">
          Não é possível carregar screenshots e trailers offline.
          <br />
          Conecte-se a uma rede e tente novamente.
        </p>
      </div>
    </div>
  );
}

// === COMPONENTE PRINCIPAL ===

export function GameMedia({ game }: GameMediaProps) {
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [queue, setQueue] = useState<MediaItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const isOnline = useNetworkStatus();

  const load = useCallback(async () => {
    setStatus('loading');
    setErrorMsg('');

    try {
      const data = await invoke<GameMediaData>('get_game_media', {
        gameId: game.id,
        gameName: game.name,
      });

      const built = buildMediaQueue(data);
      setQueue(built);
      setActiveIndex(0);
      setStatus('success');
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : 'Erro desconhecido');
      setStatus('error');
    }
  }, [game.id, game.name]);

  // Reset ao trocar de jogo
  useEffect(() => {
    setQueue([]);
    setActiveIndex(0);
    setStatus('idle');
  }, [game.id]);

  useEffect(() => {
    if (status === 'idle' && isOnline) {
      load();
    }
  }, [status, load, isOnline]);

  // Scroll automático da thumbnail ativa para o centro
  useEffect(() => {
    const container = thumbnailsRef.current;

    if (!container) return;

    const thumb = container.children[activeIndex] as HTMLElement | undefined;

    if (!thumb) return;

    thumb.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [activeIndex]);

  // Navegação por teclado (← →) quando a aba está visível
  useEffect(() => {
    if (status !== 'success') return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && activeIndex > 0) setActiveIndex(i => i - 1);

      if (e.key === 'ArrowRight' && activeIndex < queue.length - 1)
        setActiveIndex(i => i + 1);
    };

    window.addEventListener('keydown', handler);

    return () => window.removeEventListener('keydown', handler);
  }, [status, activeIndex, queue.length]);

  if (!isOnline) return <MediaOffline />;

  if (status === 'loading') return <MediaLoading />;

  if (status === 'error')
    return <MediaError message={errorMsg} onRetry={() => setStatus('idle')} />;

  if (status === 'success' && queue.length === 0)
    return <MediaEmpty gameName={game.name} />;

  if (status !== 'success') return null;

  const activeItem = queue[activeIndex];

  return (
    <>
      {lightboxUrl && (
        <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}

      <div className="flex flex-col gap-4">
        {/* Viewer principal */}
        <MediaViewer
          items={queue}
          activeIndex={activeIndex}
          onNavigate={setActiveIndex}
          onFullscreen={() => {
            if (activeItem?.kind === 'screenshot')
              setLightboxUrl(activeItem.url);
          }}
        />

        {/* Fila de thumbnails com scroll horizontal */}
        <div
          ref={thumbnailsRef}
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none' }}
        >
          {queue.map((item, i) => (
            <MediaThumbnail
              key={`${item.kind}-${i}`}
              item={item}
              active={i === activeIndex}
              onClick={() => setActiveIndex(i)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
