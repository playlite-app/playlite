import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { ImageOff } from 'lucide-react';
import { useEffect, useState } from 'react';

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

  // Lê a configuração do localStorage
  const useLocalImages = localStorage.getItem('config_save_covers') === 'true';

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
          // 2. CACHE HIT: Usa o arquivo local
          const assetUrl = convertFileSrc(localPath);
          setDisplaySrc(assetUrl);
        } else {
          // 3. CACHE MISS: Usa a URL remota
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

    resolveImage();

    return () => {
      isMounted = false;
    };
  }, [src, gameId, useLocalImages, forceRemote]);

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

  // Sempre renderiza a imagem quando temos um displaySrc
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
}
