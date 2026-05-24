import { invoke } from '@tauri-apps/api/core';
import { Loader2, Save, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GameDetails } from '@/types';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Textarea } from '@/ui/textarea';
import { handleBackendError } from '@/utils/errorHandler';
import { toast } from '@/utils/toast';

interface GameEditFormProps {
  gameId: string;
  details: GameDetails;
  onCancel: () => void;
  onSuccess: () => void;
}

export function GameEditForm({
  gameId,
  details,
  onCancel,
  onSuccess,
}: GameEditFormProps) {
  const { t } = useTranslation('game_detail');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: details.descriptionPtbr || details.descriptionRaw || '',
    developer: details.developer || '',
    publisher: details.publisher || '',
    released: details.releaseDate || '',
  });

  const handleSave = async () => {
    setLoading(true);

    try {
      await invoke('update_game_details', {
        payload: {
          id: gameId,
          description: formData.description,
          developer: formData.developer,
          publisher: formData.publisher,
          released: formData.released,
        },
      });
      toast.success(t('edit_form_success'));
      onSuccess();
    } catch (error) {
      // Detecta se é um AppError, formata a mensagem e mostra o toast
      handleBackendError(error, {
        defaultMessage: t('edit_form_save_error'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-1">
      <div className="grid gap-4">
        {/* Developer & Publisher */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dev">{t('edit_form_label_developer')}</Label>
            <Input
              id="dev"
              value={formData.developer}
              onChange={e =>
                setFormData({ ...formData, developer: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pub">{t('edit_form_label_publisher')}</Label>
            <Input
              id="pub"
              value={formData.publisher}
              onChange={e =>
                setFormData({ ...formData, publisher: e.target.value })
              }
            />
          </div>
        </div>

        {/* Data de Lançamento */}
        <div className="space-y-2">
          <Label htmlFor="released">{t('edit_form_label_released')}</Label>
          <Input
            id="released"
            type="date"
            value={formData.released?.split('T')[0] || ''}
            onChange={e =>
              setFormData({ ...formData, released: e.target.value })
            }
          />
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="desc">{t('edit_form_label_description')}</Label>
          <Textarea
            id="desc"
            className="min-h-75 font-mono text-sm leading-relaxed"
            value={formData.description}
            onChange={e =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center justify-end gap-3 border-t pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          <X className="mr-2 h-4 w-4" /> {t('edit_form_cancel')}
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {t('edit_form_save')}
        </Button>
      </div>
    </div>
  );
}
