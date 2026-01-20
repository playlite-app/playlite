import {
  ChartBar,
  Clock,
  Dna,
  ExternalLink,
  Gamepad2,
  Heart,
  ImageOff,
  Library,
  Loader2,
  Play,
  Sparkles,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { useState } from 'react';

import { ActionButton } from '@/components/ActionButton.tsx';
import Hero from '@/components/Hero';
import StandardGameCard from '@/components/StandardGameCard';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Game, RawgGame, UserPreferenceVector } from '@/types';

import Achievements from '../components/Achievements';
import { useHome } from '../hooks/useHome';
import { formatTime } from '../utils/formatTime';
import { launchGame } from '../utils/launcher';
import { openExternalLink } from '../utils/navigation';

interface HomeProps {
  onChangeTab: (tab: string) => void;
  games: Game[];
  trendingCache: RawgGame[];
  setTrendingCache: (games: RawgGame[]) => void;
  onGameClick: (game: Game) => void;
  profileCache: UserPreferenceVector | null;
  setProfileCache: (profile: UserPreferenceVector) => void;
}

export default function Home({
  games,
  trendingCache,
  setTrendingCache,
  profileCache,
  setProfileCache,
  onGameClick,
  onChangeTab,
}: HomeProps) {
  const {
    stats,
    continuePlaying,
    backlogRecommendations,
    mostPlayed,
    topGenres,
    loading,
    trending,
    loadingRecommendations,
  } = useHome({
    games,
    trendingCache,
    setTrendingCache,
    profileCache,
    setProfileCache,
  });

  const [heroIndex, setHeroIndex] = useState(0);

  if (loading) {
    return (
      <div className="animate-in fade-in flex h-full flex-1 flex-col items-center justify-center gap-4 duration-700">
        <div className="relative flex items-center justify-center">
          {/* Glow Effect no fundo */}
          <div className="bg-primary/20 absolute inset-0 h-12 w-12 rounded-full blur-xl" />
          <Loader2 className="text-primary relative z-10 h-10 w-10 animate-spin" />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-foreground text-lg font-semibold tracking-tight">
            Playlite
          </p>
          <p className="text-muted-foreground animate-pulse text-sm">
            Carregando sua Central...
          </p>
        </div>
      </div>
    );
  }

  // Lógica do Hero
  const heroSlides = [
    backlogRecommendations[0],
    ...(trending || []).slice(0, 2),
    mostPlayed[0],
  ].filter(Boolean);

  const currentHero = heroSlides[heroIndex] || mostPlayed[0];
  const nextHero = () => setHeroIndex(prev => (prev + 1) % heroSlides.length);
  const prevHero = () =>
    setHeroIndex(prev => (prev - 1 + heroSlides.length) % heroSlides.length);

  // Helper para normalizar gêneros (Home mistura tipos Game e RawgGame)
  const getGenresList = (game: Game | RawgGame): string[] => {
    if (game.genres && Array.isArray(game.genres)) {
      return game.genres.map((g: { name: string }) => g.name); // RAWG
    }

    if ('genres' in game && typeof game.genres === 'string') {
      return game.genres.split(',').map((g: string) => g.trim()); // Local
    }

    return [];
  };

  // Helper para imagens e nomes
  const getHeroImage = (game: Game | RawgGame) =>
    ('coverUrl' in game ? game.coverUrl : null) ||
    ('backgroundImage' in game ? game.backgroundImage : null) ||
    '';

  // Verifica se é um jogo local (possui playtime)
  const isLocalGame = (game: Game | RawgGame): game is Game =>
    'playtime' in game;

  return (
    <div className="custom-scrollbar bg-background flex-1 overflow-y-auto pb-10">
      {/* Hero Section */}
      {currentHero && (
        <Hero
          title={currentHero.name}
          backgroundUrl={getHeroImage(currentHero)}
          coverUrl={getHeroImage(currentHero)}
          genres={getGenresList(currentHero)}
          rating={
            isLocalGame(currentHero)
              ? (currentHero as Game).userRating
              : undefined
          }
          showNavigation={heroSlides.length > 1}
          onNext={nextHero}
          onPrev={prevHero}
          // Badge Dinâmica da Home
          badges={
            <div className="bg-primary/20 text-primary-foreground border-primary/30 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium">
              {backlogRecommendations.some(g => g.id === currentHero.id) && (
                <>
                  <Sparkles size={14} /> SUGESTÃO
                </>
              )}
              {trending?.some(g => g.id === currentHero.id) && (
                <>
                  <TrendingUp size={14} /> TENDÊNCIA GLOBAL
                </>
              )}
              {mostPlayed.some(g => g.id === currentHero.id) && (
                <>
                  <Trophy size={14} /> SEU CAMPEÃO
                </>
              )}
            </div>
          }
          // Ação Dinâmica (Local vs Remoto)
          actions={
            isLocalGame(currentHero) ? (
              <Button onClick={() => launchGame(currentHero)}>
                <Play size={18} />
                <p className="font-bold">Jogar Agora</p>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10"
                onClick={() =>
                  openExternalLink(`https://rawg.io/games/${currentHero.id}`)
                }
              >
                <ExternalLink size={18} /> Ver Detalhes
              </Button>
            )
          }
        />
      )}
      <Separator className={'mb-3'} />
      {/* Conteúdo Principal da Home */}
      <div className="relative z-20 mx-auto max-w-7xl space-y-10 p-8">
        {/* Stats Cards e Conquistas */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Library size={24} />}
            label="Total de Jogos"
            value={stats.totalGames}
            color="text-blue-500"
            bg="bg-blue-500/10"
          />
          <StatCard
            icon={<Clock size={24} />}
            label="Tempo Jogado"
            value={formatTime(stats.totalPlaytime)}
            color="text-purple-500"
            bg="bg-purple-500/10"
          />
          <StatCard
            icon={<Heart size={24} />}
            label="Favoritos"
            value={stats.totalFavorites}
            color="text-pink-500"
            bg="bg-pink-500/10"
          />
          <StatCard
            icon={<Trophy size={24} />}
            label="Gênero Favorito"
            value={topGenres[0]?.[0] || '-'}
            color="text-yellow-500"
            bg="bg-yellow-500/10"
          />
        </div>
        <Achievements />

        {/* Continue Jogando */}
        {continuePlaying.length > 0 && (
          <section>
            <div className="mb-6 flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                  <Clock size={24} />
                </div>
                <h2 className="text-2xl font-bold">Continue Jogando</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {continuePlaying.map(game => (
                <StandardGameCard
                  key={game.id}
                  title={game.name}
                  coverUrl={game.coverUrl}
                  subtitle={`${formatTime(game.playtime)} jogadas`}
                  onClick={() => onGameClick(game)}
                  // Ação de Play no Hover
                  actions={
                    <ActionButton
                      icon={Play}
                      variant="secondary"
                      onClick={() => launchGame(game)}
                      tooltip="Jogar Agora"
                    />
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Recomendações */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
                  <Dna size={24} />
                </div>
                <h2 className="text-2xl font-bold">Recomendados</h2>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChangeTab('libraries')}
            >
              Ver Tudo
            </Button>
          </div>

          {/* Lógica de Loading adicionada */}
          {loadingRecommendations ? (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/10">
              <Loader2 className="text-muted-foreground animate-spin" />
            </div>
          ) : backlogRecommendations.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {backlogRecommendations.slice(0, 5).map(game => (
                <StandardGameCard
                  key={game.id}
                  title={game.name}
                  coverUrl={game.coverUrl}
                  subtitle={game.genres?.split(',')[0]}
                  badge="Recomendado"
                  onClick={() => onGameClick(game)}
                  actions={
                    <ActionButton
                      icon={Play}
                      variant="secondary"
                      onClick={() => launchGame(game)}
                      tooltip="Jogar Agora"
                    />
                  }
                />
              ))}
            </div>
          ) : (
            <div className="border-border text-muted-foreground rounded-xl border border-dashed p-8 text-center">
              <p>
                Tudo em dia! Nenhum jogo parado encontrado para o seu perfil.
              </p>
            </div>
          )}
        </section>

        {/* Grid Inferior (Mais Jogados + Gêneros) - Estatísticas */}
        <div className="mb-6 flex items-center gap-2">
          <div className="rounded-lg bg-yellow-500/10 p-2 text-yellow-400">
            <ChartBar size={24} />
          </div>
          <h2 className="text-2xl font-bold">Estatísticas</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-8">
          {/* Mais Jogados */}
          <div className="bg-card border-border rounded-xl border p-6 lg:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp size={20} className="text-primary" />
              <h2 className="text-lg font-semibold">Mais Jogados</h2>
            </div>
            <Separator className={'mb-3'} />
            <div className="grid grid-cols-1 gap-4">
              {mostPlayed.map((game, index) => (
                <div
                  key={game.id}
                  className="hover:bg-muted/50 group flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors"
                  onClick={() => launchGame(game)}
                >
                  <div className="text-muted-foreground w-6 text-center font-bold">
                    {index + 1}
                  </div>
                  {game.coverUrl ? (
                    <img
                      src={game.coverUrl}
                      alt=""
                      className="bg-muted h-16 w-12 rounded object-cover"
                    />
                  ) : (
                    <div className="bg-muted flex h-16 w-12 items-center justify-center rounded text-[10px]">
                      <ImageOff />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="group-hover:text-primary truncate text-sm font-medium transition-colors">
                      {game.name}
                    </h4>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-muted-foreground max-w-25 truncate text-xs">
                        {game.genres?.split(',')[0]}
                      </span>
                      <span className="bg-secondary rounded px-1.5 py-0.5 font-mono text-xs">
                        {formatTime(game.playtime)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Gêneros + Jogados */}
          <div className="bg-card border-border col-span-1 h-full rounded-xl border p-6">
            <div className="mb-3 flex items-center gap-2">
              <Gamepad2 size={20} className="text-primary" />
              <h2 className="text-lg font-semibold">Gêneros + Jogados</h2>
            </div>
            <Separator className={'mb-3'} />
            <div className="space-y-4">
              {topGenres.map(([genre, count]) => {
                const percent = Math.round((count / stats.totalGames) * 100);

                return (
                  <div key={genre}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium">{genre}</span>
                      <span className="text-muted-foreground">
                        {count} jogos
                      </span>
                    </div>
                    <div className="bg-secondary h-2 overflow-hidden rounded-full">
                      <div
                        className="bg-primary/80 h-full transition-all duration-1000 ease-out"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponente StatCard
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}

function StatCard({ icon, label, value, color, bg }: StatCardProps) {
  return (
    <div className="bg-card border-border hover:border-primary/50 flex items-center gap-4 rounded-xl border p-5 transition-colors">
      <div className={`rounded-lg p-3 ${bg} ${color}`}>{icon}</div>
      <div>
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
