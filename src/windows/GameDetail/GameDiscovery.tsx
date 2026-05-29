import { invoke } from '@tauri-apps/api/core';
import { ExternalLink, Frown, ImageOff, Loader2, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Game } from '@/types/game';

// Espelha SimilarGame do backend (gamebrain.rs)
interface SimilarGame {
  id: string;
  name: string;
  cover_url: string | null;
  genre: string | null;
  year: number | null;
  rating: number | null;
  link: string | null;
  screenshots: string[];
  micro_trailer: string | null;
  adult_only: boolean;
}

interface GameDiscoveryProps {
  game: Game;
}

interface SimilarGameCardProps {
  game: SimilarGame;
}

// === CARD DE JOGO SIMILAR ===

function SimilarGameCard({ game }: SimilarGameCardProps) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Imagem de fundo: micro_trailer quando hover, cover quando não
  const hasTrailer = !!game.micro_trailer;
  const coverSrc = imgError ? null : game.cover_url;

  return (
    <div
      className="group border-border bg-muted/10 hover:border-border/80 hover:bg-muted/20 relative overflow-hidden rounded-lg border transition-all duration-200"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Cover / Trailer */}
      <div className="bg-muted/30 relative aspect-3/4 w-full overflow-hidden">
        {/* Imagem de capa */}
        {coverSrc && (
          <img
            src={coverSrc}
            alt={game.name}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              hovered && hasTrailer ? 'opacity-0' : 'opacity-100'
            }`}
            onError={() => setImgError(true)}
          />
        )}

        {/* Micro-trailer (webm) — só carrega quando hover para não desperdiçar banda */}
        {hasTrailer && hovered && (
          <video
            src={game.micro_trailer!}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* Fallback sem imagem */}
        {!coverSrc && !hasTrailer && (
          <div className="from-secondary/50 via-muted to-background flex h-full w-full flex-col items-center justify-center bg-linear-to-br p-4 text-center">
            <ImageOff className="mb-3 h-10 w-10 opacity-30" />
            <span className="text-muted-foreground line-clamp-2 text-[10px] font-semibold tracking-widest wrap-break-word uppercase">
              {game.name}
            </span>
          </div>
        )}

        {/* Badge adult_only */}
        {game.adult_only && (
          <span className="bg-destructive/80 text-destructive-foreground absolute top-2 left-2 rounded px-1.5 py-0.5 text-[10px] font-semibold">
            +18
          </span>
        )}

        {/* Badge rating — canto superior direito */}
        {game.rating !== null && (
          <span className="absolute top-2 right-2 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
            <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
            {game.rating}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p
          className="text-foreground truncate text-sm font-medium"
          title={game.name}
        >
          {game.name}
        </p>

        <div className="mt-1 flex items-center justify-between">
          <span className="text-muted-foreground truncate text-xs">
            {[game.genre, game.year].filter(Boolean).join(' · ')}
          </span>

          {game.link && (
            <a
              href={game.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary ml-2 shrink-0 transition-colors"
              title="Ver na GameBrain"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// === ESTADOS DE UI ===

function DiscoveryLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        <p className="text-muted-foreground text-sm">
          Buscando jogos similares…
        </p>
      </div>
    </div>
  );
}

function DiscoveryEmpty({ gameName }: { gameName: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <Frown className="text-muted-foreground/50 h-8 w-8" />
      <p className="text-foreground text-sm font-medium">
        Nenhum similar encontrado
      </p>
      <p className="text-muted-foreground max-w-xs text-xs">
        A GameBrain não encontrou jogos similares a{' '}
        <span className="text-foreground font-medium">{gameName}</span>.
      </p>
    </div>
  );
}

function DiscoveryError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
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

// === COMPONENTE PRINCIPAL ===

export function GameDiscovery({ game }: GameDiscoveryProps) {
  const [results, setResults] = useState<SimilarGame[]>([]);
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const load = async () => {
    setStatus('loading');
    setErrorMsg('');

    try {
      const data = await invoke<SimilarGame[]>('get_similar_games', {
        gameId: game.id,
        gameName: game.name,
      });

      setResults(data);
      setStatus('success');
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Erro desconhecido';
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  // Carrega ao montar ou quando o jogo muda
  useEffect(() => {
    setResults([]);
    setStatus('idle');
  }, [game.id]);

  useEffect(() => {
    if (status === 'idle') {
      load();
    }
  }, [status]);

  if (status === 'loading') return <DiscoveryLoading />;

  if (status === 'error')
    return (
      <DiscoveryError message={errorMsg} onRetry={() => setStatus('idle')} />
    );

  if (status === 'success' && results.length === 0)
    return <DiscoveryEmpty gameName={game.name} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-sm font-semibold">
          Similares a <span className="text-primary">{game.name}</span>
        </h3>
        <span className="text-muted-foreground text-xs">
          {results.length} jogos
        </span>
      </div>

      {/* Grid responsivo — 2 cols em telas pequenas, 3 em médias, 4 em grandes */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {results.map(similar => (
          <SimilarGameCard key={similar.id} game={similar} />
        ))}
      </div>
    </div>
  );
}
