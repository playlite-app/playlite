import { invoke } from '@tauri-apps/api/core';
import { Cpu, FileText, HardDrive, MousePointer2, Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/utils/toast';

import { formatFileSize } from '@/services/scannerService';
import { ExecutableCandidate, GameDiscovery } from '@/types/scanner';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table';

interface Props {
  open: boolean;
  onClose: () => void;
  discovery: GameDiscovery;
}

export function ExecutableSelection({ open, onClose, discovery }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const handleSelect = async (exe: ExecutableCandidate) => {
    setIsSaving(true);

    try {
      // Chama o comando Rust definido em plataforms.rs
      await invoke<string>('add_game_from_scan', {
        name: discovery.suggested_name,
        executablePath: exe.path,
        basePath: discovery.base_path,
      });
      toast.success(`${discovery.suggested_name} adicionado à biblioteca!`);
      onClose();
    } catch (error) {
      toast.error(
        typeof error === 'string' ? error : 'Falha ao salvar jogo no banco.'
      );
      console.error('Erro ao adicionar jogo:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-border/40 flex h-[85vh] w-[95vw] max-w-6xl flex-col gap-0 overflow-hidden p-0 shadow-2xl sm:max-w-6xl">
        <DialogHeader className="bg-muted/10 border-b p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 rounded-lg p-3">
              <FileText className="text-primary h-6 w-6" />
            </div>
            <div className="flex flex-col gap-1">
              <DialogTitle className="text-2xl leading-none font-bold tracking-tight">
                {discovery.suggested_name}
              </DialogTitle>
              <DialogDescription className="text-sm">
                Selecione o executável principal para gerenciar o jogo.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          <Table>
            <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-muted-foreground/80 h-12 pl-8 text-sm font-bold tracking-widest uppercase">
                  Executável / Caminho
                </TableHead>
                <TableHead className="text-muted-foreground/80 h-12 text-sm font-bold tracking-widest uppercase">
                  Tamanho
                </TableHead>
                <TableHead className="text-muted-foreground/80 h-12 text-sm font-bold tracking-widest uppercase">
                  Arquitetura
                </TableHead>
                <TableHead className="text-muted-foreground/80 h-12 pr-8 text-right text-sm font-bold tracking-widest uppercase">
                  Ação
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discovery.executables
                .sort((a, b) => b.rank_score - a.rank_score)
                .map((exe, idx) => (
                  <TableRow key={exe.path}>
                    <TableCell className="py-4 pl-8">
                      <div className="flex items-start gap-3">
                        {idx === 0 ? (
                          <Star className="mt-1 h-4 w-4 shrink-0 fill-yellow-500 text-yellow-500" />
                        ) : (
                          <FileText className="text-muted-foreground mt-1 h-4 w-4 shrink-0" />
                        )}
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-xl leading-tight font-bold">
                            {exe.filename}
                            {idx === 0 && (
                              <Badge
                                variant="outline"
                                className="border-primary/30 text-primary ml-2 h-4 text-xs font-black uppercase"
                              >
                                Sugestão
                              </Badge>
                            )}
                          </span>
                          <span className="text-muted-foreground max-w-2xl truncate font-mono text-xs opacity-60">
                            {exe.path}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <HardDrive
                          size={14}
                          className="text-muted-foreground opacity-70"
                        />
                        {formatFileSize(exe.size_mb)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-background/50 border-border/50 font-mono text-xs font-semibold uppercase"
                      >
                        <Cpu size={12} className="mr-1.5 opacity-60" />
                        {exe.executable_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-8 text-right">
                      <Button
                        size="sm"
                        disabled={isSaving}
                        variant={idx === 0 ? 'default' : 'outline'}
                        onClick={() => handleSelect(exe)}
                        className="h-8 font-bold"
                      >
                        <MousePointer2 size={14} className="mr-2" />
                        {isSaving ? 'Salvando...' : 'Selecionar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

        <div className="bg-muted/5 text-muted-foreground border-t p-3 px-8 text-xs italic opacity-70">
          Dica: Arquivos recomendados geralmente possuem o ícone do jogo e maior
          pontuação interna.
        </div>
      </DialogContent>
    </Dialog>
  );
}

