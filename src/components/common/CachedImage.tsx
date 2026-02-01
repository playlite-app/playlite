import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { ImageOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const localCoverCache = new Map<string, string | null>();
const localCoverInFlight = new Map<string, Promise<string | null>>();

interface CachedImageProps {
  src?: string | null;
  gameId: string;
  alt: string;
  className?: string;
  forceRemote?: boolean;
  onError?: () => void;
}

export function CachedImage({
  src,
  gameId,
  alt,
  className,
  forceRemote = false,
  onError,
}: CachedImageProps) {
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Lê a configuração do localStorage
  const useLocalImages = localStorage.getItem('config_save_covers') === 'true';

  // 1. IntersectionObserver: Detecta quando a imagem entra no viewport
  useEffect(() => {
    const element = imgRef.current;

    if (!element) return;

    // Cria o observer com rootMargin para carregar antes de aparecer
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Para de observar após primeiro load
        }
      },
      {
        rootMargin: '300px', // Carrega 300px antes de entrar na tela
        threshold: 0.01, // Dispara quando 1% está visível
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  // 2. Resolve a imagem apenas quando visível
  useEffect(() => {
    let isMounted = true;

    const resolveImage = async () => {
      // Se não tem imagem, reseta
      if (!src) {
        if (isMounted) {
          setDisplaySrc(null);
        }

        return;
      }

      // Se não tem gameId válido, usa URL remota direto
      if (!gameId || gameId === 'undefined' || gameId === 'null') {
        console.warn('gameId inválido, usando URL remota:', gameId);

        if (isMounted) {
          setDisplaySrc(src);
        }

        return;
      }

      // Se a config estiver DESLIGADA ou forceRemote, usa URL normal
      if (!useLocalImages || forceRemote) {
        if (isMounted) {
          setDisplaySrc(src);
        }

        return;
      }

      try {
        if (localCoverCache.has(gameId)) {
          const cachedPath = localCoverCache.get(gameId);

          if (cachedPath) {
            setDisplaySrc(convertFileSrc(cachedPath));
          } else {
            setDisplaySrc(src);
          }

          return;
        }

        let inFlight = localCoverInFlight.get(gameId);

        if (!inFlight) {
          inFlight = Promise.race([
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

          localCoverInFlight.set(gameId, inFlight);
        }

        const localPath = await inFlight;
        localCoverInFlight.delete(gameId);

        if (!isMounted) return;

        localCoverCache.set(gameId, localPath);

        if (localPath) {
          // CACHE HIT: Usa o arquivo local
          const assetUrl = convertFileSrc(localPath);
          setDisplaySrc(assetUrl);
        } else {
          // CACHE MISS: Usa a URL remota
          setDisplaySrc(src);

          // Dispara o download em background para a próxima vez
          invoke('cache_cover_image', {
            url: src,
            gameId: String(gameId),
          }).catch(err => console.warn('Falha no cache de imagem:', err));
        }
      } catch (e) {
        console.warn('Erro no sistema de cache, usando URL remota:', e);

        if (isMounted) setDisplaySrc(src); // Fallback para URL remota
      }
    };

    // Só resolve quando visível
    if (isVisible) {
      resolveImage();
    }

    return () => {
      isMounted = false;
    };
  }, [src, gameId, useLocalImages, forceRemote, isVisible]);

  // Sempre renderiza com ref (necessário para IntersectionObserver)
  return (
    <div ref={imgRef} className={className}>
      {error || !displaySrc ? (
        // Fallback: ícone placeholder
        <div className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center">
          <ImageOff size={24} className="opacity-20" />
        </div>
      ) : (
        // Imagem carregada
        <img
          src={displaySrc}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => {
            console.warn(`Erro ao carregar imagem: ${displaySrc}`);
            setError(true);
            onError?.();
          }}
          loading="lazy"
        />
      )}
    </div>
  );
}
