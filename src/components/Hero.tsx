import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { ReactNode } from 'react';

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
  return (
    <div className="bg-background group/hero relative h-125 overflow-hidden">
      {/* 1. BACKGROUND (Blur) */}
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center blur-xl brightness-50 transition-all duration-700"
        style={{
          backgroundImage: `url(${backgroundUrl || coverUrl})`,
        }}
      />
      <div className="from-background via-background/60 absolute inset-0 bg-gradient-to-t to-transparent" />

      {/* 2. NAVEGAÇÃO (Setas) */}
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

      {/* 3. CONTEÚDO PRINCIPAL */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-8">
        <div
          className="animate-in fade-in flex w-full flex-col items-center gap-8 duration-500 md:flex-row"
          key={title}
        >
          {/* Capa */}
          <img
            src={coverUrl || ''}
            alt={title}
            className="aspect-3/4 w-64 rounded-lg border border-white/10 object-cover shadow-2xl md:w-80"
          />

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
