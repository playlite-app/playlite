import { invoke } from '@tauri-apps/api/core';
import { Loader2, Save, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GameDetails } from '@/types';
import { handleBackendError } from '@/utils/errorHandler';

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
      toast.success('Detalhes atualizados com sucesso!');
      onSuccess();
    } catch (error) {
      // Detecta se é um AppError, formata a mensagem e mostra o toast
      handleBackendError(error, {
        defaultMessage: 'Não foi possível salvar as alterações.',
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
            <Label htmlFor="dev">Desenvolvedor</Label>
            <Input
              id="dev"
              value={formData.developer}
              onChange={e =>
                setFormData({ ...formData, developer: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pub">Publicadora</Label>
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
          <Label htmlFor="released">Data de Lançamento (YYYY-MM-DD)</Label>
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
          <Label htmlFor="desc">Descrição / Sinopse</Label>
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
          <X className="mr-2 h-4 w-4" /> Cancelar
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}
