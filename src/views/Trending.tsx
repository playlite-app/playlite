import {
  Clock,
  ExternalLink,
  Filter,
  Flame,
  Gamepad2,
  Gift,
  Heart,
  Loader2,
  TrendingUp,
  WifiOff,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Affinity, ErrorState } from '@/components';
import { FreeGameCard } from '@/components/cards';
import StandardGameCard from '@/components/cards/StandardGameCard';
import { ActionButton } from '@/components/common';
import Hero from '@/components/common/Hero';
import {
  calculateGameAffinity,
  GiveawayWithAffinity,
  useGiveaways,
  useHeroCarousel,
  useNetworkStatus,
  useRecommendation,
  useSortedByAffinity,
  useTrending,
  useUpcoming,
  useWishlist,
} from '@/hooks';
import { Game, Giveaway, RawgGame } from '@/types';
import { Button } from '@/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu';
import { Separator } from '@/ui/separator';
import { Skeleton } from '@/ui/skeleton';
import { toast } from '@/utils/toast';

import { openExternalLink } from '../utils/openLink';

interface TrendingProps {
  userGames: Game[];
  onChangeTab: (tab: string) => void;
  cachedGames: RawgGame[];
  setCachedGames: (games: RawgGame[]) => void;
  cachedFetchedAt: number | null;
  setCachedFetchedAt: (value: number | null) => void;
  upcomingCache: RawgGame[];
  setUpcomingCache: (games: RawgGame[]) => void;
  upcomingFetchedAt: number | null;
  setUpcomingFetchedAt: (value: number | null) => void;
  giveawaysCache: Giveaway[];
  setGiveawaysCache: (games: Giveaway[]) => void;
  giveawaysFetchedAt: number | null;
  setGiveawaysFetchedAt: (value: number | null) => void;
}

const PLATFORM_OPTIONS = [
  { id: 'Steam', label: 'Steam' },
  { id: 'Epic Games Store', label: 'Epic Games' },
  { id: 'Prime Gaming', label: 'Prime Gaming' },
  { id: 'GOG', label: 'GOG' },
  { id: 'Ubisoft', label: 'Ubisoft' },
  { id: 'Itch.io', label: 'Itch.io' },
  { id: 'IndieGala', label: 'IndieGala' },
];

export default function Trending(props: TrendingProps) {
  const { t } = useTranslation('trending');
  const isOnline = useNetworkStatus();

  // Hooks customizados para gerenciar diferentes aspectos da página
  const {
    games,
    allGenres,
    loading: gamesLoading,
    error,
    selectedGenre,
    setSelectedGenre,
    addToWishlist,
  } = useTrending(props);

  const { profile } = useRecommendation();
  const { games: wishlistGames } = useWishlist();
  const { upcomingGames } = useUpcoming({
    cachedGames: props.upcomingCache,
    setCachedGames: props.setUpcomingCache,
    cachedFetchedAt: props.upcomingFetchedAt,
    setCachedFetchedAt: props.setUpcomingFetchedAt,
  });
  const {
    filteredGiveaways,
    loading: giveawaysLoading,
    selectedPlatforms,
    togglePlatform,
  } = useGiveaways(profile, {
    cachedGiveaways: props.giveawaysCache,
    setCachedGiveaways: props.setGiveawaysCache,
    cachedFetchedAt: props.giveawaysFetchedAt,
    setCachedFetchedAt: props.setGiveawaysFetchedAt,
  });

  // Verifica se temos ALGUM dado para mostrar (cache)
  const hasData =
    games.length > 0 ||
    upcomingGames.length > 0 ||
    filteredGiveaways.length > 0;

  // Lógica de Bloqueio: Só mostra erro se estiver offline E sem dados
  if (!isOnline && !hasData) {
    return (
      <ErrorState
        type="offline"
        onAction={() => props.onChangeTab('libraries')}
      />
    );
  }

  // Hero carousel
  const heroGames = games.slice(0, 5);
  const {
    currentIndex: heroIndex,
    next: nextHero,
    prev: prevHero,
  } = useHeroCarousel(heroGames.length);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleWishlistClick = async (game: RawgGame) => {
    try {
      await addToWishlist(game);
      toast.success(t('game_added_to_wishlist_title', { name: game.name }), {
        description: t('game_added_to_wishlist_description'),
      });
    } catch {
      toast.error(t('add_to_wishlist_error_title'), {
        description: t('add_to_wishlist_error_description'),
      });
    }
  };

  if (error && !hasData) {
    const isConfigError = error.includes('401') || error.includes('Key');

    if (isConfigError) {
      return (
        <ErrorState
          type="config"
          onAction={() => props.onChangeTab('settings')}
        />
      );
    }

    return <ErrorState type="api" message={error} onRetry={handleRetry} />;
  }

  if (gamesLoading && !hasData) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center space-y-4">
        <Loader2 className="text-primary h-10 w-10 animate-spin" />
        <p className="text-muted-foreground">{t('checking_global_trends')}</p>
      </div>
    );
  }

  // Hero atual
  const currentHero = heroGames[heroIndex];
  const isHeroInWishlist = wishlistGames.some(
    w => w.id === currentHero?.id.toString()
  );

  if (!currentHero) {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center">
        <div className="bg-muted/20 mb-4 rounded-full p-4">
          <Gamepad2 className="h-12 w-12 opacity-50" />
        </div>
        <h3 className="text-lg font-medium">{t('no_games_found')}</h3>
        <Button variant="outline" className="mt-6" onClick={handleRetry}>
          {t('reload_button')}
        </Button>
      </div>
    );
  }

  // Ordenação da Grid por afinidade
  const gridGames = useSortedByAffinity(games.slice(5, 15), profile);

  return (
    <div className="custom-scrollbar bg-background flex-1 overflow-y-auto">
      {/* Banner de Modo Offline */}
      {!isOnline && hasData && (
        <div className="flex items-center justify-center gap-2 border-b border-yellow-500/20 bg-yellow-500/10 px-6 py-2 text-xs font-medium text-yellow-600 dark:text-yellow-400">
          <WifiOff size={14} />
          <span>{t('offline_mode_banner')}</span>
        </div>
      )}

      {/* 1. Hero */}
      <Hero
        gameId={currentHero.id.toString()}
        title={currentHero.name}
        backgroundUrl={currentHero.backgroundImage}
        coverUrl={currentHero.backgroundImage}
        genres={currentHero.genres.map(g => g.name)}
        rating={currentHero.rating}
        showNavigation={heroGames.length > 1}
        onNext={nextHero}
        onPrev={prevHero}
        badges={
          <div className="bg-gold-500/20 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/20 px-3 py-1 text-sm font-medium text-orange-400">
            <Flame size={16} /> {t('trending_badge')}
          </div>
        }
        actions={
          <>
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => handleWishlistClick(currentHero)}
            >
              <Heart
                size={18}
                className={`text-red-500 ${isHeroInWishlist ? 'fill-current' : ''}`}
              />{' '}
              {t('wishlist_button')}
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={() =>
                openExternalLink(`https://rawg.io/games/${currentHero.id}`)
              }
            >
              <ExternalLink size={18} /> {t('view_details_button')}
            </Button>
          </>
        }
      />

      {/* 2. Barra de Filtros de Gênero (Sticky) */}
      <div className="bg-background/80 border-border sticky top-0 z-20 border-b p-4 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-6">
          <div className="text-muted-foreground flex items-center gap-2">
            <Filter size={18} />
            <span className="text-sm font-medium">{t('filter_label')}:</span>
          </div>

          <select
            value={selectedGenre}
            onChange={e => setSelectedGenre(e.target.value)}
            className="bg-secondary text-secondary-foreground focus:ring-primary cursor-pointer rounded-md border-none px-3 py-1.5 text-sm font-medium outline-none focus:ring-1"
          >
            <option value="all">{t('all_genres_option')}</option>
            {allGenres.map(g => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <div className="text-muted-foreground ml-auto hidden text-sm sm:block">
            {t('suggestions_available')}
          </div>
        </div>
      </div>

      {/* 3. Container Principal de Conteúdo (Jogos Grátis) */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header da Seção + Filtro de Loja */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 bg-linear-to-br to-purple-600 p-2.5 text-white shadow-lg">
              <Gift size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {t('free_games_section')}
              </h2>
              <p className="text-muted-foreground text-sm">
                {t('free_games_description')}
              </p>
            </div>
          </div>

          {/* Botão de Filtro */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="w-40 gap-2 font-medium"
              >
                <Filter size={16} />
                {t('filter_stores_button')}
                {selectedPlatforms.length < PLATFORM_OPTIONS.length && (
                  <span className="bg-primary text-primary-foreground ml-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shadow-sm">
                    {selectedPlatforms.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>{t('platforms_label')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {PLATFORM_OPTIONS.map(platform => (
                <DropdownMenuCheckboxItem
                  key={platform.id}
                  checked={selectedPlatforms.includes(platform.id)}
                  onCheckedChange={() => togglePlatform(platform.id)}
                >
                  {platform.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Grid de Jogos Grátis */}
        {filteredGiveaways.length === 0 && !giveawaysLoading ? (
          <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center">
            <Gift className="mx-auto mb-3 h-12 w-12 opacity-20" />
            <p className="text-base font-medium">
              {t('no_games_with_filters')}
            </p>
            <p className="mt-1 text-sm">{t('try_other_platforms')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {giveawaysLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-video w-full rounded-lg" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))
              : filteredGiveaways.map((game: GiveawayWithAffinity) => (
                  <FreeGameCard
                    key={game.id}
                    {...game}
                    badge={game.affinityData.badge}
                  />
                ))}
          </div>
        )}

        <Separator className="mt-8" />

        {/* 4. Mais Sugestões (Trending Grid) */}
        <div className="mb-6 flex items-center gap-2 pt-8">
          <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
            <TrendingUp size={20} />
          </div>
          <h2 className="text-2xl font-bold">
            {t('more_suggestions_section')}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {gridGames.map(game => {
            const { genres, badge } = calculateGameAffinity(game, profile);
            const isInWishlist = wishlistGames.some(
              w => w.id === game.id.toString()
            );

            return (
              <StandardGameCard
                id={game.id.toString()}
                key={game.id}
                title={game.name}
                coverUrl={game.backgroundImage}
                rating={game.rating}
                subtitle={genres.slice(0, 2).join(', ')}
                badge={
                  badge ? (
                    <Affinity
                      badge={
                        badge as 'SÉRIE FAVORITA' | 'TOP PICK' | 'PARA VOCÊ'
                      }
                    >
                      <span>{badge}</span>
                    </Affinity>
                  ) : null
                }
                actions={
                  <>
                    <ActionButton
                      icon={Heart}
                      variant={isInWishlist ? 'glass-destructive' : 'glass'}
                      onClick={() => handleWishlistClick(game)}
                      tooltip={t('wishlist_button')}
                    />
                    <ActionButton
                      icon={ExternalLink}
                      variant="secondary"
                      size={16}
                      onClick={() =>
                        openExternalLink(`https://rawg.io/games/${game.id}`)
                      }
                      tooltip={t('view_details_button')}
                    />
                  </>
                }
              />
            );
          })}
        </div>

        {/* 5. Lançamentos Aguardados */}
        {upcomingGames.length > 0 && (
          <>
            <div className="mb-6 flex items-center gap-2 pt-12">
              <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
                <Clock size={20} />
              </div>
              <h2 className="text-2xl font-bold">
                {t('upcoming_releases_section')}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
              {upcomingGames.map(game => {
                const { badge } = calculateGameAffinity(game, profile);
                const isInWishlist = wishlistGames.some(
                  w => w.id === game.id.toString()
                );

                return (
                  <StandardGameCard
                    id={game.id.toString()}
                    key={game.id}
                    title={game.name}
                    coverUrl={game.backgroundImage}
                    subtitle={
                      game.released
                        ? t('release_label') +
                          ': ' +
                          new Date(game.released).toLocaleDateString()
                        : t('coming_soon')
                    }
                    badge={
                      badge ? (
                        <Affinity
                          badge={
                            badge as 'SÉRIE FAVORITA' | 'TOP PICK' | 'PARA VOCÊ'
                          }
                        >
                          <span>{badge}</span>
                        </Affinity>
                      ) : null
                    }
                    actions={
                      <>
                        <ActionButton
                          icon={Heart}
                          variant={isInWishlist ? 'glass-destructive' : 'glass'}
                          onClick={() => handleWishlistClick(game)}
                          tooltip={t('wishlist_button')}
                        />
                        <ActionButton
                          icon={ExternalLink}
                          variant="secondary"
                          size={16}
                          onClick={() =>
                            openExternalLink(`https://rawg.io/games/${game.id}`)
                          }
                          tooltip={t('view_details_button')}
                        />
                      </>
                    }
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
