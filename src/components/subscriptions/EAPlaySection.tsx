import { invoke } from '@tauri-apps/api/core';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Gamepad2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EAPlayGame } from '@/types/subscriptions';
import { Button } from '@/ui/button';
import { openExternalLink } from '@/utils/openLink';

// Helper para formatar data de lançamento
function formatRelease(dateIso?: string | null) {
  if (!dateIso) return '';

  try {
    const d = new Date(dateIso);

    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateIso;
  }
}

// Slide individual do EA Play
function EAPlaySlide({ game, active }: { game: EAPlayGame; active: boolean }) {
  const { t } = useTranslation('subscription');

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-500 ${
        active ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <div className="border-border bg-card flex h-full gap-0 overflow-hidden rounded-2xl border">
        {/* Imagem */}
        <div className="relative w-[46%] shrink-0 overflow-hidden">
          {game.imageHero ? (
            <img
              src={game.imageHero}
              alt={game.title}
              className="h-full w-full object-cover"
            />
          ) : game.imagePoster ? (
            <img
              src={game.imagePoster}
              alt={game.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/5">
              <Gamepad2 size={48} className="text-white/20" />
            </div>
          )}
          <div className="to-card absolute inset-y-0 right-0 w-24 bg-linear-to-r from-transparent" />
        </div>

        {/* Painel direito */}
        <div className="flex flex-1 flex-col justify-center gap-5 px-10 py-8">
          {/* Badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold tracking-wider text-red-400 uppercase">
              <Gamepad2 size={11} />
              {t('eaplay_featured_badge', 'EA Play')}
            </span>
          </div>

          {/* Título */}
          <h3 className="text-foreground text-3xl leading-tight font-extrabold tracking-tight">
            {game.title}
          </h3>

          {/* Categorias */}
          {game.categories && game.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {game.categories.slice(0, 3).map((c, idx) => (
                <span
                  key={idx}
                  className="text-muted-foreground bg-muted inline-block rounded-full px-2 py-0.5 text-xs"
                >
                  {c}
                </span>
              ))}
            </div>
          )}

          {/* Descrição */}
          {game.description && (
            <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
              {game.description}
            </p>
          )}

          {/* Botão + data */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => openExternalLink(game.storeUrl)}
              className="gap-2"
              variant="outline"
            >
              <ExternalLink size={15} />
              {t('eaplay_view_store', 'Abrir na loja')}
            </Button>

            {game.originalReleaseDate && (
              <div className="text-muted-foreground text-sm">
                {t('eaplay_released', {
                  date: formatRelease(game.originalReleaseDate),
                })}
              </div>
            )}
          </div>

          {/* Developer + score */}
          <div className="text-muted-foreground text-sm">
            {game.developer && (
              <span className="mr-3">
                {t('eaplay_developer', 'Desenvolvedor')}: {game.developer}
              </span>
            )}
            {game.reviewScore !== undefined && game.reviewScore !== null && (
              <span>
                {t('eaplay_score', 'Avaliação')}: {game.reviewScore} (
                {game.reviewCount ?? 0})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente principal
export function EAPlaySection() {
  const { t, i18n } = useTranslation('subscription');
  const [games, setGames] = useState<EAPlayGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setLoading(true);
    invoke<EAPlayGame[]>('get_ea_play_catalog', {
      lang: i18n.language,
    })
      .then(data => {
        setGames(data);
      })
      .catch(() => setGames([]))
      .finally(() => setLoading(false));
  }, [i18n.language]);

  const slides = games.slice(0, Math.min(games.length, 5));

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex((index + slides.length) % slides.length);
    },
    [slides.length]
  );

  const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  useEffect(() => {
    if (slides.length <= 1) return;

    autoplayRef.current = setInterval(next, 3000);

    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [next, slides.length]);

  const pauseAutoplay = () => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
  };
  const resumeAutoplay = () => {
    if (slides.length <= 1) return;

    autoplayRef.current = setInterval(next, 3000);
  };

  if (loading) {
    return (
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <Gamepad2 size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {t('eaplay_section_title', 'EA Play')}
              </h2>
            </div>
          </div>
        </div>
        <div className="h-70 animate-pulse rounded-2xl bg-white/5" />
      </section>
    );
  }

  if (games.length === 0) return null;

  return (
    <section>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
            <Gamepad2 size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {t('eaplay_section_title', 'EA Play')}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t('eaplay_available_games_count', { count: games.length })}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => openExternalLink('https://www.ea.com/ea-play/games')}
        >
          <ExternalLink size={13} />
          {t('eaplay_view_all_button', 'Ver catálogo')}
        </Button>
      </div>

      {/* Carrossel */}
      <div
        className="relative"
        onMouseEnter={pauseAutoplay}
        onMouseLeave={resumeAutoplay}
      >
        <div className="relative h-100 overflow-hidden transition-all duration-300 ease-in-out">
          {slides.map((game, i) => (
            <EAPlaySlide
              key={game.storeId}
              game={game}
              active={i === currentIndex}
            />
          ))}
        </div>

        {/* Navegação */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted-foreground absolute top-50 left-0 -translate-x-5 -translate-y-1/2 rounded-full border p-2 shadow-lg transition"
              aria-label={t('eaplay_previous_slide_aria_label')}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={next}
              className="bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted-foreground absolute top-50 right-0 translate-x-5 -translate-y-1/2 rounded-full border p-2 shadow-lg transition"
              aria-label={t('eaplay_next_slide_aria_label')}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Indicadores */}
        {slides.length > 1 && (
          <div className="mt-2 flex justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'bg-muted-foreground w-6'
                    : 'bg-muted-foreground/20 hover:bg-muted-foreground/40 w-2'
                }`}
                aria-label={t('eaplay_go_to_slide_aria_label', {
                  slide: i + 1,
                })}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
