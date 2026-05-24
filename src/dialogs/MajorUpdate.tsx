import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog';

interface MajorUpdateProps {
  open: boolean;
  onClose: () => void;
  currentVersion?: string;
  previousVersion?: string;
}

/**
 * Dialog exibido após atualizações importantes do Playlite.
 * Informa o usuário sobre mudanças estruturais, backups e migrações.
 *
 * @param open - Controla visibilidade do dialog
 * @param onClose - Callback ao fechar
 * @param currentVersion - Versão atual instalada
 * @param previousVersion - Versão anterior
 */
export function MajorUpdate({
  open,
  onClose,
  currentVersion = '',
  previousVersion = '',
}: MajorUpdateProps) {
  const { t } = useTranslation('updater');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {t('major_update_title')}
          </DialogTitle>
          {currentVersion && previousVersion && (
            <DialogDescription className="text-base">
              <strong className="text-foreground">
                {t('major_update_updated_message')}
              </strong>{' '}
              {t('major_update_from_text')}{' '}
              <code className="bg-accent text-accent-foreground rounded px-1.5 py-0.5 font-mono text-sm">
                v{previousVersion}
              </code>{' '}
              {t('major_update_to_text')}{' '}
              <code className="bg-accent text-accent-foreground rounded px-1.5 py-0.5 font-mono text-sm">
                v{currentVersion}
              </code>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t('major_update_description')}
          </p>

          <div className="space-y-2">
            {[
              t('major_update_change_1'),
              t('major_update_change_2'),
              t('major_update_change_3'),
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="bg-accent/50 border-border rounded-lg border p-4">
            <p className="text-sm">
              <strong className="text-foreground">
                {t('major_update_data_safe_title')}
              </strong>{' '}
              {t('major_update_data_safe_text_1')}{' '}
              <code className="bg-background text-foreground rounded px-1.5 py-0.5 font-mono text-xs">
                {t('major_update_backups_folder_name')}
              </code>{' '}
              {t('major_update_data_safe_text_2')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            {t('major_update_continue_button')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
