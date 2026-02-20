import {
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  Globe,
  LayoutGrid,
  RefreshCw,
  Settings2,
} from 'lucide-react';
import { useState } from 'react';

import { SettingsRow } from '@/components/common/SettingsRow'; // Reutilizando o componente
import { Steam } from '@/components/icons';
import { WindowBase } from '@/components/wrappers/WindowBase';
import { cn } from '@/lib/utils';

type StoreProvider = 'steam' | 'epic' | 'gog' | 'local';

export default function StoresConfig({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
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
            <SteamSettings />
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

function SteamSettings() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Configurações Steam
        </h1>
        <p className="text-muted-foreground text-sm">
          Gerencie como o Playlite interage com sua biblioteca Steam.
        </p>
      </div>

      <div className="space-y-4">
        {/* Reutilizando o SettingsRow para o ID e Chave */}
        <SettingsRow
          icon={Globe}
          title="Credenciais da API"
          description="Necessário para importar sua biblioteca completa e conquistas."
        >
          <div className="flex flex-col gap-2">
            <input
              type="text"
              className="bg-secondary/50 border-border/50 w-full rounded-lg border p-2 text-xs focus:outline-none"
              placeholder="Steam ID (765611...)"
            />
            <input
              type="password"
              className="bg-secondary/50 border-border/50 w-full rounded-lg border p-2 text-xs focus:outline-none"
              placeholder="API Key"
            />
          </div>
        </SettingsRow>

        <SettingsRow
          icon={FolderOpen}
          title="Diretório de Instalação"
          description="Local onde os arquivos .acf e executáveis estão localizados."
        >
          <div className="flex items-center gap-2">
            <code className="text-muted-foreground bg-secondary/50 flex-1 rounded-md border p-2 text-[10px]">
              C:\Program Files (x86)\Steam
            </code>
            <button className="bg-secondary hover:bg-secondary/80 rounded-md border px-3 py-2 text-xs transition-colors">
              Alterar
            </button>
          </div>
        </SettingsRow>

        <SettingsRow
          icon={RefreshCw}
          title="Sincronização Automática"
          description="Verificar novos jogos ao iniciar o aplicativo."
        >
          <input
            type="checkbox"
            className="accent-primary h-4 w-4"
            defaultChecked
          />
        </SettingsRow>
      </div>

      {/* Botões padronizados com o app */}
      <div className="border-border/10 flex justify-end gap-3 border-t pt-8">
        <button className="text-muted-foreground hover:bg-secondary rounded-lg px-5 py-2 text-sm font-medium transition-colors">
          Cancelar
        </button>
        <button className="bg-primary flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-95">
          <RefreshCw size={16} />
          Salvar e Importar
        </button>
      </div>
    </div>
  );
}
