import { FolderOpen, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingsRow, StatusBadge } from '@/components/common';
import { ImportProgressPayload, useGogConfig, useNativePathPicker, } from '@/hooks/plataforms';

import {
  ImportedItemsBox,
  ImportProgressIndicator,
  PathPickerField,
  PlatformActionButton,
  PlatformActionsFooter,
  PlatformHeader,
} from './components';

interface GogSettingsProps {
  onLibraryUpdate?: () => void;
  progress: ImportProgressPayload | null;
}

export function GogSettings({
  onLibraryUpdate,
  progress,
}: Readonly<GogSettingsProps>) {
  const { t } = useTranslation('plataforms');
  const [gogGamesDir, setGogGamesDir] = useState(
    localStorage.getItem('gog_games_dir') || ''
  );
  const { pick } = useNativePathPicker({
    directory: true,
    title: t('gog_select_games_dir_title'),
  });

  const handleChooseDir = async () => {
    const selected = await pick();

    if (selected) {
      setGogGamesDir(selected);
      localStorage.setItem('gog_games_dir', selected);
    }
  };

  const { isAuthenticated, loading, status, actions } =
    useGogConfig(onLibraryUpdate);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
      <PlatformHeader
        title={t('gog_title')}
        description={t('gog_description')}
        rightSlot={
          status.type && (
            <StatusBadge type={status.type} message={status.message} />
          )
        }
      />

      <div className="space-y-4">
        <SettingsRow
          icon={isAuthenticated ? LogOut : LogIn}
          title={
            isAuthenticated ? t('gog_connected_title') : t('gog_login_title')
          }
          description={
            isAuthenticated
              ? t('gog_connected_description')
              : t('gog_login_description')
          }
        >
          {!loading.checkingAuth && (
            <PlatformActionButton
              variant="outline"
              onClick={isAuthenticated ? actions.logout : actions.login}
              isLoading={loading.loggingIn}
              disabled={loading.loggingIn}
              label={
                isAuthenticated
                  ? t('gog_disconnect_button')
                  : t('gog_login_button')
              }
              loadingLabel={t('gog_logging_in')}
              icon={isAuthenticated ? LogOut : LogIn}
              className="ml-auto"
            />
          )}
        </SettingsRow>

        {/* Pasta de jogos instalados */}
        <SettingsRow
          icon={FolderOpen}
          title={t('gog_select_games_dir_title')}
          description={t('gog_games_dir_description')}
        >
          <PathPickerField
            value={gogGamesDir}
            onChange={setGogGamesDir}
            onBrowse={handleChooseDir}
            placeholder={t('gog_games_dir_placeholder')}
            browseLabel={t('gog_browse')}
            ariaLabel={t('gog_games_dir_title')}
            showPreview={false}
          />
        </SettingsRow>

        <ImportedItemsBox
          title={t('gog_imported_title')}
          items={[t('gog_import_item_owned')]}
          note={t('gog_import_note_details')}
        />
      </div>

      {loading.importingGog && progress && (
        <ImportProgressIndicator
          label={t('gog_importing')}
          progress={progress}
        />
      )}

      {isAuthenticated && (
        <PlatformActionsFooter>
          <PlatformActionButton
            onClick={actions.importGogGames}
            isLoading={loading.importingGog}
            disabled={loading.importingGog}
            label={t('gog_import_button')}
            loadingLabel={t('gog_importing_short')}
            icon={RefreshCw}
          />
        </PlatformActionsFooter>
      )}
    </div>
  );
}
