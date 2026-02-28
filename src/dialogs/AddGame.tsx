import { open } from '@tauri-apps/plugin-dialog';
import { FileSearch, FolderOpen, Gamepad2, Star } from 'lucide-react';

import { useGameForm } from '@/hooks';
import { Game } from '@/types';
import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select';
import { Separator } from '@/ui/separator';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (gameData: Partial<Game>) => void;
  gameToEdit?: Game | null;
}

export default function AddGame({
  isOpen,
  onClose,
  onSave,
  gameToEdit,
}: Readonly<AddGameModalProps>) {
  const { formData, handleChange, isValid, buildPayload } = useGameForm(
    isOpen,
    gameToEdit
  );

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Selecionar Pasta de Instalação',
      });

      if (selected) {
        handleChange('installPath', selected);
      }
    } catch (error) {
      console.error('Erro ao selecionar pasta:', error);
    }
  };

  const handleSelectExecutable = async () => {
    try {
      const selected = await open({
        multiple: false,
        title: 'Selecionar Executável',
        filters: [
          {
            name: 'Executável',
            extensions: ['exe'],
          },
        ],
      });

      if (selected) {
        handleChange('executablePath', selected);
      }
    } catch (error) {
      console.error('Erro ao selecionar executável:', error);
    }
  };

  const handleSave = () => {
    if (!isValid()) return;

    const payload = buildPayload();
    onSave(payload as Partial<Game>);
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

          <div className="grid gap-2">
            <Label htmlFor="cover">Capa (URL)</Label>
            <Input
              id="cover"
              value={formData.coverUrl}
              onChange={e => handleChange('coverUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="grid gap-2">
              <Label>Plataforma</Label>
              <Select
                value={formData.platform}
                onValueChange={val => handleChange('platform', val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Steam">Steam</SelectItem>
                  <SelectItem value="Epic">Epic Games</SelectItem>
                  <SelectItem value="GOG">GOG Galaxy</SelectItem>
                  <SelectItem value="EA">EA</SelectItem>
                  <SelectItem value="Ubisoft">Ubisoft</SelectItem>
                  <SelectItem value="Battle.net">Battle.net</SelectItem>
                  <SelectItem value="Amazon">Amazon Games</SelectItem>
                  <SelectItem value="Indie">Indie</SelectItem>
                  <SelectItem value="Outra">Outra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Instalado</Label>
              <div className="border-input bg-background flex w-full items-center gap-2 rounded-md border px-3 py-2">
                <input
                  type="checkbox"
                  id="installed"
                  checked={formData.installed}
                  onChange={e => handleChange('installed', e.target.checked)}
                  className="h-4 w-4 cursor-pointer"
                />
                <label htmlFor="installed" className="cursor-pointer text-sm">
                  {formData.installed ? 'Sim' : 'Não'}
                </label>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Confiança da Importação</Label>
              <Select
                value={formData.importConfidence || 'none'}
                onValueChange={val =>
                  handleChange('importConfidence', val === 'none' ? '' : val)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="High">Alta</SelectItem>
                  <SelectItem value="Medium">Média</SelectItem>
                  <SelectItem value="Low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="my-2" />

          {/* === EXECUÇÃO === */}
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
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleSelectFolder}
                title="Selecionar pasta"
              >
                <FolderOpen size={18} />
              </Button>
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
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleSelectExecutable}
                title="Selecionar executável"
              >
                <FileSearch size={18} />
              </Button>
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
          <div className="grid grid-cols-3 items-end gap-4">
            <div className="grid gap-2">
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
                  const hours = Number.parseFloat(e.target.value);
                  const minutes = Number.isNaN(hours)
                    ? 0
                    : Math.floor(hours * 60);
                  handleChange('playtime', String(minutes));
                }}
              />
            </div>

            <div className="grid gap-1">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={val => handleChange('status', val)}
              >
                <SelectTrigger className="w-full">
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
