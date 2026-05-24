import { FolderOpen, Globe, Loader2, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SettingsRow, StatusBadge } from '@/components/common';
import { useStoresConfig } from '@/hooks';
import { Button } from '@/ui/button.tsx';
import { Input } from '@/ui/input.tsx';
import { Separator } from '@/ui/separator.tsx';

interface SteamSettingsProps {
  onLibraryUpdate?: () => void;
}

export function SteamSettings({
  onLibraryUpdate,
}: Readonly<SteamSettingsProps>) {
  const { t } = useTranslation('plataforms');
  const { steamConfig, setSteamConfig, loading, status, progress, actions } =
    useStoresConfig(onLibraryUpdate);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
      {/* Header com Status */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t('steam_title')}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('steam_description')}
          </p>
        </div>
        {status.type && (
          <StatusBadge type={status.type} message={status.message} />
        )}
      </div>
      <Separator className="mt-5" />

      <div className="space-y-4">
        {/* Credenciais da API */}
        <SettingsRow
          icon={Globe}
          title={t('steam_api_credentials_title')}
          description={t('steam_api_credentials_description')}
        >
          <div className="flex flex-col gap-2">
            <Input
              type="text"
              value={steamConfig.steamId}
              onChange={e =>
                setSteamConfig(prev => ({ ...prev, steamId: e.target.value }))
              }
              placeholder={t('steam_id_placeholder')}
              className="bg-background/50"
            />
            <Input
              type="password"
              value={steamConfig.steamApiKey}
              onChange={e =>
                setSteamConfig(prev => ({
                  ...prev,
                  steamApiKey: e.target.value,
                }))
              }
              placeholder={t('steam_api_key_placeholder')}
              className="bg-background/50"
            />
          </div>
        </SettingsRow>

        {/* Diretório de Instalação */}
        <SettingsRow
          icon={FolderOpen}
          title={t('steam_install_dir_title')}
          description={t('steam_install_dir_description')}
        >
          <div className="flex items-center gap-2">
            <code className="text-muted-foreground bg-secondary/50 flex-1 rounded-md border p-2 text-[10px]">
              {steamConfig.steamRoot || t('steam_no_directory_selected')}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={actions.chooseSteamDirectory}
              className="text-xs"
            >
              <FolderOpen className="mr-1 h-3 w-3" />
              {t('steam_change')}
            </Button>
          </div>
        </SettingsRow>
      </div>

      {/* Progress Indicator */}
      {loading.importingSteam && progress && (
        <div className="text-muted-foreground animate-pulse rounded-lg bg-blue-500/10 p-3 text-center text-sm">
          {t('steam_importing')}: {progress.game} ({progress.current}/
          {progress.total})
        </div>
      )}

      {/* Botões de Ação */}
      <div className="border-border/10 flex justify-end gap-3 border-t pt-8">
        <Button
          variant="outline"
          onClick={actions.saveSteamKeys}
          disabled={loading.saving || loading.importingSteam}
          className="flex items-center gap-2"
        >
          {loading.saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t('steam_save_credentials')
          )}
        </Button>
        <Button
          onClick={actions.saveAndImport}
          disabled={loading.saving || loading.importingSteam}
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          {loading.importingSteam ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          {t('steam_save_and_import')}
        </Button>
      </div>
    </div>
  );
}
