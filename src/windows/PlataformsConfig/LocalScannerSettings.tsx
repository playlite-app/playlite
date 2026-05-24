import { FolderOpen, Scan } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SettingsRow } from '@/components/common';
import { useScanner } from '@/hooks';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/button';
import { Separator } from '@/ui/separator';
import { DiscoveriesList } from '@/windows';

export function LocalScannerSettings() {
  const { t } = useTranslation('plataforms');
  const {
    scanning,
    result,
    selectedFolder,
    handleSelectFolder,
    handleScan,
    handleAddAll,
  } = useScanner();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {t('scanner_title')}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {t('scanner_description')}
        </p>
      </div>
      <Separator className="mt-5" />

      <div className="space-y-6">
        {/* Área de Controles */}
        <SettingsRow
          icon={FolderOpen}
          title={t('scanner_directory_title')}
          description={t('scanner_directory_description')}
        >
          <div className="flex flex-col gap-3">
            {selectedFolder && (
              <div className="bg-muted/30 flex items-center gap-2 overflow-hidden rounded-md border p-2">
                <span className="text-muted-foreground shrink-0 text-[10px] font-bold uppercase">
                  {t('scanner_path_label')}:
                </span>
                <code className="text-primary/80 truncate text-xs">
                  {selectedFolder}
                </code>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSelectFolder}
                className="hover:border-primary/50 flex-1 border-dashed"
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                {selectedFolder
                  ? t('scanner_change_folder')
                  : t('scanner_select_folder')}
              </Button>
              <Button
                onClick={handleScan}
                disabled={!selectedFolder || scanning}
                className="flex-1"
              >
                <Scan
                  className={cn('mr-2 h-4 w-4', scanning && 'animate-spin')}
                />
                {scanning ? t('scanner_scanning') : t('scanner_start_scan')}
              </Button>
            </div>
          </div>
        </SettingsRow>

        {/* Área de Resultados */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div
              className={cn(
                'mb-6 flex items-center justify-between rounded-lg border p-4 text-sm',
                result.success
                  ? 'border-green-500/20 bg-green-500/5 text-green-400'
                  : 'border-red-500/20 bg-red-500/5 text-red-400'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    result.success ? 'bg-green-500' : 'bg-red-500'
                  )}
                />
                {result.message}
              </div>
              {result.success && result.discoveries.length > 0 && (
                <Button onClick={handleAddAll} disabled={scanning} size="sm">
                  {t('scanner_add_all')}
                </Button>
              )}
            </div>

            {result.success && result.discoveries.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {t('scanner_choose_executables')}
                  </h3>
                </div>
                <DiscoveriesList discoveries={result.discoveries} />
              </div>
            )}
          </div>
        )}

        {!result && (
          <div className="border-border/40 flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <Scan className="text-muted-foreground/30 mb-4 h-12 w-12" />
            <p className="text-muted-foreground text-sm">
              {t('scanner_empty_state')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
