import {
  Clock,
  ExternalLink,
  Filter,
  Flame,
  Gamepad2,
  Heart,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ActionButton } from '@/components/ActionButton.tsx';
import Hero from '@/components/Hero';
import StandardGameCard from '@/components/StandardGameCard.tsx';
import { Button } from '@/components/ui/button';
import { Game, RawgGame } from '@/types';

import { ErrorState } from '../components/ErrorState';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useRecommendation } from '../hooks/useRecommendation';
import { useTrending } from '../hooks/useTrending';
import { useWishlist } from '../hooks/useWishlist';
import { trendingService } from '../services/trendingService';
import { openExternalLink } from '../utils/navigation';

interface TrendingProps {
  userGames: Game[];
  onChangeTab: (tab: string) => void;
  cachedGames: RawgGame[];
  setCachedGames: (games: RawgGame[]) => void;
}

export default function Trending(props: TrendingProps) {
  const isOnline = useNetworkStatus();

  const {
    games,
    allGenres,
    loading,
    error,
    selectedGenre,
    setSelectedGenre,
    addToWishlist,
  } = useTrending(props);

  const { calculateAffinity, profile } = useRecommendation();
  const { games: wishlistGames } = useWishlist();
  const [upcomingGames, setUpcomingGames] = useState<RawgGame[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const apiKey = await trendingService.getApiKey();

        if (apiKey) {
          const upcoming = await trendingService.getUpcoming(apiKey);
          setUpcomingGames(upcoming);
        }
      } catch (e) {
        console.error('Erro ao buscar lançamentos:', e);
      }
    };
    fetchUpcoming();
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleWishlistClick = async (game: RawgGame) => {
    try {
      await addToWishlist(game);
      toast.success(`${game.name} adicionado!`, {
        description: 'O jogo já está na sua lista de desejos.',
      });
    } catch {
      toast.error('Erro ao adicionar à lista', {
        description: 'Verifique sua conexão e tente novamente.',
      });
    }
  };

  if (!isOnline) {
    return (
      <ErrorState
        type="offline"
        onAction={() => props.onChangeTab('libraries')}
      />
    );
  }

  if (error) {
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

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center space-y-4">
        <Loader2 className="text-primary h-10 w-10 animate-spin" />
        <p className="text-muted-foreground">
          Consultando tendências mundiais...
        </p>
      </div>
    );
  }

  // Lógica do Hero e Grid
  const heroGames = games.slice(0, 5);
  const currentHero = heroGames[heroIndex];
  const isHeroInWishlist = wishlistGames.some(
    w => w.id === currentHero?.id.toString()
  );
  const nextHero = () => setHeroIndex(prev => (prev + 1) % heroGames.length);
  const prevHero = () =>
    setHeroIndex(prev => (prev - 1 + heroGames.length) % heroGames.length);

  // Empty State
  if (!currentHero) {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center">
        <div className="bg-muted/20 mb-4 rounded-full p-4">
          <Gamepad2 className="h-12 w-12 opacity-50" />
        </div>
        <h3 className="text-lg font-medium">Nenhum jogo encontrado</h3>
        <p className="mt-2 max-w-xs text-center text-sm">
          Não conseguimos carregar as sugestões no momento. Verifique seus
          filtros ou tente recarregar.
        </p>
        <Button variant="outline" className="mt-6" onClick={handleRetry}>
          Recarregar
        </Button>
      </div>
    );
  }

  let gridGames = games.slice(5, 15);

  if (profile) {
    gridGames = [...gridGames].sort((a, b) => {
      const scoreA = calculateAffinity(a.genres);
      const scoreB = calculateAffinity(b.genres);

      return scoreB - scoreA;
    });
  }

  // Renderização Principal
  return (
    <div className="custom-scrollbar bg-background flex-1 overflow-y-auto pb-10">
      {/* Hero */}
      <Hero
        title={currentHero.name}
        backgroundUrl={currentHero.backgroundImage}
        coverUrl={currentHero.backgroundImage}
        genres={currentHero.genres.map(g => g.name)} // Normaliza gêneros
        rating={currentHero.rating}
        showNavigation={heroGames.length > 1}
        onNext={nextHero}
        onPrev={prevHero}
        // Badge específica de Trending
        badges={
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/20 px-3 py-1 text-sm font-medium text-orange-400">
            <Flame size={16} /> EM ALTA
          </div>
        }
        // Botões específicos de Trending
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
              Lista de Desejos
            </Button>

            <Button
              variant="outline"
              className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={() =>
                openExternalLink(`https://rawg.io/games/${currentHero.id}`)
              }
            >
              <ExternalLink size={18} /> Ver Detalhes
            </Button>
          </>
        }
      />

      {/* Barra de Filtros */}
      <div className="bg-background/80 border-border sticky top-0 z-20 border-b p-4 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-6">
          <div className="text-muted-foreground flex items-center gap-2">
            <Filter size={18} />
            <span className="text-sm font-medium">Filtrar:</span>
          </div>

          <select
            value={selectedGenre}
            onChange={e => setSelectedGenre(e.target.value)}
            className="bg-secondary text-secondary-foreground focus:ring-primary cursor-pointer rounded-md border-none px-3 py-1.5 text-sm focus:ring-1"
          >
            <option value="all">Todos os Gêneros</option>
            {allGenres.map(g => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <div className="text-muted-foreground ml-auto hidden text-sm sm:block">
            15 sugestões disponíveis
          </div>
        </div>
      </div>

      {/* Sugestões (Trending) */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center gap-2">
          <div className="rounded-lg bg-green-500/10 p-2 text-green-400">
            <TrendingUp size={20} />
          </div>
          <h2 className="text-2xl font-bold">Mais Sugestões</h2>
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {gridGames.map(game => {
            // Lógica de badge baseada no perfil
            const affinity = calculateAffinity(game.genres);
            const isRecommended = affinity > 100;
            const isInWishlist = wishlistGames.some(
              w => w.id === game.id.toString()
            );

            return (
              <StandardGameCard
                key={game.id}
                title={game.name}
                coverUrl={game.backgroundImage}
                rating={game.rating}
                subtitle={game.genres
                  .map(g => g.name)
                  .slice(0, 2)
                  .join(', ')}
                badge={isRecommended ? 'TOP PICK' : undefined}
                // Ações Personalizadas do Trending (Wishlist + Details)
                actions={
                  <>
                    {/* Botões Wishlist e Detalhes */}
                    <ActionButton
                      icon={Heart}
                      variant={isInWishlist ? 'glass-destructive' : 'glass'}
                      onClick={() => handleWishlistClick(game)}
                      tooltip="Lista de Desejos"
                    />
                    <ActionButton
                      icon={ExternalLink}
                      variant="secondary"
                      size={16}
                      onClick={() =>
                        openExternalLink(`https://rawg.io/games/${game.id}`)
                      }
                      tooltip="Ver Detalhes"
                    />
                  </>
                }
              />
            );
          })}
        </div>
      </div>

      {/* Lançamentos Aguardados */}
      {upcomingGames.length > 0 && (
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-6 flex items-center gap-2">
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <Clock size={20} />
            </div>
            <h2 className="text-2xl font-bold">Lançamentos Aguardados</h2>
          </div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
            {upcomingGames.map(game => {
              const affinity = calculateAffinity(game.genres);
              const isMatch = affinity > 50;
              const isInWishlist = wishlistGames.some(
                w => w.id === game.id.toString()
              );

              return (
                <StandardGameCard
                  key={game.id}
                  title={game.name}
                  coverUrl={game.backgroundImage}
                  subtitle={
                    game.released
                      ? `Lança: ${new Date(game.released).toLocaleDateString()}`
                      : 'Em breve'
                  }
                  badge={isMatch ? 'PARA VOCÊ' : undefined}
                  actions={
                    <>
                      {/* Botões Wishlist e Detalhes */}
                      <ActionButton
                        icon={Heart}
                        variant={isInWishlist ? 'glass-destructive' : 'glass'}
                        onClick={() => handleWishlistClick(game)}
                        tooltip="Lista de Desejos"
                      />
                      <ActionButton
                        icon={ExternalLink}
                        variant="secondary"
                        size={16}
                        onClick={() =>
                          openExternalLink(`https://rawg.io/games/${game.id}`)
                        }
                        tooltip="Ver Detalhes"
                      />
                    </>
                  }
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
