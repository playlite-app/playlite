import {
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  Globe,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Settings2,
} from 'lucide-react';
import { useState } from 'react';

import { SettingsRow, StatusBadge } from '@/components/common';
import { Steam } from '@/components/icons/logos';
import { WindowBase } from '@/components/wrappers/WindowBase';
import { useStoresConfig } from '@/hooks';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Separator } from '@/ui/separator';

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
          {activeStore === 'steam' ? (
            <SteamSettings onLibraryUpdate={onLibraryUpdate} />
          ) : (
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

function SteamSettings({ onLibraryUpdate }: { onLibraryUpdate?: () => void }) {
  const { steamConfig, setSteamConfig, loading, status, progress, actions } =
    useStoresConfig(onLibraryUpdate);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
      {/* Header com Status */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Credenciais e Importação
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Gerencie como o Playlite interage com sua biblioteca Steam.
          </p>
        </div>
        {status.type && (
          <StatusBadge type={status.type} message={status.message} />
        )}
      </div>
      <Separator className="mt-5" />

      <div className="space-y-4">
        {/* Credenciais da API */}
        <SettingsRow
          icon={Globe}
          title="Credenciais da API"
          description="Necessário para importar sua biblioteca completa e conquistas."
        >
          <div className="flex flex-col gap-2">
            <Input
              type="text"
              value={steamConfig.steamId}
              onChange={e =>
                setSteamConfig(prev => ({ ...prev, steamId: e.target.value }))
              }
              placeholder="Steam ID (765611...)"
              className="bg-background/50"
            />
            <Input
              type="password"
              value={steamConfig.steamApiKey}
              onChange={e =>
                setSteamConfig(prev => ({
                  ...prev,
                  steamApiKey: e.target.value,
                }))
              }
              placeholder="API Key da Steam"
              className="bg-background/50"
            />
          </div>
        </SettingsRow>

        {/* Diretório de Instalação */}
        <SettingsRow
          icon={FolderOpen}
          title="Diretório de Instalação"
          description="Local onde os arquivos .acf e executáveis estão localizados."
        >
          <div className="flex items-center gap-2">
            <code className="text-muted-foreground bg-secondary/50 flex-1 rounded-md border p-2 text-[10px]">
              {steamConfig.steamRoot || 'Nenhum diretório selecionado'}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={actions.chooseSteamDirectory}
              className="text-xs"
            >
              <FolderOpen className="mr-1 h-3 w-3" />
              Alterar
            </Button>
          </div>
        </SettingsRow>
      </div>

      {/* Progress Indicator */}
      {loading.importing && progress && (
        <div className="text-muted-foreground animate-pulse rounded-lg bg-blue-500/10 p-3 text-center text-sm">
          Importando: {progress.game} ({progress.current}/{progress.total})
        </div>
      )}

      {/* Botões de Ação */}
      <div className="border-border/10 flex justify-end gap-3 border-t pt-8">
        <Button
          variant="outline"
          onClick={actions.saveSteamKeys}
          disabled={loading.saving || loading.importing}
          className="flex items-center gap-2"
        >
          {loading.saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Salvar Credenciais'
          )}
        </Button>
        <Button
          onClick={actions.saveAndImport}
          disabled={loading.saving || loading.importing}
          className="bg-secondary flex items-center gap-2"
        >
          {loading.importing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          Salvar e Importar
        </Button>
      </div>
    </div>
  );
}
