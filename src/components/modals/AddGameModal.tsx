import { Gamepad2, Star } from 'lucide-react';

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
import { useGameForm } from '@/hooks';
import { Game } from '@/types';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (gameData: any) => void;
  gameToEdit?: Game | null;
}

export default function AddGameModal({
  isOpen,
  onClose,
  onSave,
  gameToEdit,
}: AddGameModalProps) {
  const { formData, handleChange, isValid, buildPayload } = useGameForm(
    isOpen,
    gameToEdit
  );

  const handleSave = () => {
    if (!isValid()) return;

    const payload = buildPayload();
    onSave(payload);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="custom-scrollbar max-h-[90vh] overflow-y-auto sm:max-w-150">
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

          <div className="grid grid-cols-3 gap-2">
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

            <div className="col-span-2 grid gap-2">
              <Label htmlFor="cover">Capa (URL)</Label>
              <Input
                id="cover"
                value={formData.coverUrl}
                onChange={e => handleChange('coverUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
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
              {/* Futuro: Botão de selecionar executável */}
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
          <div className="grid grid-cols-[1fr_auto_auto] items-end gap-4">
            <div className="grid gap-1">
              <Label htmlFor="playtime">Tempo Jogado (Horas)</Label>
              <Input
                id="playtime"
                type="number"
                min="0"
                step="0.1"
                value={
                  formData.playtime
                    ? String(
                        Math.round((Number(formData.playtime) / 60) * 100) / 100
                      )
                    : ''
                }
                onChange={e => {
                  const hours = parseFloat(e.target.value);
                  const minutes = isNaN(hours) ? 0 : Math.floor(hours * 60);
                  handleChange('playtime', minutes);
                }}
              />
            </div>

            <div className="grid gap-1">
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

            <div className="grid gap-1">
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
