import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { ImageOff } from 'lucide-react';
import { memo, useEffect, useState } from 'react';

interface CachedImageProps {
  src?: string | null;
  gameId: string;
  alt: string;
  className?: string;
  forceRemote?: boolean;
  onError?: () => void;
}

/**
 * Lê a preferência de "salvar capas localmente" uma única vez por montagem do
 * componente (lazy init do useState), em vez de ler o localStorage sempre.
 */
function useSaveCoversEnabled(): boolean {
  const [enabled] = useState(
    () => localStorage.getItem('config_save_covers') === 'true'
  );

  return enabled;
}

export const CachedImage = memo(function CachedImage({
  src,
  gameId,
  alt,
  className,
  forceRemote = false,
  onError,
}: CachedImageProps) {
  const useLocalImages = useSaveCoversEnabled();
  const [error, setError] = useState(false);
  const [resolvedLocalSrc, setResolvedLocalSrc] = useState<string | null>(null);

  // Enquanto "salvar capas" estiver desligado (padrão do app) ou forceRemote
  // for true, pula o ciclo assíncrono de verificação de cache local.
  const skipLocalResolution = !useLocalImages || forceRemote;

  useEffect(() => {
    if (skipLocalResolution || !src) {
      setResolvedLocalSrc(null);

      return;
    }

    if (!gameId || gameId === 'undefined' || gameId === 'null') {
      console.warn('gameId inválido, usando URL remota:', gameId);
      setResolvedLocalSrc(null);

      return;
    }

    let isMounted = true;

    const resolveImage = async () => {
      try {
        // 1. Pergunta ao Rust se a imagem já existe no disco
        const localPath = await Promise.race([
          invoke<string | null>('check_local_cover', {
            gameId: String(gameId),
          }),
          new Promise<null>((_, reject) =>
            setTimeout(
              () => reject(new Error('Timeout ao verificar cache')),
              3000
            )
          ),
        ]);

        if (!isMounted) return;

        if (localPath) {
          // 2. CACHE HIT: usa o arquivo local
          setResolvedLocalSrc(convertFileSrc(localPath));
        } else {
          // 3. CACHE MISS: mantém a URL remota (via fallback) e dispara o download em background.
          invoke('cache_cover_image', {
            url: src,
            gameId: String(gameId),
          }).catch(err => console.warn('Falha no cache de imagem:', err));
        }
      } catch (e) {
        console.warn('Erro no sistema de cache, usando URL remota:', e);
      }
    };

    resolveImage();

    return () => {
      isMounted = false;
    };
  }, [src, gameId, skipLocalResolution]);

  // Fonte final: local resolvida (cache hit) ou remota como fallback —
  // sem indireção de estado extra quando o cache local está desligado.
  const displaySrc = skipLocalResolution ? src : (resolvedLocalSrc ?? src);

  // Renderiza Placeholder se der erro ou não tiver imagem
  if (error || !displaySrc) {
    return (
      <div
        className={`bg-muted text-muted-foreground flex items-center justify-center ${className}`}
      >
        <ImageOff size={24} className="opacity-20" />
      </div>
    );
  }

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      onError={() => {
        console.warn(`Erro ao carregar imagem: ${displaySrc}`);
        setError(true);
        onError?.();
      }}
      loading="lazy"
    />
  );
});
