import { AlertCircle, CheckCircle2, Settings2, Wine } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Epic, Heroic, Legacy, Steam, Ubisoft } from '@/components/icons/logos';
import { WindowBase } from '@/components/wrappers/WindowBase';
import { cn } from '@/lib/utils';
import {
  EpicGamesSettings,
  HeroicSettings,
  LegacySettings,
  LocalScannerSettings,
  SteamSettings,
  UbisoftSettings,
  WineSettings,
} from '@/windows';

type SourceProvider =
  | 'steam'
  | 'epic'
  | 'heroic'
  | 'ubisoft'
  | 'legacy'
  | 'gog'
  | 'local'
  | 'wine';

export default function PlataformsConfig({
  isOpen,
  onClose,
  onLibraryUpdate,
}: Readonly<{
  isOpen: boolean;
  onClose: () => void;
  onLibraryUpdate?: () => void;
}>) {
  const { t } = useTranslation('plataforms');
  const [activeStore, setActiveStore] = useState<SourceProvider>('steam');

  const stores = [
    {
      id: 'steam',
      name: t('config_store_steam'),
      Icon: Steam,
      connected: true,
    },
    { id: 'epic', name: t('config_store_epic'), Icon: Epic, connected: true },
    {
      id: 'heroic',
      name: t('config_store_heroic'),
      Icon: Heroic,
      connected: true,
    },
    {
      id: 'ubisoft',
      name: t('config_store_ubisoft'),
      Icon: Ubisoft,
      connected: true,
    },
    {
      id: 'legacy',
      name: t('config_store_legacy'),
      Icon: Legacy,
      connected: true,
    },
    {
      id: 'gog',
      name: t('config_store_gog'),
      Icon: AlertCircle,
      connected: false,
    },
    {
      id: 'local',
      name: t('config_store_local'),
      Icon: Settings2,
      connected: true,
    },
    { id: 'wine', name: t('config_store_wine'), Icon: Wine, connected: true },
  ];

  return (
    <WindowBase isOpen={isOpen} onClose={onClose} maxWidth="7xl">
      <div className="flex h-full flex-row">
        {/* Sidebar */}
        <aside className="border-border/40 bg-secondary/10 w-64 border-r p-6">
          <h2 className="text-muted-foreground mb-6 text-xs font-bold tracking-widest uppercase">
            {t('config_sources_title')}
          </h2>
          <nav className="space-y-1">
            {stores.map(store => {
              const StoreIcon = store.Icon;
              const isActive = activeStore === store.id;

              return (
                <button
                  key={store.id}
                  onClick={() => setActiveStore(store.id as SourceProvider)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-secondary text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <StoreIcon
                      size={18}
                      className={isActive ? 'text-primary' : ''}
                    />
                    {store.name}
                  </div>
                  {store.connected && (
                    <CheckCircle2 size={14} className="text-emerald-500/80" />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Conteúdo com SettingsRow */}
        <main className="bg-background/95 custom-scrollbar flex-1 overflow-y-auto p-8">
          {activeStore === 'steam' && (
            <SteamSettings onLibraryUpdate={onLibraryUpdate} />
          )}
          {activeStore === 'epic' && (
            <EpicGamesSettings onLibraryUpdate={onLibraryUpdate} />
          )}
          {activeStore === 'heroic' && (
            <HeroicSettings onLibraryUpdate={onLibraryUpdate} />
          )}
          {activeStore === 'ubisoft' && (
            <UbisoftSettings onLibraryUpdate={onLibraryUpdate} />
          )}
          {activeStore === 'legacy' && (
            <LegacySettings onLibraryUpdate={onLibraryUpdate} />
          )}
          {activeStore === 'local' && <LocalScannerSettings />}
          {activeStore === 'wine' && <WineSettings />}
          {activeStore === 'gog' && (
            <div className="flex h-full flex-col items-center justify-center opacity-30">
              <AlertCircle size={48} className="mb-4" />
              <p className="text-lg font-medium">
                {t('config_integration_soon')}
              </p>
            </div>
          )}
        </main>
      </div>
    </WindowBase>
  );
}
