import { Loader2, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { StatusBadge } from '@/components/common';
import { useStoresConfig } from '@/hooks';
import { Button } from '@/ui/button';
import { Separator } from '@/ui/separator';

interface UbisoftSettingsProps {
  onLibraryUpdate?: () => void;
}

export function UbisoftSettings({
  onLibraryUpdate,
}: Readonly<UbisoftSettingsProps>) {
  const { t } = useTranslation('plataforms');
  const { loading, status, progress, actions } =
    useStoresConfig(onLibraryUpdate);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
      {/* Header com Status */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t('ubisoft_title')}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('ubisoft_description')}
          </p>
        </div>
        {status.type && (
          <StatusBadge type={status.type} message={status.message} />
        )}
      </div>
      <Separator className="mt-5" />

      <div className="space-y-4">
        {/* Info sobre o que será importado */}
        <div className="border-white-500/20 bg-muted/20 rounded-lg border p-4">
          <h4 className="mb-2 text-sm font-semibold">
            {t('ubisoft_imported_title')}
          </h4>
          <ul className="text-muted-foreground space-y-1 text-xs">
            <li>{t('ubisoft_import_item_library')}</li>
            <li>{t('ubisoft_import_item_installed')}</li>
            <li>{t('ubisoft_import_item_name_id')}</li>
            <li>{t('ubisoft_import_item_install_exec')}</li>
          </ul>
          <p className="text-muted-foreground mt-4 text-xs">
            {t('ubisoft_import_note_prefix')}{' '}
            <code>%LOCALAPPDATA%\Ubisoft Game Launcher</code>
            {t('ubisoft_import_note_suffix')}
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      {loading.importingUbisoft && progress && (
        <div className="text-muted-foreground animate-pulse rounded-lg bg-blue-500/10 p-3 text-center text-sm">
          {t('ubisoft_importing')}: {progress.game} ({progress.current}/
          {progress.total})
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
            ? t('ubisoft_importing_short')
            : t('ubisoft_import_button')}
        </Button>
      </div>
    </div>
  );
}
