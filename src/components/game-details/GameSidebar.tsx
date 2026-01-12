import {
  Building2,
  Calendar,
  Clock,
  Gamepad2,
  Globe,
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
import { formatTime } from '@/utils/formatTime.ts';

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
    <div className="space-y-5 p-5 lg:space-y-6 lg:p-6 xl:p-8">
      <div className="space-y-3">
        {/* Seção 1: Dados do Usuário */}
        <h3 className="text-muted-foreground flex items-center gap-2 text-sm font-bold tracking-wider uppercase lg:text-base">
          <Trophy size={16} className="text-primary" /> Seus Dados
        </h3>

        {/* Card Responsivo */}
        <div className="hidden grid-cols-2 gap-3 xl:grid">
          <div className="bg-card rounded-lg border p-3 shadow-sm">
            <span className="text-muted-foreground mb-1 block text-xs">
              Tempo Jogado
            </span>
            <div className="flex items-center gap-1.5 font-mono text-lg font-semibold">
              <Clock size={16} className="text-muted-foreground" />
              {formatTime(game.playtime)}
            </div>
          </div>
          <div className="bg-card rounded-lg border p-3 shadow-sm">
            <span className="text-muted-foreground mb-1 block text-xs">
              Status
            </span>
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <TrendingUp size={16} className="text-muted-foreground" />
              {game.playtime === 0 ? 'Nunca Jogado' : 'Em Progresso'}
            </div>
          </div>
        </div>

        {/* Versão Mobile/Pequena */}
        <div className="space-y-2 xl:hidden">
          <div className="border-border/50 flex justify-between border-b py-2">
            <span className="text-muted-foreground flex items-center gap-2 text-sm">
              <Clock size={16} /> Tempo Jogado
            </span>
            <span className="font-mono text-sm font-semibold">
              {game.playtime}h
            </span>
          </div>
          <div className="border-border/50 flex justify-between border-b py-2">
            <span className="text-muted-foreground flex items-center gap-2 text-sm">
              <TrendingUp size={16} /> Status
            </span>
            <span className="flex items-center gap-1 text-sm font-medium">
              {game.playtime === 0 ? 'Nunca Jogado' : 'Em Progresso'}
            </span>
          </div>
        </div>
      </div>

      {/* Seção 2: Detalhes Técnicos */}
      <div className="space-y-2 lg:space-y-3">
        <h3 className="text-muted-foreground flex items-center gap-2 text-sm font-bold tracking-wider uppercase lg:text-base">
          <ListCheck size={16} /> Detalhes
        </h3>
        <div className="space-y-2">
          {/* Gênero */}
          <div className="border-border/50 flex justify-between border-b py-2">
            <span className="text-muted-foreground flex items-center gap-2 text-sm">
              <Gamepad2 size={16} /> Gênero
            </span>
            <span className="max-w-[50%] truncate text-sm font-medium">
              {game.genres || 'N/A'}
            </span>
          </div>

          {/* Lançamento */}
          {details?.releaseDate && (
            <div className="border-border/50 flex justify-between border-b py-2">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <Calendar size={16} /> Lançamento
              </span>
              <span className="text-sm font-medium">
                {new Date(details.releaseDate).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}

          {/* Scores (Metascore e User) */}
          {details?.criticScore && (
            <div className="border-border/50 flex items-center justify-between border-b py-2">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <Star size={16} /> Metascore
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'border-2 text-sm font-bold',
                  details.criticScore >= 75
                    ? 'border-green-500/50 text-green-500'
                    : details.criticScore >= 50
                      ? 'border-yellow-500/50 text-yellow-500'
                      : 'border-red-500/50 text-red-500'
                )}
              >
                {details.criticScore}
              </Badge>
            </div>
          )}

          {/* Desenvolvedora e Série - Mesma lógica anterior */}
          {details?.developer && (
            <div className="border-border/50 flex justify-between border-b py-2">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <Building2 size={16} /> Dev
              </span>
              <span className="max-w-[50%] truncate text-right text-sm font-medium">
                {details.developer}
              </span>
            </div>
          )}
          {details?.series && (
            <div className="border-border/50 flex justify-between border-b py-2">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <Gamepad2 size={16} /> Série
              </span>
              <span className="max-w-[50%] truncate text-right text-sm font-medium">
                {details.series}
              </span>
            </div>
          )}
          {details?.ageRating && (
            <div className="border-border/50 flex justify-between border-b py-2">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <Trophy size={16} /> Classificação
              </span>
              <Badge variant="outline" className="text-xs font-medium">
                {details.ageRating}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Seção 3: Links */}
      {(() => {
        // Filtra apenas os links que existem
        const links = [
          { label: 'Site Oficial', url: details?.websiteUrl },
          { label: 'IGDB', url: details?.igdbUrl },
          { label: 'RAWG', url: details?.rawgUrl },
          { label: 'PCGamingWiki', url: details?.pcgamingwikiUrl },
        ].filter(link => link.url);

        // Se não houver nenhum link, não renderiza nada
        if (links.length === 0) return null;

        return (
          <div className="space-y-2 lg:space-y-3">
            <h3 className="text-muted-foreground flex items-center gap-2 text-sm font-bold tracking-wider uppercase lg:text-base">
              <Globe size={16} /> Links
            </h3>
            <div className="text-sm leading-relaxed font-medium">
              {links.map((link, index) => (
                <span key={link.label}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground/80 hover:text-primary transition-colors hover:underline"
                  >
                    {link.label}
                  </a>
                  {/* Adiciona o ponto separador se não for o último item */}
                  {index < links.length - 1 && (
                    <span className="text-muted-foreground mx-2">•</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Seção 4: Tags */}
      {details?.tags && (
        <div className="space-y-2 lg:space-y-3">
          <h3 className="text-muted-foreground flex items-center gap-2 text-sm font-bold tracking-wider uppercase lg:text-base">
            <Tag size={16} /> Tags
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {details.tags
              .split(',')
              .slice(0, 10)
              .map((tag, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="bg-secondary/50 hover:bg-secondary text-xs font-normal"
                >
                  {tag.trim()}
                </Badge>
              ))}
          </div>
        </div>
      )}

      {/* Seção 5: Siblings */}
      {siblings.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-muted-foreground text-sm">Outras Versões:</span>
          <div className="flex flex-wrap gap-1.5">
            {siblings.map(sib => (
              <Button
                key={sib.id}
                variant="outline"
                size="sm"
                onClick={() => onSwitchGame(sib.id)}
                className="h-8 text-xs"
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
