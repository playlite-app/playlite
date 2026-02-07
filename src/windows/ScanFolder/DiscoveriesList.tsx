import { FileText, FolderOpen, Gamepad2, Star } from 'lucide-react';
import { useState } from 'react';

import { getBestExecutable } from '@/services/scannerService';
import { GameDiscovery } from '@/types/scanner';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Card, CardContent } from '@/ui/card';

import { ExecutableSelection } from './ExecutableSelection.tsx';

export function DiscoveriesList({
  discoveries,
}: {
  discoveries: GameDiscovery[];
}) {
  return (
    <div className="space-y-4">
      <h4 className="px-1 text-lg font-bold">
        Jogos Encontrados ({discoveries.length})
      </h4>
      <div className="flex flex-col gap-3">
        {discoveries.map(discovery => (
          <GameDiscoveryCard key={discovery.id} discovery={discovery} />
        ))}
      </div>
    </div>
  );
}

function GameDiscoveryCard({ discovery }: { discovery: GameDiscovery }) {
  const [showModal, setShowModal] = useState(false);
  const bestExe = getBestExecutable(discovery);

  return (
    <>
      <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <Gamepad2 className="text-muted-foreground h-4 w-4" />
                <h5 className="truncate font-bold">
                  {discovery.suggested_name}
                </h5>
                <Badge variant="secondary" className="h-5 text-[10px]">
                  {discovery.confidence}/10 confiança
                </Badge>
              </div>

              <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <div className="flex max-w-xs items-center gap-1.5 truncate">
                  <FolderOpen size={12} /> {discovery.base_path}
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText size={12} /> {discovery.executables.length}{' '}
                  executáveis
                </div>
                {bestExe && (
                  <div className="flex items-center gap-1.5 text-yellow-500/80">
                    <Star size={12} className="fill-yellow-500/10" />
                    Sugestão: {bestExe.filename}
                  </div>
                )}
              </div>
            </div>

            <Button size="sm" onClick={() => setShowModal(true)}>
              Selecionar Executável
            </Button>
          </div>
        </CardContent>
      </Card>

      <ExecutableSelection
        open={showModal}
        discovery={discovery}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
