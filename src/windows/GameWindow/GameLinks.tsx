import {
  BookOpen,
  ExternalLink,
  Globe,
  MessageSquare,
  ShoppingCart,
  Star,
} from 'lucide-react';

import { Button } from '@/components/ui/button.tsx';

interface GameLinksProps {
  links?: Record<string, string>;
}

const LINK_CONFIG: Record<string, { label: string; icon: any }> = {
  website: { label: 'Site Oficial', icon: Globe },
  steam: { label: 'Steam', icon: ShoppingCart },
  epic: { label: 'Epic Games', icon: ShoppingCart },
  gog: { label: 'GOG.com', icon: ShoppingCart },
  reddit: { label: 'Reddit', icon: MessageSquare },
  metacritic: { label: 'Metacritic', icon: Star },
  rawg: { label: 'RAWG', icon: BookOpen },
  pcgamingwiki: { label: 'Wiki', icon: BookOpen },
};

export function GameLinks({ links }: GameLinksProps) {
  // Verifica se o objeto existe e se tem chaves
  if (!links || Object.keys(links).length === 0) return null;

  // Filtra links vazios ANTES de renderizar
  const validLinks = Object.entries(links).filter(
    ([_, url]) => url && url.trim().length > 0
  );

  if (validLinks.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-muted-foreground text-sm font-bold tracking-widest uppercase">
        Links Externos
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {validLinks.map(([key, url]) => {
          const config = LINK_CONFIG[key.toLowerCase()] || {
            label: key,
            icon: ExternalLink,
          };
          const Icon = config.icon;

          return (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="h-9 w-full justify-start px-3 text-xs font-medium"
              asChild
            >
              <a href={url} target="_blank" rel="noreferrer">
                <Icon size={14} className="mr-2 opacity-70" />
                <span className="truncate capitalize">{config.label}</span>
              </a>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
