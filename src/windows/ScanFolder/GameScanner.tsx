import { FolderOpen, Scan } from 'lucide-react';

import { useScanner } from '@/hooks/useScanner.ts';
import { cn } from '@/lib/utils.ts';
import { Button } from '@/ui/button.tsx';

import { DiscoveriesList } from './DiscoveriesList';

export function GameScanner() {
  const {
    scanning,
    result,
    selectedFolder,
    handleSelectFolder,
    handleScan,
    handleAddAll,
  } = useScanner();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">
          Encontre jogos instalados localmente fora das lojas oficiais.
        </p>

        {/* Controles de Ação */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleSelectFolder}
            className="hover:border-primary/50 h-12 flex-1 border-dashed"
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            {selectedFolder ? 'Mudar Pasta' : 'Selecionar Pasta'}
          </Button>

          <Button
            onClick={handleScan}
            disabled={!selectedFolder || scanning}
            className="shadow-primary/20 h-12 flex-1 shadow-lg"
          >
            <Scan className={cn('mr-2 h-4 w-4', scanning && 'animate-spin')} />
            {scanning ? 'Analisando Arquivos...' : 'Iniciar Varredura'}
          </Button>
        </div>

        {selectedFolder && (
          <div className="bg-muted/30 flex items-center gap-2 overflow-hidden rounded-md border p-2">
            <span className="text-muted-foreground shrink-0 text-[10px] font-bold uppercase">
              Caminho:
            </span>
            <code className="text-primary/80 truncate text-xs">
              {selectedFolder}
            </code>
          </div>
        )}
      </div>

      {/* Área de Resultados */}
      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <div
              className={cn(
                'mb-6 flex items-center justify-between rounded-lg border p-4 text-sm',
                result.success
                  ? 'border-green-500/20 bg-green-500/5 text-green-400'
                  : 'border-red-500/20 bg-red-500/5 text-red-400'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    result.success ? 'bg-green-500' : 'bg-red-500'
                  )}
                />
                {result.message}
              </div>
              {result.success && result.discoveries.length > 0 && (
                <Button onClick={handleAddAll} disabled={scanning} size="sm">
                  Adicionar
                </Button>
              )}
            </div>

            {result.success && result.discoveries.length > 0 && (
              <>
                <DiscoveriesList discoveries={result.discoveries} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
