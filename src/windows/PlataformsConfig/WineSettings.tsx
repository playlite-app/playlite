import {
  CheckCircle2,
  FolderOpen,
  Info,
  Save,
  Terminal,
  Trash2,
  Wine,
} from 'lucide-react';

import { SettingsRow } from '@/components/common';
import { useWineConfig } from '@/hooks';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Separator } from '@/ui/separator';

export function WineSettings() {
  const { winePrefix, setWinePrefix, saved, actions } = useWineConfig();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Configuração do Wine
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure o Wine prefix para executar jogos Windows no Linux.
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-500">
            <CheckCircle2 size={13} />
            Salvo
          </div>
        )}
      </div>
      <Separator className="mt-5" />

      {/* Aviso Linux */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/25 bg-amber-500/8 p-4">
        <Info size={16} className="mt-0.5 shrink-0 text-amber-400" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-400">
            Exclusivo para Linux
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            O Wine é necessário apenas em sistemas{' '}
            <strong className="text-foreground/80">Linux</strong> para executar
            jogos projetados para Windows. No Windows nativo esta configuração
            não tem efeito. Todas as plataformas configuradas (Steam, Epic,
            Heroic, Ubisoft) utilizam o mesmo prefix definido aqui ao lançar
            jogos via Wine.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Wine Prefix */}
        <SettingsRow
          icon={Terminal}
          title="Wine Prefix"
          description="Diretório que contém o ambiente Windows emulado pelo Wine (WINEPREFIX)."
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={winePrefix}
                onChange={e => setWinePrefix(e.target.value)}
                placeholder="Ex: /home/user/.wine"
                className="bg-background/50 font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={actions.chooseWinePrefix}
                className="shrink-0 text-xs"
              >
                <FolderOpen className="mr-1 h-3 w-3" />
                Procurar
              </Button>
            </div>
            {winePrefix && (
              <code className="text-muted-foreground bg-secondary/40 truncate rounded-md border px-2 py-1.5 text-[10px]">
                {winePrefix}
              </code>
            )}
          </div>
        </SettingsRow>

        {/* Como funciona */}
        <SettingsRow
          icon={Wine}
          title="Como é utilizado"
          description="O prefix é passado como variável de ambiente ao iniciar jogos."
        >
          <div className="bg-muted/30 space-y-2 rounded-md border p-3">
            <p className="text-muted-foreground text-xs">
              Ao lançar um jogo Windows no Linux, o Playlite executa:
            </p>
            <code className="bg-background/60 block rounded border px-2 py-1.5 text-[10px] leading-relaxed text-emerald-400">
              WINEPREFIX=
              <span className="text-blue-400">
                {winePrefix || '/home/user/.wine'}
              </span>{' '}
              wine &lt;executável&gt;
            </code>
            <p className="text-muted-foreground mt-1 text-[10px]">
              Se não configurado, o Wine utiliza o prefix padrão{' '}
              <code>~/.wine</code>.
            </p>
          </div>
        </SettingsRow>
      </div>

      {/* Ações */}
      <div className="border-border/10 flex justify-end gap-3 border-t pt-8">
        {winePrefix && (
          <Button
            variant="outline"
            size="sm"
            onClick={actions.clearWinePrefix}
            className="gap-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-500"
          >
            <Trash2 size={13} />
            Limpar
          </Button>
        )}
        <Button
          onClick={actions.saveWinePrefix}
          className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          <Save size={14} />
          Salvar Configuração
        </Button>
      </div>
    </div>
  );
}
