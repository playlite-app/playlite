import { FolderOpen, Info, Loader2, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('plataforms');
  const { loading, status, progress, actions } =
    useStoresConfig(onLibraryUpdate);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
      {/* Header com Status */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t('epic_title')}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('epic_description')}
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
          title={t('epic_auto_detection_title')}
          description={t('epic_auto_detection_description')}
        >
          <div className="bg-muted/30 space-y-2 rounded-md border p-3">
            <p className="text-muted-foreground text-xs font-medium">
              {t('epic_checked_paths')}
            </p>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">
                <span className="text-primary/60 font-semibold">
                  {t('epic_windows_label')}
                </span>
              </p>
              <code className="text-primary/80 block pl-2 text-xs">
                C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests
              </code>
              <p className="text-muted-foreground pt-1 text-xs">
                <span className="text-primary/60 font-semibold">
                  {t('epic_linux_wine_label')}
                </span>
              </p>
              <code className="text-primary/80 block pl-2 text-xs">
                {'<wine_prefix>'}/drive_c/ProgramData/Epic/.../Manifests
              </code>
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              {t('epic_scanner_item_files')}
            </p>
          </div>
        </SettingsRow>

        {/* Nota Wine */}
        <SettingsRow
          icon={Info}
          title={t('epic_wine_title')}
          description={t('epic_wine_description')}
        >
          <div className="bg-muted/30 rounded-md border p-3">
            <p className="text-muted-foreground text-xs leading-relaxed">
              {t('epic_wine_note_prefix')}{' '}
              <strong className="text-foreground/70">
                {t('epic_wine_prefix_label')}
              </strong>{' '}
              {t('epic_wine_note_middle')}{' '}
              <strong className="text-foreground/70">
                {t('epic_wine_linux_label')}
              </strong>
              .{t('epic_wine_note_suffix')}
            </p>
          </div>
        </SettingsRow>

        {/* Info sobre o que será importado */}
        <div className="border-white-500/20 bg-muted/20 rounded-lg border p-4">
          <h4 className="mb-2 text-sm font-semibold">
            {t('epic_imported_title')}
          </h4>
          <ul className="text-muted-foreground space-y-1 text-xs">
            <li>{t('epic_import_item_name')}</li>
            <li>{t('epic_import_item_install_dir')}</li>
            <li>{t('epic_import_item_executable')}</li>
            <li>{t('epic_import_item_status')}</li>
          </ul>
          <p className="text-muted-foreground mt-4 text-xs">
            {t('epic_import_note')}
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      {loading.importingEpic && progress && (
        <div className="text-muted-foreground animate-pulse rounded-lg bg-blue-500/10 p-3 text-center text-sm">
          {t('epic_importing')}: {progress.game} ({progress.current}/
          {progress.total})
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
          {loading.importingEpic
            ? t('epic_importing_short')
            : t('epic_import_button')}
        </Button>
      </div>
    </div>
  );
}
