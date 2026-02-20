import { FolderOpen, Loader2, RefreshCw } from 'lucide-react';

import { SettingsRow, StatusBadge } from '@/components/common';
import { useStoresConfig } from '@/hooks';
import { Button } from '@/ui/button';
import { Separator } from '@/ui/separator';

interface HeroicSettingsProps {
  onLibraryUpdate?: () => void;
}

export function HeroicSettings({ onLibraryUpdate }: HeroicSettingsProps) {
  const { loading, status, progress, actions } =
    useStoresConfig(onLibraryUpdate);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
      {/* Header com Status */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Importação Heroic Games Launcher
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Importe jogos instalados via Heroic Games Launcher (Linux).
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
          description="O Playlite detecta automaticamente jogos instalados via Heroic Games Launcher."
        >
          <div className="bg-muted/30 rounded-md border p-3">
            <p className="text-muted-foreground text-xs">
              <strong>Localizações de Configuração:</strong>
              <br />
              <code className="text-primary/80 text-xs">
                ~/.config/heroic/installed.json
              </code>
              <br />
              <code className="text-primary/80 text-xs">
                ~/.var/app/com.heroicgameslauncher.hgl/config/heroic/installed.json
              </code>
              <br />
              <span className="text-muted-foreground mt-1 block text-xs">
                (Detecta automaticamente instalação nativa ou Flatpak)
              </span>
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              O Heroic é um launcher open-source que suporta{' '}
              <strong>Epic Games</strong>, <strong>GOG</strong>,{' '}
              <strong>Amazon Games</strong> e outras plataformas no Linux.
            </p>
          </div>
        </SettingsRow>

        {/* Info sobre Plataformas Suportadas */}
        <div className="border-white-500/20 bg-muted/20 rounded-lg border p-4">
          <h4 className="mb-2 text-sm font-semibold">
            Plataformas suportadas via Heroic:
          </h4>
          <ul className="text-muted-foreground space-y-1 text-xs">
            <li>✓ Epic Games Store</li>
            <li>✓ GOG Galaxy</li>
            <li>✓ Amazon Games</li>
            <li>✓ Sideloaded games (jogos manuais)</li>
          </ul>
          <p className="text-muted-foreground mt-2 text-xs">
            Todos os jogos serão importados com plataforma "Heroic" no Playlite.
          </p>
        </div>

        {/* Info sobre o que será importado */}
        <div className="border-white-500/20 bg-muted/20 rounded-lg border p-4">
          <h4 className="mb-2 text-sm font-semibold">O que será importado:</h4>
          <ul className="text-muted-foreground space-y-1 text-xs">
            <li>✓ Nome do jogo</li>
            <li>✓ Diretório de instalação</li>
            <li>✓ Executável de lançamento</li>
            <li>✓ App Name (ID do jogo)</li>
          </ul>
          <p className="text-muted-foreground mt-4 text-xs">
            <strong>Nota Linux:</strong> O Heroic Games Launcher deve estar
            instalado e configurado. Certifique-se de ter jogos instalados via
            Heroic antes de importar.
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      {loading.importingHeroic && progress && (
        <div className="text-muted-foreground animate-pulse rounded-lg bg-purple-500/10 p-3 text-center text-sm">
          Importando: {progress.game} ({progress.current}/{progress.total})
        </div>
      )}

      {/* Botão de Importação */}
      <div className="border-border/10 flex justify-end gap-3 border-t pt-8">
        <Button
          onClick={actions.importHeroicGames}
          disabled={loading.importingHeroic}
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          {loading.importingHeroic ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          {loading.importingHeroic ? 'Importando...' : 'Importar Jogos Heroic'}
        </Button>
      </div>

      {/* Notas de Rodapé */}
      <div className="space-y-2">
        <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="text-muted-foreground text-xs">
            <strong>Compatibilidade:</strong> Esta integração foi projetada para
            Linux. No Windows, use as integrações nativas (Epic, GOG) ao invés
            do Heroic.
          </p>
        </div>
      </div>
    </div>
  );
}
