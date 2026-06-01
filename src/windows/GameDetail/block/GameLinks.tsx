import {
  BookOpen,
  ExternalLink,
  Globe,
  type LucideIcon,
  MessageSquare,
  ShoppingCart,
  Star,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/ui/button.tsx';

interface GameLinksProps {
  links?: Record<string, string>;
}

const LINK_CONFIG: Record<string, { labelKey: string; icon: LucideIcon }> = {
  website: { labelKey: 'links_website', icon: Globe },
  steam: { labelKey: 'links_steam', icon: ShoppingCart },
  epic: { labelKey: 'links_epic', icon: ShoppingCart },
  gog: { labelKey: 'links_gog', icon: ShoppingCart },
  reddit: { labelKey: 'links_reddit', icon: MessageSquare },
  metacritic: { labelKey: 'links_metacritic', icon: Star },
  rawg: { labelKey: 'links_rawg', icon: BookOpen },
  pcgamingwiki: { labelKey: 'links_pcgamingwiki', icon: BookOpen },
};

export function GameLinks({ links }: Readonly<GameLinksProps>) {
  const { t } = useTranslation('game_detail');

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
        {t('links_heading')}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {validLinks.map(([key, url]) => {
          const config = LINK_CONFIG[key.toLowerCase()] || {
            labelKey: undefined,
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
                <span className="truncate capitalize">
                  {config.labelKey ? t(config.labelKey) : key}
                </span>
              </a>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
