import { ExternalLink, FolderOpen, Globe, Info, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SettingsRow, StatusBadge } from '@/components/common';
import { useSteamConfig } from '@/hooks/plataforms';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';

import {
  ImportProgressIndicator,
  PlatformActionButton,
  PlatformActionsFooter,
  PlatformHeader,
} from './components';

interface SteamSettingsProps {
  onLibraryUpdate?: () => void;
}

export function SteamSettings({
  onLibraryUpdate,
}: Readonly<SteamSettingsProps>) {
  const { t } = useTranslation('plataforms');
  const { steamConfig, setSteamConfig, loading, status, progress, actions } =
    useSteamConfig(onLibraryUpdate);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
      <PlatformHeader
        title={t('steam_title')}
        description={t('steam_description')}
        rightSlot={
          status.type && (
            <StatusBadge type={status.type} message={status.message} />
          )
        }
      />

      <div className="space-y-4">
        {/* Credenciais da API */}
        <SettingsRow
          icon={Globe}
          title={t('steam_api_credentials_title')}
          description={t('steam_api_credentials_description')}
        >
          <div className="flex flex-col gap-3">
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

      {/* Ajuda — específico da Steam, mantido inline por ora */}
      <div className="space-y-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-blue-400" />
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-300">
            {t('steam_help_badge')}
          </Badge>
          <p className="text-sm font-semibold text-blue-300">
            {t('steam_help_title')}
          </p>
        </div>

        <p className="text-muted-foreground text-xs leading-relaxed">
          {t('steam_help_description')}
        </p>

        <div className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs">
          <span>{t('steam_no_api_key_question')}</span>
          <a
            href="https://steamcommunity.com/dev/apikey"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-0.5 text-blue-400 hover:underline"
          >
            {t('steam_get_api_key_button')}
            <ExternalLink size={10} />
          </a>
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs">
          <span>{t('steam_no_steamid_question')}</span>
          <a
            href="https://steamid.io/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-0.5 text-blue-400 hover:underline"
          >
            {t('steam_get_steamid_button')}
            <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {loading.importingSteam && progress && (
        <ImportProgressIndicator
          label={t('steam_importing')}
          progress={progress}
        />
      )}

      <PlatformActionsFooter>
        <PlatformActionButton
          variant="outline"
          onClick={actions.saveSteamKeys}
          isLoading={loading.saving}
          disabled={loading.saving || loading.importingSteam}
          label={t('steam_save_credentials')}
        />
        <PlatformActionButton
          onClick={actions.saveAndImport}
          isLoading={loading.importingSteam}
          disabled={loading.saving || loading.importingSteam}
          label={t('steam_save_and_import')}
          icon={RefreshCw}
        />
      </PlatformActionsFooter>
    </div>
  );
}
