import { FolderOpen, Info, Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('plataforms');
  const { loading, status, progress, actions } =
    useStoresConfig(onLibraryUpdate);

  const [appStatePath, setAppStatePath] = useState('');

  const handleChooseFile = async () => {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const selected = await open({
      multiple: false,
      title: t('legacy_select_app_state_title'),
      filters: [{ name: t('legacy_json_filter_name'), extensions: ['json'] }],
    });

    if (selected) setAppStatePath(selected);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
      {/* Header com Status */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t('legacy_title')}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('legacy_description')}
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
          title={t('legacy_auto_detection_title')}
          description={t('legacy_auto_detection_description')}
        >
          <div className="bg-muted/30 space-y-2 rounded-md border p-3">
            <p className="text-muted-foreground text-xs leading-relaxed">
              {t('legacy_auto_detection_note_prefix')}{' '}
              <code className="text-primary/80">app-state.json</code>
              {t('legacy_auto_detection_note_suffix')}
            </p>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li>
                <strong className="text-foreground/70">
                  {t('legacy_windows_label')}
                </strong>{' '}
                <code>
                  %APPDATA%\Roaming\legacy-games-launcher\app-state.json
                </code>
              </li>
              <li>
                <strong className="text-foreground/70">
                  {t('legacy_linux_wine_label')}
                </strong>{' '}
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
          title={t('legacy_wine_title')}
          description={t('legacy_wine_description')}
        >
          <div className="bg-muted/30 rounded-md border p-3">
            <p className="text-muted-foreground text-xs leading-relaxed">
              {t('legacy_wine_note_prefix')}{' '}
              <strong className="text-foreground/70">
                {t('legacy_wine_linux_label')}
              </strong>
              {t('legacy_wine_note_suffix')}
            </p>
          </div>
        </SettingsRow>

        {/* Caminho manual (opcional) */}
        <SettingsRow
          icon={FolderOpen}
          title={t('legacy_manual_path_title')}
          description={t('legacy_manual_path_description')}
        >
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={appStatePath}
              onChange={e => setAppStatePath(e.target.value)}
              placeholder={t('legacy_manual_path_placeholder')}
              className="bg-background/50 font-mono text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleChooseFile}
              className="shrink-0 text-xs"
            >
              <FolderOpen className="mr-1 h-3 w-3" />
              {t('legacy_browse')}
            </Button>
          </div>
        </SettingsRow>

        {/* O que será importado */}
        <div className="border-white-500/20 bg-muted/20 rounded-lg border p-4">
          <h4 className="mb-2 text-sm font-semibold">
            {t('legacy_imported_title')}
          </h4>
          <ul className="text-muted-foreground space-y-1 text-xs">
            <li>{t('legacy_import_item_acquired')}</li>
            <li>{t('legacy_import_item_metadata')}</li>
            <li>{t('legacy_import_item_install')}</li>
            <li>{t('legacy_import_item_status')}</li>
          </ul>
          <p className="text-muted-foreground mt-4 text-xs">
            {t('legacy_import_note')}
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      {loading.importingLegacy && progress && (
        <div className="text-muted-foreground animate-pulse rounded-lg bg-blue-500/10 p-3 text-center text-sm">
          {t('legacy_importing')}: {progress.game} ({progress.current}/
          {progress.total})
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
          {loading.importingLegacy
            ? t('legacy_importing_short')
            : t('legacy_import_button')}
        </Button>
      </div>
    </div>
  );
}
