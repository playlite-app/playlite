import { RefObject, useEffect } from 'react';

/**
 * Hook para scroll automático da thumbnail ativa para o centro do container.
 *
 * @param containerRef - Ref do elemento container das thumbnails
 * @param activeIndex - Índice do item atualmente ativo
 */
export function useMediaThumbnailScroll(
  containerRef: RefObject<HTMLDivElement | null>,
  activeIndex: number
): void {
  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const thumb = container.children[activeIndex] as HTMLElement | undefined;

    if (!thumb) return;

    thumb.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [containerRef, activeIndex]);
}
