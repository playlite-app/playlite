import { FolderOpen, Info, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingsRow, StatusBadge } from '@/components/common';
import {
  ImportProgressPayload,
  useHeroicConfig,
  useNativePathPicker,
} from '@/hooks/plataforms';

import {
  DetectedPathsBox,
  ImportedItemsBox,
  ImportProgressIndicator,
  PathPickerField,
  PlatformActionButton,
  PlatformActionsFooter,
  PlatformHeader,
  WarningBox,
} from './components';
import { DETECTED_PATHS } from './constants';

interface HeroicSettingsProps {
  onLibraryUpdate?: () => void;
  progress: ImportProgressPayload | null;
}

export function HeroicSettings({
  onLibraryUpdate,
  progress,
}: Readonly<HeroicSettingsProps>) {
  const { t } = useTranslation('plataforms');
  const { loading, status, actions } = useHeroicConfig(onLibraryUpdate);

  const [configPath, setConfigPath] = useState('');
  const { pick } = useNativePathPicker({
    directory: true,
    title: t('heroic_select_config_dir_title'),
  });

  const handleChooseDir = async () => {
    const selected = await pick();

    if (selected) setConfigPath(selected);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
      <PlatformHeader
        title={t('heroic_title')}
        description={t('heroic_description')}
        rightSlot={
          status.type && (
            <StatusBadge type={status.type} message={status.message} />
          )
        }
      />

      <div className="space-y-4">
        {/* Detecção automática */}
        <SettingsRow
          icon={FolderOpen}
          title={t('heroic_auto_detection_title')}
          description={t('heroic_auto_detection_description')}
        >
          <DetectedPathsBox
            intro={t('heroic_checked_paths')}
            paths={[
              {
                label: t('heroic_linux_native_label'),
                path: DETECTED_PATHS.heroic.linuxNative,
              },
              {
                label: t('heroic_linux_flatpak_label'),
                path: DETECTED_PATHS.heroic.linuxFlatpak,
              },
              {
                label: t('heroic_windows_label'),
                path: DETECTED_PATHS.heroic.windows,
              },
            ]}
          />
        </SettingsRow>

        {/* Diretório manual (opcional) */}
        <SettingsRow
          icon={Info}
          title={t('heroic_custom_dir_title')}
          description={t('heroic_custom_dir_description')}
        >
          <PathPickerField
            value={configPath}
            onChange={setConfigPath}
            onBrowse={handleChooseDir}
            placeholder={t('heroic_custom_dir_placeholder')}
            browseLabel={t('heroic_browse')}
            ariaLabel={t('heroic_custom_dir_title')}
          />
        </SettingsRow>

        {/* Plataformas suportadas */}
        <ImportedItemsBox
          title={t('heroic_supported_platforms_title')}
          items={[
            t('heroic_supported_epic'),
            t('heroic_supported_gog'),
            t('heroic_supported_amazon'),
            t('heroic_supported_sideloaded'),
          ]}
        />

        {/* Aviso de duplicatas */}
        <WarningBox title={t('heroic_duplicate_warning_title')}>
          {t('heroic_duplicate_warning_prefix')}{' '}
          <strong className="text-foreground/80">{t('heroic_and')}</strong>
          {t('heroic_duplicate_warning_connector')}
          {t('heroic_duplicate_warning_middle_a')}
          {t('heroic_duplicate_warning_middle_b')}{' '}
          <strong className="text-foreground/80">{t('heroic_twice')}</strong>
          {t('heroic_duplicate_warning_library')}
          {t('heroic_duplicate_warning_middle_c')}
          <code>"Heroic"</code> <strong>{t('heroic_and')}</strong>{' '}
          <code>"Epic Games"</code>){t('heroic_duplicate_warning_expected')}
          {t('heroic_duplicate_warning_suffix')}
        </WarningBox>
      </div>

      {loading.importingHeroic && progress && (
        <ImportProgressIndicator
          label={t('heroic_importing')}
          progress={progress}
        />
      )}

      <PlatformActionsFooter>
        <PlatformActionButton
          onClick={() => actions.importHeroicGames(configPath || undefined)}
          isLoading={loading.importingHeroic}
          disabled={loading.importingHeroic}
          label={t('heroic_import_button')}
          loadingLabel={t('heroic_importing_short')}
          icon={RefreshCw}
        />
      </PlatformActionsFooter>
    </div>
  );
}
