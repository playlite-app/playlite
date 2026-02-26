import { FolderOpen, Loader2, RefreshCw } from 'lucide-react';

import { SettingsRow, StatusBadge } from '@/components/common';
import { useStoresConfig } from '@/hooks';
import { Button } from '@/ui/button';
import { Separator } from '@/ui/separator';

interface UbisoftSettingsProps {
  onLibraryUpdate?: () => void;
}

export function UbisoftSettings({ onLibraryUpdate }: UbisoftSettingsProps) {
  const { ubisoftConfig, loading, status, progress, actions } =
    useStoresConfig(onLibraryUpdate);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
      {/* Header com Status */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Importação Ubisoft
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Importe jogos instalados e da biblioteca do Ubisoft Game Launcher.
          </p>
        </div>
        {status.type && (
          <StatusBadge type={status.type} message={status.message} />
        )}
      </div>
      <Separator className="mt-5" />

      <div className="space-y-4">
        {/* Seleção de Diretório */}
        <SettingsRow
          icon={FolderOpen}
          title="Diretório do Ubisoft Game Launcher"
          description="Local de instalação do Ubisoft Game Launcher. Se não definido, a detecção automática será usada."
        >
          <div className="flex items-center gap-2">
            <code className="text-muted-foreground bg-secondary/50 flex-1 rounded-md border p-2 text-[10px]">
              {ubisoftConfig.launcherRoot ||
                'Detecção automática (C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher)'}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={actions.chooseUbisoftDirectory}
              className="text-xs"
            >
              <FolderOpen className="mr-1 h-3 w-3" />
              Alterar
            </Button>
          </div>
        </SettingsRow>

        {/* Info sobre o que será importado */}
        <div className="border-white-500/20 bg-muted/20 rounded-lg border p-4">
          <h4 className="mb-2 text-sm font-semibold">O que será importado:</h4>
          <ul className="text-muted-foreground space-y-1 text-xs">
            <li>
              ✓ Jogos instalados (via arquivos <code>.install</code>)
            </li>
            <li>✓ Biblioteca completa (via cache de configuração)</li>
            <li>✓ Nome do jogo e identificador único</li>
            <li>✓ Diretório de instalação e executável principal</li>
          </ul>
          <p className="text-muted-foreground mt-4 text-xs">
            <strong>Nota:</strong> O Ubisoft Game Launcher deve estar instalado.
            Jogos da biblioteca que não estiverem instalados também serão
            importados como não instalados.
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      {loading.importingUbisoft && progress && (
        <div className="text-muted-foreground animate-pulse rounded-lg bg-blue-500/10 p-3 text-center text-sm">
          Importando: {progress.game} ({progress.current}/{progress.total})
        </div>
      )}

      {/* Botão de Importação */}
      <div className="border-border/10 flex justify-end gap-3 border-t pt-8">
        <Button
          onClick={actions.importUbisoftGames}
          disabled={loading.importingUbisoft}
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          {loading.importingUbisoft ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          {loading.importingUbisoft
            ? 'Importando...'
            : 'Importar Jogos Ubisoft'}
        </Button>
      </div>
    </div>
  );
}
