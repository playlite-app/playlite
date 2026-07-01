import { invoke } from '@tauri-apps/api/core';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Gamepad2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { UbisoftGame } from '@/types/subscriptions';
import { Button } from '@/ui/button';
import { openExternalLink } from '@/utils/openLink';

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

function UbisoftSlide({
  game,
  active,
  t,
}: {
  game: UbisoftGame;
  active: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  // Preferência: short_title (sem edição no nome) → title como fallback
  const title = game.shortTitle ?? game.title;

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-500 ${
        active ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <div className="border-border bg-card flex h-full gap-0 overflow-hidden rounded-2xl border">
        <div className="relative w-[46%] shrink-0 overflow-hidden">
          {game.imageUrl ? (
            <img
              src={game.imageUrl}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/5">
              <Gamepad2 size={48} className="text-white/20" />
            </div>
          )}
          <div className="to-card absolute inset-y-0 right-0 w-24 bg-linear-to-r from-transparent" />
        </div>

        <div className="flex flex-1 flex-col justify-center gap-5 px-10 py-8">
          {/* Badges de topo: Ubisoft+, gênero e +18 */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold tracking-wider text-blue-300 uppercase">
              <Gamepad2 size={11} />
              {t('ubisoft_featured_badge', { defaultValue: 'Ubisoft+' })}
            </span>

            {game.genre && (
              <span className="inline-flex items-center rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-300">
                {game.genre}
              </span>
            )}

            {game.adult && (
              <span className="inline-flex items-center rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400">
                +18
              </span>
            )}
          </div>

          <h3 className="text-foreground text-3xl leading-tight font-extrabold tracking-tight">
            {title}
          </h3>

          {game.edition && (
            <div>
              <span className="bg-muted text-muted-foreground inline-block rounded-full px-2 py-0.5 text-xs">
                {game.edition}
              </span>
            </div>
          )}

          {game.streamingPlatforms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {game.streamingPlatforms.slice(0, 3).map((platform: string) => (
                <span
                  key={platform}
                  className="text-muted-foreground inline-block rounded-full bg-blue-500/20 px-2 py-0.5 text-xs"
                >
                  {platform}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => openExternalLink(game.storeUrl)}
              className="gap-2"
              variant="outline"
            >
              <ExternalLink size={15} />
              {t('ubisoft_view_store', { defaultValue: 'Abrir na loja' })}
            </Button>

            <div className="text-muted-foreground flex flex-col gap-0.5 text-sm">
              {game.releaseDate && (
                <span>
                  {t('ubisoft_released', {
                    defaultValue: `Lançamento: ${formatRelease(game.releaseDate)}`,
                    date: formatRelease(game.releaseDate),
                  })}
                </span>
              )}
              {game.subscriptionExpirationDate && (
                <span className="text-amber-400/70">
                  {t('ubisoft_expires', {
                    defaultValue: `Disponível até: ${formatRelease(game.subscriptionExpirationDate)}`,
                    date: formatRelease(game.subscriptionExpirationDate),
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UbisoftPlusSection() {
  const { t } = useTranslation('subscription');
  const [games, setGames] = useState<UbisoftGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    invoke<UbisoftGame[]>('get_ubisoft_plus_catalog')
      .then(data => setGames(data))
      .catch(() => setGames([]))
      .finally(() => setLoading(false));
  }, []);

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
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-300">
              <Gamepad2 size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {t('ubisoft_section_title', { defaultValue: 'Ubisoft+' })}
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
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-500/10 p-2 text-purple-300">
            <Gamepad2 size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {t('ubisoft_section_title', { defaultValue: 'Ubisoft+' })}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t('ubisoft_available_games_count', {
                count: games.length,
                defaultValue: `${games.length} jogos disponíveis`,
              })}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() =>
            openExternalLink(
              'https://store.ubisoft.com/ofertas/ubisoftplus/games?access=ubisoft&offer=premium'
            )
          }
        >
          <ExternalLink size={13} />
          {t('ubisoft_view_all_button', { defaultValue: 'Ver catálogo' })}
        </Button>
      </div>

      <div
        className="relative"
        onMouseEnter={pauseAutoplay}
        onMouseLeave={resumeAutoplay}
      >
        <div className="relative h-80 overflow-hidden transition-all duration-300 ease-in-out">
          {slides.map((game, i) => (
            <UbisoftSlide
              key={`${game.title}-${i}`}
              game={game}
              active={i === currentIndex}
              t={t}
            />
          ))}
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted-foreground absolute top-40 left-0 -translate-x-5 -translate-y-1/2 rounded-full border p-2 shadow-lg transition"
              aria-label={t('ubisoft_previous_slide_aria_label')}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={next}
              className="bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted-foreground absolute top-40 right-0 translate-x-5 -translate-y-1/2 rounded-full border p-2 shadow-lg transition"
              aria-label={t('ubisoft_next_slide_aria_label')}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

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
                aria-label={t('ubisoft_go_to_slide_aria_label', {
                  slide: i + 1,
                  defaultValue: `Ir para slide ${i + 1}`,
                })}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
