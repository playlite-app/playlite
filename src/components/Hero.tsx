import { ChevronLeft, ChevronRight, ImageOff, Star } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';

interface HeroProps {
  // Dados Básicos
  title: string;
  backgroundUrl?: string | null;
  coverUrl?: string | null;
  genres?: string[];
  rating?: number;

  // Slots de Conteúdo (Composição)
  badges?: ReactNode;
  actions?: ReactNode;

  // Navegação (Opcional)
  onNext?: () => void;
  onPrev?: () => void;
  showNavigation?: boolean;
}

/**
 * Banner hero fullwidth com background desfocado usado no topo das páginas Início e Em Alta.
 * Suporta navegação entre itens e composição via slots (badges/actions).
 *
 * Layout responsivo que se adapta a telas menores.
 * Background usa a mesma imagem da capa com blur e escurecimento.
 *
 * @param title - Nome do jogo/item principal
 * @param backgroundUrl - URL para background (fallback para coverUrl se ausente)
 * @param coverUrl - URL da capa vertical do jogo
 * @param genres - Array de gêneros exibidos como tags
 * @param rating - Nota de 0-5 exibida com estrela (opcional)
 * @param badges - Slot para badges customizados (ex: "Favorito", "Não Jogado")
 * @param actions - Slot para botões de ação (ex: "Seu Campeão", "Em Alta", "Sugestão")
 * @param showNavigation - Exibe setas de navegação esquerda/direita
 * @param onNext - Callback para seta direita (próximo item)
 * @param onPrev - Callback para seta esquerda (item anterior)
 */
export default function Hero({
  title,
  backgroundUrl,
  coverUrl,
  genres = [],
  rating,
  badges,
  actions,
  onNext,
  onPrev,
  showNavigation = false,
}: HeroProps) {
  const [imageError, setImageError] = useState(false);

  // Reset error state quando coverUrl mudar
  useEffect(() => {
    setImageError(false);
  }, [coverUrl]);

  return (
    <div className="bg-background group/hero relative h-125 overflow-hidden">
      {/* Background (Blur) */}
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center blur-xl brightness-50 transition-all duration-700"
        style={{
          backgroundImage: `url(${backgroundUrl || coverUrl})`,
        }}
      />
      <div className="from-background via-background/60 absolute inset-0 bg-linear-to-t to-transparent" />

      {/* Navegação (Setas) */}
      {showNavigation && onPrev && onNext && (
        <>
          <button
            onClick={onPrev}
            className="absolute top-1/2 left-4 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition hover:bg-black/60"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={onNext}
            className="absolute top-1/2 right-4 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition hover:bg-black/60"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Conteúdo principal */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-8">
        <div
          className="animate-in fade-in flex w-full flex-col items-center gap-8 duration-500 md:flex-row"
          key={title}
        >
          {/* Capa com Fallback */}
          {coverUrl && !imageError ? (
            <img
              src={coverUrl}
              alt={title}
              className="aspect-3/4 w-64 rounded-lg border border-white/10 object-cover shadow-2xl md:w-80"
              onError={() => setImageError(true)}
            />
          ) : (
            /* Fallback Visual (Gradiente + Ícone + Nome) */
            <div className="from-secondary/50 via-muted to-background flex aspect-3/4 w-64 flex-col items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br p-4 text-center shadow-2xl md:w-80">
              <ImageOff className="mb-3 h-10 w-10 opacity-20" />
              <span className="text-muted-foreground line-clamp-2 text-[10px] font-semibold tracking-widest uppercase">
                {title}
              </span>
            </div>
          )}

          {/* Coluna de Informações */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            {/* Slot de Badges */}
            {badges && <div className="mb-2">{badges}</div>}

            <h1 className="text-4xl leading-tight font-bold text-white md:text-5xl">
              {title}
            </h1>

            {/* Lista de Gêneros */}
            {genres.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                {genres.map(g => (
                  <span
                    key={g}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs text-white"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Avaliação (Opcional) */}
            {rating && (
              <div className="flex items-center justify-center gap-6 pt-2 md:justify-start">
                <div className="flex items-center gap-2">
                  <Star className="fill-yellow-400 text-yellow-400" size={24} />
                  <div>
                    <span className="text-2xl font-bold text-white">
                      {rating}
                    </span>
                    <span className="ml-1 text-sm text-white/50">/ 5.0</span>
                  </div>
                </div>
              </div>
            )}

            {/* Slot de Ações (Botões) */}
            {actions && (
              <div className="mt-6 flex justify-center gap-3 md:justify-start">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
