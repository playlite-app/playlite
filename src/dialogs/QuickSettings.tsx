import { Bug, FileText, FolderOpen, RefreshCw, Settings } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/dialog';
import { Separator } from '@/ui/separator';
import { toast } from '@/utils/toast';

interface QuickSettingsModalProps {
  open: boolean;
  onClose: () => void;
  onGenerateReport: () => void;
  onCheckUpdates: () => void;
}
export function QuickSettings({
  open,
  onClose,
  onGenerateReport,
  onCheckUpdates,
}: QuickSettingsModalProps) {
  const { t } = useTranslation('settings');
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckUpdates = async () => {
    setIsChecking(true);

    try {
      onCheckUpdates();
    } finally {
      setIsChecking(false);
    }
  };

  const handleOpenLogsFolder = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const { appLogDir } = await import('@tauri-apps/api/path');

      const logsPath = await appLogDir();

      await invoke('open_folder', { path: logsPath });
      toast.success(t('quick_settings_logs_opened_success'));
    } catch (error) {
      console.error(t('quick_settings_logs_open_error_log'), error);
      toast.error(t('quick_settings_logs_opened_error'));
    }
  };

  const handleOpenAnalysisFolder = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const { appDataDir, join } = await import('@tauri-apps/api/path');

      const appData = await appDataDir();
      const analysisPath = await join(appData, 'analysis');

      await invoke('open_folder', { path: analysisPath });
      toast.success(t('quick_settings_analysis_opened_success'));
    } catch (error) {
      console.error(t('quick_settings_analysis_open_error_log'), error);
      toast.error(t('quick_settings_analysis_opened_error'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogTrigger></DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings size={20} />
            {t('quick_settings_title')}
          </DialogTitle>
          <DialogDescription>
            {t('quick_settings_description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Análise de Sistema */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              {t('quick_settings_recommendations_section')}
            </h3>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={onGenerateReport}
            >
              <Bug size={16} />
              {t('quick_settings_generate_analysis_report_button')}
            </Button>
            <p className="text-muted-foreground text-xs">
              {t('quick_settings_generate_analysis_report_description')}
            </p>
          </div>

          <Separator />

          {/* Atualizações */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              {t('quick_settings_updates_section')}
            </h3>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleCheckUpdates}
              disabled={isChecking}
            >
              <RefreshCw
                size={16}
                className={isChecking ? 'animate-spin' : ''}
              />
              {isChecking
                ? t('quick_settings_checking_updates_button')
                : t('quick_settings_check_updates_button')}
            </Button>
            <p className="text-muted-foreground text-xs">
              {t('quick_settings_updates_description')}
            </p>
          </div>

          <Separator />

          {/* Logs e Análises */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              {t('quick_settings_logs_section')}
            </h3>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleOpenLogsFolder}
              >
                <FileText size={16} />
                {t('quick_settings_open_logs_folder_button')}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleOpenAnalysisFolder}
              >
                <FolderOpen size={16} />
                {t('quick_settings_open_analysis_folder_button')}
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              {t('quick_settings_logs_description')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
