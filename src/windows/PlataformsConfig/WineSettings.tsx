import {
  CheckCircle2,
  FolderOpen,
  Info,
  Save,
  Terminal,
  Trash2,
  Wine,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SettingsRow } from '@/components/common';
import { useWineConfig } from '@/hooks';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Separator } from '@/ui/separator';

export function WineSettings() {
  const { t } = useTranslation('plataforms');
  const { winePrefix, setWinePrefix, saved, actions } = useWineConfig();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t('wine_title')}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('wine_description')}
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-500">
            <CheckCircle2 size={13} />
            {t('wine_saved')}
          </div>
        )}
      </div>
      <Separator className="mt-5" />

      {/* Aviso Linux */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/25 bg-amber-500/8 p-4">
        <Info size={16} className="mt-0.5 shrink-0 text-amber-400" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-400">
            {t('wine_linux_only_title')}
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {t('wine_linux_only_prefix')}{' '}
            <strong className="text-foreground/80">
              {t('wine_linux_label')}
            </strong>
            {t('wine_linux_only_suffix')}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Wine Prefix */}
        <SettingsRow
          icon={Terminal}
          title={t('wine_prefix_title')}
          description={t('wine_prefix_description')}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={winePrefix}
                onChange={e => setWinePrefix(e.target.value)}
                placeholder={t('wine_prefix_placeholder')}
                className="bg-background/50 font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={actions.chooseWinePrefix}
                className="shrink-0 text-xs"
              >
                <FolderOpen className="mr-1 h-3 w-3" />
                {t('wine_browse')}
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
          title={t('wine_how_used_title')}
          description={t('wine_how_used_description')}
        >
          <div className="bg-muted/30 space-y-2 rounded-md border p-3">
            <p className="text-muted-foreground text-xs">
              {t('wine_command_intro')}
            </p>
            <code className="bg-background/60 block rounded border px-2 py-1.5 text-[10px] leading-relaxed text-emerald-400">
              WINEPREFIX=
              <span className="text-blue-400">
                {winePrefix || '/home/user/.wine'}
              </span>{' '}
              wine &lt;{t('wine_executable_placeholder')}&gt;
            </code>
            <p className="text-muted-foreground mt-1 text-[10px]">
              {t('wine_default_prefix_note')} <code>~/.wine</code>.
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
            {t('wine_clear')}
          </Button>
        )}
        <Button
          onClick={actions.saveWinePrefix}
          className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          <Save size={14} />
          {t('wine_save_configuration')}
        </Button>
      </div>
    </div>
  );
}
