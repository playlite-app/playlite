import { invoke } from '@tauri-apps/api/core';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Gamepad2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { LunaGame } from '@/types/subscriptions';
import { Button } from '@/ui/button';
import { openExternalLink } from '@/utils/openLink';

// Helpers
function formatExpiry(isoDate: string | null): {
  label: string;
  urgent: boolean;
} {
  if (!isoDate) return { label: '', urgent: false };

  const date = new Date(isoDate);
  const diffDays = Math.ceil(
    (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 0) return { label: 'Expira hoje', urgent: true };

  if (diffDays === 1) return { label: 'Expira amanhã', urgent: true };

  if (diffDays <= 3)
    return { label: `Expira em ${diffDays} dias`, urgent: true };

  if (diffDays <= 7)
    return { label: `Expira em ${diffDays} dias`, urgent: false };

  return {
    label: `Expira em ${date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`,
    urgent: false,
  };
}

// Slide individual para cada jogo, exibindo detalhes e botão de resgate
function PrimeSlide({ game, active }: { game: LunaGame; active: boolean }) {
  const expiry = formatExpiry(game.end_time);

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-500 ${
        active ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <div className="flex h-full gap-0 overflow-hidden rounded-2xl border border-white/5 bg-[#1c1c1e]">
        {/* Imagem */}
        <div className="relative w-[46%] shrink-0 overflow-hidden">
          {game.image_url ? (
            <img
              src={game.image_url}
              alt={game.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/5">
              <Gamepad2 size={48} className="text-white/20" />
            </div>
          )}
          {/* Gradiente lateral para fundir com o painel direito */}
          <div className="absolute inset-y-0 right-0 w-24 bg-linear-to-r from-transparent to-[#1c1c1e]" />
        </div>

        {/* Painel direito */}
        <div className="flex flex-1 flex-col justify-center gap-5 px-10 py-8">
          {/* Badge destaque */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-bold tracking-wider text-orange-400 uppercase">
              <Gamepad2 size={11} />
              Destaque Prime
            </span>
          </div>

          {/* Título */}
          <h3 className="text-4xl leading-tight font-extrabold tracking-tight text-white">
            {game.title}
          </h3>

          {/* Descrição */}
          {game.description && (
            <p className="line-clamp-2 text-sm leading-relaxed text-white/50">
              {game.description}
            </p>
          )}

          {/* Botão */}
          <div>
            <Button
              onClick={() => openExternalLink(game.claim_url)}
              className="gap-2 border border-white/15 bg-white/10 text-white hover:bg-white/20"
              variant="outline"
            >
              <ExternalLink size={15} />
              Ver Detalhes
            </Button>
          </div>

          {/* Data de expiração */}
          {expiry.label && (
            <div
              className={`flex items-center gap-2 text-sm font-medium ${
                expiry.urgent ? 'text-red-400' : 'text-white/40'
              }`}
            >
              {expiry.urgent ? <AlertCircle size={14} /> : <Clock size={14} />}
              <span className="tracking-wide uppercase">{expiry.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Título e expiração abaixo do card (rodapé discreto) */}
      <div className="mt-3 flex items-center justify-between px-1">
        <div>
          <p className="text-sm font-semibold text-white/80">{game.title}</p>
          {expiry.label && (
            <p
              className={`text-xs ${expiry.urgent ? 'text-red-400' : 'text-white/40'}`}
            >
              {expiry.label}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente principal da seção Prime Gaming, responsável por buscar os dados e gerenciar o carrossel
export function PrimeGamingSection() {
  const [games, setGames] = useState<LunaGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Busca o catálogo via Tauri
  useEffect(() => {
    invoke<LunaGame[]>('get_amazon_luna_catalog')
      .then(data => {
        // Prioriza jogos que expiram mais cedo no topo do carrossel
        const sorted = [...data].sort((a, b) => {
          if (!a.end_time) return 1;

          if (!b.end_time) return -1;

          return (
            new Date(a.end_time).getTime() - new Date(b.end_time).getTime()
          );
        });
        setGames(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Slides visíveis: jogo que expira primeiro + próximos em destaque
  const slides = games.slice(0, Math.min(games.length, 5));

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex((index + slides.length) % slides.length);
    },
    [slides.length]
  );

  const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  // Autoplay a cada 3s
  useEffect(() => {
    if (slides.length <= 1) return;

    autoplayRef.current = setInterval(next, 3000);

    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [next, slides.length]);

  // Pausa autoplay ao passar o mouse
  const pauseAutoplay = () => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
  };
  const resumeAutoplay = () => {
    if (slides.length <= 1) return;

    autoplayRef.current = setInterval(next, 6000);
  };

  if (loading) {
    return (
      <section>
        <SectionHeader count={0} loading />
        <div className="h-70 animate-pulse rounded-2xl bg-white/5" />
      </section>
    );
  }

  if (games.length === 0) return null;

  return (
    <section>
      <SectionHeader count={games.length} />

      {/* Carrossel */}
      <div
        className="relative"
        onMouseEnter={pauseAutoplay}
        onMouseLeave={resumeAutoplay}
      >
        {/* Área dos slides — altura fixa */}
        <div className="relative h-75 overflow-hidden">
          {slides.map((game, i) => (
            <PrimeSlide
              key={game.title}
              game={game}
              active={i === currentIndex}
            />
          ))}
        </div>

        {/* Botões de navegação */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute top-35 left-0 -translate-x-5 -translate-y-1/2 rounded-full border border-white/10 bg-[#1c1c1e] p-2 text-white/60 shadow-lg transition hover:bg-white/10 hover:text-white"
              aria-label="Anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute top-35 right-0 translate-x-5 -translate-y-1/2 rounded-full border border-white/10 bg-[#1c1c1e] p-2 text-white/60 shadow-lg transition hover:bg-white/10 hover:text-white"
              aria-label="Próximo"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Indicadores de posição */}
        {slides.length > 1 && (
          <div className="mt-2 flex justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'w-6 bg-purple-400'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Ir para slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Header da seção, mostrando o título, contagem de jogos e link para o site da Amazon
function SectionHeader({
  count,
  loading = false,
}: {
  count: number;
  loading?: boolean;
}) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
          <Gamepad2 size={22} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Prime Gaming</h2>
          {!loading && count > 0 && (
            <p className="text-muted-foreground text-sm">
              {count} jogos disponíveis para resgate
            </p>
          )}
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => openExternalLink('https://gaming.amazon.com/home')}
      >
        <ExternalLink size={13} />
        Ver todos
      </Button>
    </div>
  );
}
