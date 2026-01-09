import { Gamepad2, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Game } from '@/types';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (gameData: any) => void;
  gameToEdit?: Game | null;
}

const INITIAL_STATE = {
  name: '',
  coverUrl: '',
  platform: 'Manual',
  status: 'backlog',
  playtime: '0',
  rating: 0,
  installPath: '',
  executablePath: '',
  launchArgs: '',
};

export default function AddGameModal({
  isOpen,
  onClose,
  onSave,
  gameToEdit,
}: AddGameModalProps) {
  const [formData, setFormData] = useState(INITIAL_STATE);

  useEffect(() => {
    if (isOpen) {
      if (gameToEdit) {
        setFormData({
          name: gameToEdit.name,
          coverUrl: gameToEdit.coverUrl || '',
          platform: gameToEdit.platform || 'Manual',
          status: gameToEdit.status || 'backlog',
          playtime: gameToEdit.playtime?.toString() || '0',
          rating: gameToEdit.userRating || 0,
          installPath: gameToEdit.installPath || '',
          executablePath: gameToEdit.executablePath || '',
          launchArgs: gameToEdit.launchArgs || '',
        });
      } else {
        setFormData(INITIAL_STATE);
      }
    }
  }, [isOpen, gameToEdit]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    const payload = {
      // Se estiver editando, mantém o ID. Se for novo, App.tsx gera o UUID
      id: gameToEdit?.id,
      name: formData.name,
      coverUrl: formData.coverUrl || null,
      platform: formData.platform,
      status: formData.status,
      // Converte playtime para número
      playtime: parseInt(formData.playtime) || 0,
      // Mapeia rating para userRating
      userRating: formData.rating > 0 ? formData.rating : null,

      // Campos de execução do
      installPath: formData.installPath || null,
      executablePath: formData.executablePath || null,
      launchArgs: formData.launchArgs || null,
    };

    onSave(payload);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-150">
        <DialogHeader>
          <DialogTitle>
            {gameToEdit ? 'Editar Jogo' : 'Adicionar Jogo Manual'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* === DADOS BÁSICOS === */}
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Jogo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="Ex: Elden Ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Plataforma</Label>
              <Select
                value={formData.platform}
                onValueChange={val => handleChange('platform', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manual">Outro / Manual</SelectItem>
                  <SelectItem value="Steam">Steam</SelectItem>
                  <SelectItem value="Epic">Epic Games</SelectItem>
                  <SelectItem value="GOG">GOG Galaxy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={val => handleChange('status', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="playing">Jogando</SelectItem>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="abandoned">Abandonado</SelectItem>
                  <SelectItem value="plan_to_play">Pretendo Jogar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cover">Capa (URL)</Label>
            <Input
              id="cover"
              value={formData.coverUrl}
              onChange={e => handleChange('coverUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <Separator className="my-2" />

          {/* === EXECUÇÃO (V2.0) === */}
          <h3 className="text-muted-foreground flex items-center gap-2 text-sm font-semibold">
            <Gamepad2 size={16} /> Configuração de Lançamento
          </h3>

          <div className="grid gap-2">
            <Label htmlFor="installPath">Pasta de Instalação (Raiz)</Label>
            <div className="flex gap-2">
              <Input
                id="installPath"
                value={formData.installPath}
                onChange={e => handleChange('installPath', e.target.value)}
                placeholder="C:\Games\MeuJogo\"
              />
              {/* Futuro: Botão de selecionar pasta */}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="execPath">Caminho do Executável (.exe)</Label>
            <div className="flex gap-2">
              <Input
                id="execPath"
                value={formData.executablePath}
                onChange={e => handleChange('executablePath', e.target.value)}
                placeholder="C:\Games\MeuJogo\jogo.exe"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="launchArgs">Argumentos de Lançamento</Label>
            <Input
              id="launchArgs"
              value={formData.launchArgs}
              onChange={e => handleChange('launchArgs', e.target.value)}
              placeholder="Ex: -windowed -nointro"
            />
          </div>

          <Separator className="my-2" />

          {/* === AVALIAÇÃO === */}
          <div className="grid grid-cols-2 items-end gap-4">
            <div className="grid gap-2">
              <Label htmlFor="playtime">Tempo Jogado (minutos)</Label>
              <Input
                id="playtime"
                type="number"
                min="0"
                value={formData.playtime}
                onChange={e => handleChange('playtime', e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Sua Avaliação</Label>
              <div className="flex h-10 items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleChange('rating', star)}
                    className={`transition-all hover:scale-110 focus:outline-none ${
                      star <= formData.rating
                        ? 'text-yellow-400'
                        : 'text-muted-foreground/30'
                    }`}
                  >
                    <Star
                      size={24}
                      fill={star <= formData.rating ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
