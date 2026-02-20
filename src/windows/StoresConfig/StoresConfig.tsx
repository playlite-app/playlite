import {
  AlertCircle,
  CheckCircle2,
  Globe,
  LayoutGrid,
  Settings2,
} from 'lucide-react';
import { useState } from 'react';

import { Steam } from '@/components/icons/logos';
import { WindowBase } from '@/components/wrappers/WindowBase';
import { cn } from '@/lib/utils';
import { LocalScannerSettings, SteamSettings } from '@/windows';

type StoreProvider = 'steam' | 'epic' | 'gog' | 'local';

export default function StoresConfig({
  isOpen,
  onClose,
  onLibraryUpdate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLibraryUpdate?: () => void;
}) {
  const [activeStore, setActiveStore] = useState<StoreProvider>('steam');

  const stores = [
    { id: 'steam', name: 'Steam', Icon: Steam, connected: true },
    { id: 'epic', name: 'Epic Games', Icon: LayoutGrid, connected: false },
    { id: 'gog', name: 'GOG', Icon: Globe, connected: false },
    { id: 'local', name: 'Scanner Local', Icon: Settings2, connected: true },
  ];

  return (
    <WindowBase isOpen={isOpen} onClose={onClose} maxWidth="7xl">
      <div className="flex h-full flex-row">
        {/* Sidebar com visual "Cinza" similar à principal */}
        <aside className="border-border/40 bg-secondary/10 w-64 border-r p-6">
          <h2 className="text-muted-foreground mb-6 text-xs font-bold tracking-widest uppercase">
            Fontes de Jogos
          </h2>
          <nav className="space-y-1">
            {stores.map(store => {
              const StoreIcon = store.Icon;
              const isActive = activeStore === store.id;

              return (
                <button
                  key={store.id}
                  onClick={() => setActiveStore(store.id as StoreProvider)}
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
          {activeStore === 'local' && <LocalScannerSettings />}
          {(activeStore === 'epic' || activeStore === 'gog') && (
            <div className="flex h-full flex-col items-center justify-center opacity-30">
              <AlertCircle size={48} className="mb-4" />
              <p className="text-lg font-medium">Integração em breve</p>
            </div>
          )}
        </main>
      </div>
    </WindowBase>
  );
}
