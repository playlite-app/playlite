import { FolderOpen, Info, Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { SettingsRow, StatusBadge } from '@/components/common';
import { useStoresConfig } from '@/hooks';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Separator } from '@/ui/separator';

interface LegacySettingsProps {
  onLibraryUpdate?: () => void;
}

export function LegacySettings({
  onLibraryUpdate,
}: Readonly<LegacySettingsProps>) {
  const { loading, status, progress, actions } =
    useStoresConfig(onLibraryUpdate);

  const [appStatePath, setAppStatePath] = useState('');

  const handleChooseFile = async () => {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const selected = await open({
      multiple: false,
      title: 'Selecione o arquivo app-state.json',
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });

    if (selected) setAppStatePath(selected);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
      {/* Header com Status */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Importação Legacy Games
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Importe jogos adquiridos via Legacy Games Launcher.
          </p>
        </div>
        {status.type && (
          <StatusBadge type={status.type} message={status.message} />
        )}
      </div>
      <Separator className="mt-5" />

      <div className="space-y-4">
        {/* Detecção automática */}
        <SettingsRow
          icon={Info}
          title="Detecção Automática"
          description="O scanner localiza o arquivo de estado do launcher automaticamente."
        >
          <div className="bg-muted/30 space-y-2 rounded-md border p-3">
            <p className="text-muted-foreground text-xs leading-relaxed">
              O Playlite lê o arquivo{' '}
              <code className="text-primary/80">app-state.json</code> do Legacy
              Games Launcher para detectar jogos adquiridos e instalados.
            </p>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li>
                <strong className="text-foreground/70">Windows:</strong>{' '}
                <code>
                  %APPDATA%\Roaming\legacy-games-launcher\app-state.json
                </code>
              </li>
              <li>
                <strong className="text-foreground/70">Linux (Wine):</strong>{' '}
                <code>
                  {'<wine_prefix>'}/drive_c/users/{'<USER>'}
                  /AppData/Roaming/legacy-games-launcher/
                </code>
              </li>
            </ul>
          </div>
        </SettingsRow>

        {/* Nota Wine Linux */}
        <SettingsRow
          icon={Info}
          title="Wine (Linux)"
          description="No Linux, configure o Wine prefix na aba Wine para detectar a instalação."
        >
          <div className="bg-muted/30 rounded-md border p-3">
            <p className="text-muted-foreground text-xs leading-relaxed">
              O Wine prefix configurado em{' '}
              <strong className="text-foreground/70">Wine (Linux)</strong> é
              usado automaticamente para localizar o launcher. Nenhuma
              configuração adicional é necessária aqui.
            </p>
          </div>
        </SettingsRow>

        {/* Caminho manual (opcional) */}
        <SettingsRow
          icon={FolderOpen}
          title="Caminho Manual (opcional)"
          description="Se a detecção automática falhar, aponte diretamente para o app-state.json."
        >
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={appStatePath}
              onChange={e => setAppStatePath(e.target.value)}
              placeholder="Ex: C:\Users\user\AppData\Roaming\legacy-games-launcher\app-state.json"
              className="bg-background/50 font-mono text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleChooseFile}
              className="shrink-0 text-xs"
            >
              <FolderOpen className="mr-1 h-3 w-3" />
              Procurar
            </Button>
          </div>
        </SettingsRow>

        {/* O que será importado */}
        <div className="border-white-500/20 bg-muted/20 rounded-lg border p-4">
          <h4 className="mb-2 text-sm font-semibold">O que será importado:</h4>
          <ul className="text-muted-foreground space-y-1 text-xs">
            <li>✓ Jogos adquiridos (compras e giveaways)</li>
            <li>✓ Nome, capa e descrição do jogo</li>
            <li>✓ Diretório de instalação e executável</li>
            <li>✓ Status de instalação</li>
          </ul>
          <p className="text-muted-foreground mt-4 text-xs">
            <strong>Nota:</strong> O Legacy Games Launcher deve estar instalado
            e você deve ter feito login ao menos uma vez para que o arquivo de
            estado exista.
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      {loading.importingLegacy && progress && (
        <div className="text-muted-foreground animate-pulse rounded-lg bg-blue-500/10 p-3 text-center text-sm">
          Importando: {progress.game} ({progress.current}/{progress.total})
        </div>
      )}

      {/* Botão de Importação */}
      <div className="border-border/10 flex justify-end gap-3 border-t pt-8">
        <Button
          onClick={() => actions.importLegacyGames(appStatePath || undefined)}
          disabled={loading.importingLegacy}
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          {loading.importingLegacy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          {loading.importingLegacy ? 'Importando...' : 'Importar Jogos Legacy'}
        </Button>
      </div>
    </div>
  );
}
