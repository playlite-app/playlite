import {
  Building2,
  Calendar,
  Clock,
  Gamepad2,
  ListCheck,
  Star,
  Tag,
  TrendingUp,
  Trophy,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Game, GameDetails, GamePlatformLink } from '@/types/game';
import { formatTime } from '@/utils/formatTime';

import { AgeRatingBadge } from './AgeRatingBadge';
import { GameLinks } from './GameLinks';
import { SteamReviewBadge } from './SteamReviewBadge';

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
  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* 1. SEÇÃO DO USUÁRIO */}
      <div className="space-y-4">
        <h3 className="text-muted-foreground flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
          <Trophy size={18} className="text-primary" /> Seus Dados
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-lg border p-4 shadow-sm">
            <span className="text-muted-foreground mb-1 block text-xs font-semibold uppercase">
              Tempo Jogado
            </span>
            <div className="flex items-center gap-2 font-mono text-xl font-bold">
              <Clock size={20} className="text-muted-foreground/70" />
              {formatTime(game.playtime)}
            </div>
          </div>
          <div className="bg-card rounded-lg border p-4 shadow-sm">
            <span className="text-muted-foreground mb-1 block text-xs font-semibold uppercase">
              Status
            </span>
            <div className="flex items-center gap-2 text-base font-medium">
              <TrendingUp size={20} className="text-muted-foreground/70" />
              {game.playtime === 0 ? 'Backlog' : 'Jogando'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEÇÃO DE REVIEWS */}
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

          {details?.criticScore && (
            <div className="flex items-center justify-between px-1 py-1">
              <span className="text-muted-foreground text-sm font-medium">
                Metascore
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'border-2 px-3 py-0.5 text-sm font-bold',
                  details.criticScore >= 75
                    ? 'border-green-500/30 text-green-400'
                    : details.criticScore >= 50
                      ? 'border-yellow-500/30 text-yellow-400'
                      : 'border-red-500/30 text-red-400'
                )}
              >
                {details.criticScore}
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* 3. DETALHES TÉCNICOS */}
      <div className="space-y-4">
        <h3 className="text-muted-foreground flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
          <ListCheck size={18} /> Detalhes
        </h3>

        <AgeRatingBadge esrb={details?.esrbRating} isAdult={details?.isAdult} />

        <div className="space-y-2">
          <DetailRow icon={Gamepad2} label="Gênero" value={game.genres} />

          {details?.releaseDate && (
            <DetailRow
              icon={Calendar}
              label="Lançamento"
              value={new Date(details.releaseDate).toLocaleDateString('pt-BR')}
            />
          )}

          <DetailRow icon={Building2} label="Dev" value={details?.developer} />
          <DetailRow icon={Gamepad2} label="Série" value={details?.series} />
        </div>
      </div>

      {/* 4. LINKS EXTERNOS (Filtragem está no componente GameLinks) */}
      <GameLinks links={details?.externalLinks} />

      {/* 5. TAGS */}
      {details?.tags && (
        <div className="space-y-3">
          <h3 className="text-muted-foreground flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
            <Tag size={18} /> Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {details.tags
              .split(',')
              .slice(0, 10)
              .map((tag, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="bg-secondary/40 hover:bg-secondary px-2 py-0.5 text-xs font-medium"
                >
                  {tag.trim()}
                </Badge>
              ))}
          </div>
        </div>
      )}

      {/* 6. OUTRAS PLATAFORMAS */}
      {siblings.length > 0 && (
        <div className="border-border/40 space-y-3 border-t pt-4">
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
                className="border-border/50 h-8 border text-xs"
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

// Helper com fontes maiores
function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value?: string;
}) {
  if (!value) return null;

  return (
    <div className="border-border/40 flex justify-between rounded border-b px-1 py-2.5 transition-colors last:border-0 hover:bg-white/5">
      <span className="text-muted-foreground flex items-center gap-2 text-sm">
        <Icon size={16} /> {label}
      </span>
      <span className="text-foreground/90 max-w-[60%] truncate text-right text-sm font-medium">
        {value}
      </span>
    </div>
  );
}
