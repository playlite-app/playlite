import {
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  Gamepad2,
  ListCheck,
  type LucideIcon,
  Star,
  Tag,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Game, GameDetails, GamePlatformLink, GameTag } from '@/types/game.ts';
import { formatTime } from '@/utils/formatTime.ts';
import { getPlaytimeCategory } from '@/utils/playtime.ts';

import { GameLinks } from './GameLinks.tsx';
import { SteamReviewBadge } from './SteamReviewBadge.tsx';

interface GameSidebarProps {
  game: Game;
  details: GameDetails | null;
  siblings: GamePlatformLink[];
  onSwitchGame: (id: string) => void;
}

export function GameSidebar({
  game,
  details,
  siblings,
  onSwitchGame,
}: GameSidebarProps) {
  // Lógica para renderizar as tags categorizadas
  const renderTags = () => {
    if (!details?.tags) return null;

    if (Array.isArray(details.tags)) {
      if (details.tags.length === 0) return null;

      // Agrupa por categoria
      const grouped = details.tags.reduce(
        (acc, tag) => {
          const cat = tag.category;

          if (!acc[cat]) acc[cat] = [];

          acc[cat].push(tag);

          return acc;
        },
        {} as Record<string, GameTag[]>
      );

      const order = ['mode', 'narrative', 'theme', 'gameplay', 'meta'];
      const labels: Record<string, string> = {
        mode: 'Modo',
        narrative: 'Narrativa',
        theme: 'Tema',
        gameplay: 'Gameplay',
        meta: 'Info',
      };

      return (
        <div className="space-y-3">
          {order.map(cat => {
            const tags = grouped[cat];

            if (!tags?.length) return null;

            return (
              <div key={cat} className="space-y-1.5">
                <span className="text-muted-foreground/70 pl-1 text-[10px] font-bold tracking-widest uppercase">
                  {labels[cat] || cat}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => (
                    <Badge
                      key={tag.slug}
                      variant="secondary"
                      className="bg-secondary/40 hover:bg-secondary hover:border-border/50 border border-transparent px-2 py-0.5 text-xs font-normal transition-all"
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  // Lógica para extrair APENAS os modos de jogo
  const gameModes =
    details?.tags && Array.isArray(details.tags)
      ? details.tags
          .filter(t => t.category === 'mode') // Filtra só categoria 'mode'
          .map(t => t.name) // Pega o nome (Singleplayer, Co-op...)
          .join(', ') // Junta com vírgula
      : null;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* AVISO DE CONTEÚDO ADULTO */}
      {(details?.isAdult || details?.adultTags) && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-red-400">
          <div className="mb-1 flex items-center gap-2 font-bold">
            <AlertTriangle size={16} /> Conteúdo +18
          </div>
          {details?.adultTags && (
            <p className="text-sm opacity-80">
              {details.adultTags.startsWith('[')
                ? JSON.parse(details.adultTags).join(', ')
                : details.adultTags}
            </p>
          )}
        </div>
      )}

      {/* 1. DADOS DO USUÁRIO */}
      <div className="space-y-4">
        <h3 className="text-muted-foreground flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
          <Trophy size={18} className="text-primary" /> Seus Dados
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Card 1: Tempo Real Jogado */}
          <div className="bg-card rounded-lg border px-4 py-2 shadow-sm">
            <span className="text-muted-foreground mb-1 block text-[11px] font-semibold uppercase">
              Jogado
            </span>
            <div className="flex items-center gap-2 font-mono text-base font-bold">
              <Clock size={18} className="text-muted-foreground/70" />
              {formatTime(game.playtime)}
            </div>
          </div>

          {/* Card 2: Status */}
          <div className="bg-card rounded-lg border px-4 py-2 shadow-sm">
            <span className="text-muted-foreground mb-1 block text-[11px] font-semibold uppercase">
              Status
            </span>
            <div className="flex items-center gap-2 text-base font-medium">
              <TrendingUp size={18} className="text-muted-foreground/70" />
              {game.playtime === 0 ? 'Backlog' : 'Jogando'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. REVIEWS */}
      {(details?.steamReviewLabel || details?.criticScore) && (
        <div className="space-y-4">
          <h3 className="text-muted-foreground flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
            <Star size={18} /> Avaliação
          </h3>

          <SteamReviewBadge
            label={details?.steamReviewLabel}
            count={details?.steamReviewCount}
            score={details?.steamReviewScore}
          />
        </div>
      )}

      {/* 3. DETALHES TÉCNICOS */}
      <div className="space-y-1.5">
        <h3 className="text-muted-foreground flex items-center gap-2 pb-2 text-sm font-bold tracking-wider uppercase">
          <ListCheck size={18} /> Detalhes
        </h3>

        <DetailRow
          icon={Building2}
          label="Dev e Pub"
          value={`${details?.developer}, ${details?.publisher}`}
        />

        {details?.releaseDate && (
          <DetailRow
            icon={Calendar}
            label="Lançamento"
            value={new Date(details.releaseDate).toLocaleDateString('pt-BR')}
          />
        )}

        <DetailRow icon={Gamepad2} label="Gênero" value={game.genres} />

        <DetailRow icon={TrendingUp} label="Série" value={details?.series} />

        <DetailRow
          icon={Star}
          label="Metacritic"
          value={
            details?.criticScore ? details.criticScore.toString() : undefined
          }
        />

        {details?.esrbRating && (
          <DetailRow
            icon={Trophy}
            label="Classificação"
            value={`ESRB ${details.esrbRating}`}
          />
        )}

        <DetailRow icon={Users} label="Modo" value={gameModes ?? undefined} />

        {details?.estimatedPlaytime && details.estimatedPlaytime > 0 && (
          <DetailRow
            icon={Clock}
            label="Duração"
            value={getPlaytimeCategory(details.estimatedPlaytime).label} // Ex: "Longo (30h - 80h)"
          />
        )}
      </div>

      {/* 4. LINKS */}
      <GameLinks links={details?.externalLinks} />

      {/* 5. TAGS (Com Categorização) */}
      {details?.tags && (
        <div className="space-y-3">
          <h3 className="text-muted-foreground flex items-center gap-1 text-sm font-bold tracking-wider uppercase">
            <Tag size={18} /> Características
          </h3>
          {renderTags()}
        </div>
      )}

      {/* 6. OUTRAS PLATAFORMAS */}
      {siblings.length > 0 && (
        <div className="border-border/40 space-y-2 border-t pt-4">
          <span className="text-muted-foreground text-sm font-medium">
            Outras Versões:
          </span>
          <div className="flex flex-wrap gap-2">
            {siblings.map(sib => (
              <Button
                key={sib.id}
                variant="ghost"
                size="sm"
                onClick={() => onSwitchGame(sib.id)}
                className="border-border/50 h-7 border text-xs"
              >
                {sib.platform}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// === DetailRow ====

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
}) {
  if (!value) return null;

  return (
    <div className="border-border/40 flex justify-between rounded border-b px-2 py-2 transition-colors hover:bg-white/5">
      <span className="text-muted-foreground flex items-center gap-2 text-sm">
        <Icon size={16} /> {label}
      </span>
      <span className="text-foreground/90 max-w-[60%] truncate text-right text-sm font-medium">
        {value}
      </span>
    </div>
  );
}
