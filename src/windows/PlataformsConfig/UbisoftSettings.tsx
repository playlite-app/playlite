import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { StatusBadge } from '@/components/common';
import { useUbisoftConfig } from '@/hooks/plataforms';

import {
  ImportedItemsBox,
  ImportProgressIndicator,
  PlatformActionButton,
  PlatformActionsFooter,
  PlatformHeader,
} from './components';

interface UbisoftSettingsProps {
  onLibraryUpdate?: () => void;
}

export function UbisoftSettings({
  onLibraryUpdate,
}: Readonly<UbisoftSettingsProps>) {
  const { t } = useTranslation('plataforms');
  const { loading, status, progress, actions } =
    useUbisoftConfig(onLibraryUpdate);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
      <PlatformHeader
        title={t('ubisoft_title')}
        description={t('ubisoft_description')}
        rightSlot={
          status.type && (
            <StatusBadge type={status.type} message={status.message} />
          )
        }
      />

      <div className="space-y-4">
        {/* Info sobre o que será importado */}
        <ImportedItemsBox
          title={t('ubisoft_imported_title')}
          items={[
            t('ubisoft_import_item_library'),
            t('ubisoft_import_item_installed'),
            t('ubisoft_import_item_name_id'),
            t('ubisoft_import_item_install_exec'),
          ]}
          note={
            <>
              {t('ubisoft_import_note_prefix')}{' '}
              <code>%LOCALAPPDATA%\Ubisoft Game Launcher</code>
              {t('ubisoft_import_note_suffix')}
            </>
          }
        />
      </div>

      {loading.importingUbisoft && progress && (
        <ImportProgressIndicator
          label={t('ubisoft_importing')}
          progress={progress}
        />
      )}

      <PlatformActionsFooter>
        <PlatformActionButton
          onClick={actions.importUbisoftGames}
          isLoading={loading.importingUbisoft}
          disabled={loading.importingUbisoft}
          label={t('ubisoft_import_button')}
          loadingLabel={t('ubisoft_importing_short')}
          icon={RefreshCw}
        />
      </PlatformActionsFooter>
    </div>
  );
}
