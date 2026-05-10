import { Bug, FileText, FolderOpen, RefreshCw, Settings } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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
      toast.success('Pasta de logs aberta');
    } catch (error) {
      console.error('Erro ao abrir pasta de logs:', error);
      toast.error('Não foi possível abrir a pasta de logs');
    }
  };

  const handleOpenAnalysisFolder = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const { appDataDir, join } = await import('@tauri-apps/api/path');

      const appData = await appDataDir();
      const analysisPath = await join(appData, 'analysis');

      await invoke('open_folder', { path: analysisPath });
      toast.success('Pasta de análises aberta');
    } catch (error) {
      console.error('Erro ao abrir pasta de análises:', error);
      toast.error('Não foi possível abrir a pasta de análises');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogTrigger></DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings size={20} />
            Configurações Rápidas
          </DialogTitle>
          <DialogDescription>
            Acesso rápido a ferramentas e diagnósticos do sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Análise de Sistema */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Sistema de Recomendações</h3>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={onGenerateReport}
            >
              <Bug size={16} />
              Gerar Relatório de Análise
            </Button>
            <p className="text-muted-foreground text-xs">
              Exporta estatísticas detalhadas do algoritmo de recomendação
            </p>
          </div>

          <Separator />

          {/* Atualizações */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Atualizações</h3>
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
              {isChecking ? 'Verificando...' : 'Procurar Atualizações'}
            </Button>
            <p className="text-muted-foreground text-xs">
              Busca novas versões disponíveis no GitHub Releases
            </p>
          </div>

          <Separator />

          {/* Logs e Análises */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Logs e Análises</h3>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleOpenLogsFolder}
              >
                <FileText size={16} />
                Abrir Pasta de Logs
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleOpenAnalysisFolder}
              >
                <FolderOpen size={16} />
                Abrir Pasta de Análises
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Logs do sistema e relatórios de recomendação exportados
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
