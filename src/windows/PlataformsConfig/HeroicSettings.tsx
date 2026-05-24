import {
  FolderOpen,
  Info,
  Loader2,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingsRow, StatusBadge } from '@/components/common';
import { useStoresConfig } from '@/hooks';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Separator } from '@/ui/separator';

interface HeroicSettingsProps {
  onLibraryUpdate?: () => void;
}

export function HeroicSettings({
  onLibraryUpdate,
}: Readonly<HeroicSettingsProps>) {
  const { t } = useTranslation('plataforms');
  const { loading, status, progress, actions } =
    useStoresConfig(onLibraryUpdate);

  const [configPath, setConfigPath] = useState('');

  const handleChooseDir = async () => {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const selected = await open({
      directory: true,
      multiple: false,
      title: t('heroic_select_config_dir_title'),
    });

    if (selected) setConfigPath(selected);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
      {/* Header com Status */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t('heroic_title')}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('heroic_description')}
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
          icon={FolderOpen}
          title={t('heroic_auto_detection_title')}
          description={t('heroic_auto_detection_description')}
        >
          <div className="bg-muted/30 space-y-2 rounded-md border p-3">
            <p className="text-muted-foreground text-xs font-medium">
              {t('heroic_checked_paths')}
            </p>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">
                <span className="text-primary/60 font-semibold">
                  {t('heroic_linux_native_label')}
                </span>
              </p>
              <code className="text-primary/80 block pl-2 text-xs">
                ~/.config/heroic
              </code>
              <p className="text-muted-foreground pt-1 text-xs">
                <span className="text-primary/60 font-semibold">
                  {t('heroic_linux_flatpak_label')}
                </span>
              </p>
              <code className="text-primary/80 block pl-2 text-xs">
                ~/.var/app/com.heroicgameslauncher.hgl/config/heroic
              </code>
              <p className="text-muted-foreground pt-1 text-xs">
                <span className="text-primary/60 font-semibold">
                  {t('heroic_windows_label')}
                </span>
              </p>
              <code className="text-primary/80 block pl-2 text-xs">
                %APPDATA%\heroic
              </code>
            </div>
          </div>
        </SettingsRow>

        {/* Diretório manual (opcional) */}
        <SettingsRow
          icon={Info}
          title={t('heroic_custom_dir_title')}
          description={t('heroic_custom_dir_description')}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={configPath}
                onChange={e => setConfigPath(e.target.value)}
                placeholder={t('heroic_custom_dir_placeholder')}
                className="bg-background/50 font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleChooseDir}
                className="shrink-0 text-xs"
              >
                <FolderOpen className="mr-1 h-3 w-3" />
                {t('heroic_browse')}
              </Button>
            </div>
            {configPath && (
              <code className="text-muted-foreground bg-secondary/40 truncate rounded-md border px-2 py-1.5 text-[10px]">
                {configPath}
              </code>
            )}
          </div>
        </SettingsRow>

        {/* Plataformas suportadas */}
        <div className="border-white-500/20 bg-muted/20 rounded-lg border p-4">
          <h4 className="mb-2 text-sm font-semibold">
            {t('heroic_supported_platforms_title')}
          </h4>
          <ul className="text-muted-foreground space-y-1 text-xs">
            <li>{t('heroic_supported_epic')}</li>
            <li>{t('heroic_supported_gog')}</li>
            <li>{t('heroic_supported_amazon')}</li>
            <li>{t('heroic_supported_sideloaded')}</li>
          </ul>
        </div>

        {/* Aviso de duplicatas */}
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/25 bg-amber-500/8 p-4">
          <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-400">
              {t('heroic_duplicate_warning_title')}
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {t('heroic_duplicate_warning_prefix')}{' '}
              <strong className="text-foreground/80">{t('heroic_and')}</strong>
              {t('heroic_duplicate_warning_connector')}
              {t('heroic_duplicate_warning_middle_a')}
              {t('heroic_duplicate_warning_middle_b')}{' '}
              <strong className="text-foreground/80">
                {t('heroic_twice')}
              </strong>
              {t('heroic_duplicate_warning_library')}
              {t('heroic_duplicate_warning_middle_c')}
              <code>"Heroic"</code> <strong>{t('heroic_and')}</strong>{' '}
              <code>"Epic Games"</code>){t('heroic_duplicate_warning_expected')}
              {t('heroic_duplicate_warning_suffix')}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      {loading.importingHeroic && progress && (
        <div className="text-muted-foreground animate-pulse rounded-lg bg-purple-500/10 p-3 text-center text-sm">
          {t('heroic_importing')}: {progress.game} ({progress.current}/
          {progress.total})
        </div>
      )}

      {/* Botão de Importação */}
      <div className="border-border/10 flex justify-end gap-3 border-t pt-8">
        <Button
          onClick={() => actions.importHeroicGames(configPath || undefined)}
          disabled={loading.importingHeroic}
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          {loading.importingHeroic ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          {loading.importingHeroic
            ? t('heroic_importing_short')
            : t('heroic_import_button')}
        </Button>
      </div>
    </div>
  );
}
