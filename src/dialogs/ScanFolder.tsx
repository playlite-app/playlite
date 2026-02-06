import { invoke } from '@tauri-apps/api/core';
import {
  Cpu,
  FileText,
  FolderOpen,
  Gamepad2,
  HardDrive,
  Scan,
  Star,
  X,
} from 'lucide-react';
import { useState } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useScanner } from '@/hooks/useScanner';
import { formatFileSize } from '@/services/scannerService';
import { ExecutableCandidate, GameDiscovery } from '@/types/scanner';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Card, CardContent } from '@/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog';

interface ScanFolderModalProps {
  open: boolean;
  onClose: () => void;
}

export function ScanFolderModal({ open, onClose }: ScanFolderModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Escanear Pasta de Jogos</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          <GameScanner />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GameScanner() {
  const { scanning, result, selectedFolder, handleSelectFolder, handleScan } =
    useScanner();

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Encontre jogos instalados localmente fora das lojas oficiais
      </p>

      {/* Seleção de Pasta */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleSelectFolder}
          className="flex-1"
        >
          <FolderOpen className="mr-2 h-4 w-4" />
          Selecionar Pasta
        </Button>
        <Button
          onClick={handleScan}
          disabled={!selectedFolder || scanning}
          className="flex-1"
        >
          <Scan className="mr-2 h-4 w-4" />
          {scanning ? 'Escaneando...' : 'Iniciar Scan'}
        </Button>
      </div>

      {selectedFolder && (
        <div className="text-muted-foreground text-sm">
          Pasta selecionada:{' '}
          <code className="bg-muted rounded px-1 py-0.5 text-xs">
            {selectedFolder}
          </code>
        </div>
      )}

      {/* Resultados */}
      {result && (
        <div className="space-y-4">
          <div
            className={`rounded-lg p-3 text-sm ${
              result.success
                ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                : 'bg-red-500/10 text-red-700 dark:text-red-400'
            }`}
          >
            {result.message}
          </div>

          {result.success && result.discoveries.length > 0 && (
            <DiscoveriesList discoveries={result.discoveries} />
          )}
        </div>
      )}
    </div>
  );
}

function DiscoveriesList({ discoveries }: { discoveries: GameDiscovery[] }) {
  return (
    <div className="space-y-3">
      <h4 className="font-medium">Jogos Encontrados ({discoveries.length})</h4>
      {discoveries.map(discovery => (
        <GameDiscoveryCard key={discovery.id} discovery={discovery} />
      ))}
    </div>
  );
}

function GameDiscoveryCard({ discovery }: { discovery: GameDiscovery }) {
  const [showModal, setShowModal] = useState(false);

  const bestExe = discovery.executables.reduce(
    (best: ExecutableCandidate, current: ExecutableCandidate) =>
      current.rank_score > best.rank_score ? current : best,
    discovery.executables[0]
  );

  return (
    <>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Gamepad2 className="text-muted-foreground h-4 w-4" />
                <h5 className="font-medium">{discovery.suggested_name}</h5>
                <Badge variant="secondary">
                  {discovery.confidence}/10 confiança
                </Badge>
              </div>

              <div className="text-muted-foreground space-y-1 text-sm">
                <div className="flex items-center gap-1">
                  <FolderOpen className="h-3 w-3" />
                  {discovery.base_path}
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {discovery.executables.length} executáveis encontrados
                </div>
                {bestExe && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    Recomendado: {bestExe.filename}
                  </div>
                )}
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setShowModal(true)}
              className="ml-4"
            >
              Selecionar Executável
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <ExecutableSelectionModal
          discovery={discovery}
          onClose={() => setShowModal(false)}
          onSelect={async exe => {
            try {
              await invoke('add_game_from_scan', {
                name: discovery.suggested_name,
                executablePath: exe.path,
                basePath: discovery.base_path,
              });
              console.log('Jogo adicionado:', discovery.suggested_name);
              setShowModal(false);
            } catch (error) {
              console.error('Erro ao adicionar jogo:', error);
            }
          }}
        />
      </Dialog>
    </>
  );
}

interface ExecutableSelectionModalProps {
  discovery: GameDiscovery;
  onClose: () => void;
  onSelect: (exe: ExecutableCandidate) => void;
}

function ExecutableSelectionModal({
  discovery,
  onClose,
  onSelect,
}: ExecutableSelectionModalProps) {
  const sortedExes = [...discovery.executables].sort(
    (a, b) => b.rank_score - a.rank_score
  );

  return (
    <DialogContent className="max-h-[80vh] max-w-4xl overflow-hidden">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Selecionar Executável
        </DialogTitle>
        <DialogDescription>
          Encontramos {discovery.executables.length} executáveis possíveis para{' '}
          <strong>{discovery.suggested_name}</strong>.
          <br />
          💡 Normalmente o jogo principal é o maior arquivo ou o recomendado.
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Executável</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Confiança</TableHead>
              <TableHead className="w-32">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedExes.map((exe, index) => (
              <TableRow
                key={exe.path}
                className={index === 0 ? 'bg-muted/50' : ''}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    {index === 0 && (
                      <Star className="h-4 w-4 text-yellow-500" />
                    )}
                    <div>
                      <div className="font-medium">{exe.filename}</div>
                      <div className="text-muted-foreground max-w-xs truncate text-xs">
                        {exe.path}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <HardDrive className="text-muted-foreground h-3 w-3" />
                    {formatFileSize(exe.size_mb)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="flex w-fit items-center gap-1"
                  >
                    <Cpu className="h-3 w-3" />
                    {exe.executable_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ConfidenceBadge score={exe.rank_score} />
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    onClick={() => onSelect(exe)}
                    className="w-full"
                  >
                    Selecionar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={onClose}>
          <X className="mr-2 h-4 w-4" />
          Nenhum é jogo
        </Button>
      </div>
    </DialogContent>
  );
}

function ConfidenceBadge({ score }: { score: number }) {
  const level =
    score >= 5 ? 'default' : score >= 0 ? 'secondary' : 'destructive';
  const text = score >= 5 ? 'Alta' : score >= 0 ? 'Média' : 'Baixa';

  return <Badge variant={level}>{text}</Badge>;
}
