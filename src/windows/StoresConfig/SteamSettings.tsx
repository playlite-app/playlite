import { FolderOpen, Globe, Loader2, RefreshCw } from 'lucide-react';

import { SettingsRow, StatusBadge } from '@/components/common';
import { useStoresConfig } from '@/hooks';
import { Button } from '@/ui/button.tsx';
import { Input } from '@/ui/input.tsx';
import { Separator } from '@/ui/separator.tsx';

interface SteamSettingsProps {
  onLibraryUpdate?: () => void;
}

export function SteamSettings({ onLibraryUpdate }: SteamSettingsProps) {
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
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
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
