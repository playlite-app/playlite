import { FolderOpen, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingsRow, StatusBadge } from '@/components/common';
import {
  ImportProgressPayload,
  useEaConfig,
  useNativePathPicker,
} from '@/hooks/plataforms';

import {
  ImportedItemsBox,
  ImportProgressIndicator,
  InfoNoteBox,
  PathPickerField,
  PlatformActionButton,
  PlatformActionsFooter,
  PlatformHeader,
} from './components';

interface EaSettingsProps {
  onLibraryUpdate?: () => void;
  progress: ImportProgressPayload | null;
}

export function EaSettings({
  onLibraryUpdate,
  progress,
}: Readonly<EaSettingsProps>) {
  const { t } = useTranslation('platforms');
  const [eaInstallDir, setEaInstallDir] = useState(
    localStorage.getItem('ea_install_dir') || ''
  );
  const { pick } = useNativePathPicker({
    directory: true,
    title: t('ea_select_install_dir_title'),
  });

  const handleChooseDir = async () => {
    const selected = await pick();

    if (selected) {
      setEaInstallDir(selected);
      localStorage.setItem('ea_install_dir', selected);
    }
  };

  const { loading, status, actions } = useEaConfig(onLibraryUpdate);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
      <PlatformHeader
        title={t('ea_title')}
        description={t('ea_description')}
        rightSlot={
          status.type && (
            <StatusBadge type={status.type} message={status.message} />
          )
        }
      />

      <div className="space-y-4">
        {/* Pasta de instalação dos jogos EA (obrigatória — sem OAuth/manifesto próprio) */}
        <SettingsRow
          icon={FolderOpen}
          title={t('ea_select_install_dir_title')}
          description={t('ea_install_dir_description')}
        >
          <PathPickerField
            value={eaInstallDir}
            onChange={setEaInstallDir}
            onBrowse={handleChooseDir}
            placeholder={t('ea_install_dir_placeholder')}
            browseLabel={t('ea_browse')}
            ariaLabel={t('ea_select_install_dir_title')}
            showPreview={false}
          />
        </SettingsRow>

        <InfoNoteBox>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {t('ea_info_note')}
          </p>
        </InfoNoteBox>

        <ImportedItemsBox
          title={t('ea_imported_title')}
          items={[t('ea_import_item_installed'), t('ea_import_item_owned')]}
          note={t('ea_import_note_details')}
        />
      </div>

      {loading.importingEa && progress && (
        <ImportProgressIndicator
          label={t('ea_importing')}
          progress={progress}
        />
      )}

      <PlatformActionsFooter>
        <PlatformActionButton
          onClick={actions.importEaGames}
          isLoading={loading.importingEa}
          disabled={loading.importingEa}
          label={t('ea_import_button')}
          loadingLabel={t('ea_importing_short')}
          icon={RefreshCw}
        />
      </PlatformActionsFooter>
    </div>
  );
}
