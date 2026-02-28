import { FolderOpen, Info, Loader2, RefreshCw } from 'lucide-react';

import { SettingsRow, StatusBadge } from '@/components/common';
import { useStoresConfig } from '@/hooks';
import { Button } from '@/ui/button';
import { Separator } from '@/ui/separator';

interface EpicGamesSettingsProps {
  onLibraryUpdate?: () => void;
}

export function EpicGamesSettings({
  onLibraryUpdate,
}: Readonly<EpicGamesSettingsProps>) {
  const { loading, status, progress, actions } =
    useStoresConfig(onLibraryUpdate);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
      {/* Header com Status */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Importação de Jogos Epic Games
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Importe jogos instalados via Epic Games Launcher (Windows e Linux
            via Wine).
          </p>
        </div>
        {status.type && (
          <StatusBadge type={status.type} message={status.message} />
        )}
      </div>
      <Separator className="mt-5" />

      <div className="space-y-4">
        {/* Info sobre Detecção Automática */}
        <SettingsRow
          icon={FolderOpen}
          title="Detecção Automática"
          description="O Playlite detecta automaticamente os manifestos do Epic Games Launcher."
        >
          <div className="bg-muted/30 space-y-2 rounded-md border p-3">
            <p className="text-muted-foreground text-xs font-medium">
              Caminhos verificados:
            </p>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">
                <span className="text-primary/60 font-semibold">Windows:</span>
              </p>
              <code className="text-primary/80 block pl-2 text-xs">
                C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests
              </code>
              <p className="text-muted-foreground pt-1 text-xs">
                <span className="text-primary/60 font-semibold">
                  Linux (Wine):
                </span>
              </p>
              <code className="text-primary/80 block pl-2 text-xs">
                {'<wine_prefix>'}/drive_c/ProgramData/Epic/.../Manifests
              </code>
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              O scanner lê os arquivos <code>.item</code> que contêm informações
              sobre os jogos instalados (nome, caminho, executável).
            </p>
          </div>
        </SettingsRow>

        {/* Nota Wine */}
        <SettingsRow
          icon={Info}
          title="Wine (Linux)"
          description="No Linux, configure o Wine prefix na aba Wine para detectar a instalação."
        >
          <div className="bg-muted/30 rounded-md border p-3">
            <p className="text-muted-foreground text-xs leading-relaxed">
              O diretório de manifestos é resolvido automaticamente a partir do{' '}
              <strong className="text-foreground/70">Wine prefix</strong>{' '}
              configurado na aba{' '}
              <strong className="text-foreground/70">Wine (Linux)</strong>.
              Nenhuma configuração adicional é necessária aqui.
            </p>
          </div>
        </SettingsRow>

        {/* Info sobre o que será importado */}
        <div className="border-white-500/20 bg-muted/20 rounded-lg border p-4">
          <h4 className="mb-2 text-sm font-semibold">O que será importado:</h4>
          <ul className="text-muted-foreground space-y-1 text-xs">
            <li>✓ Nome do jogo</li>
            <li>✓ Diretório de instalação</li>
            <li>✓ Executável de lançamento</li>
            <li>✓ Status de instalação</li>
          </ul>
          <p className="text-muted-foreground mt-4 text-xs">
            <strong>Nota:</strong> Certifique-se de que o Epic Games Launcher
            está instalado e você tem jogos instalados. Apenas jogos detectados
            nos manifestos serão importados.
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      {loading.importingEpic && progress && (
        <div className="text-muted-foreground animate-pulse rounded-lg bg-blue-500/10 p-3 text-center text-sm">
          Importando: {progress.game} ({progress.current}/{progress.total})
        </div>
      )}

      {/* Botão de Importação */}
      <div className="border-border/10 flex justify-end gap-3 border-t pt-8">
        <Button
          onClick={actions.importEpicGames}
          disabled={loading.importingEpic}
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          {loading.importingEpic ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          {loading.importingEpic ? 'Importando...' : 'Importar Jogos Epic'}
        </Button>
      </div>
    </div>
  );
}
