import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog';

interface MajorUpdateProps {
  open: boolean;
  onClose: () => void;
  currentVersion?: string;
  previousVersion?: string;
}

/**
 * Dialog exibido após atualizações importantes do Playlite.
 * Informa o usuário sobre mudanças estruturais, backups e migrações.
 *
 * @param open - Controla visibilidade do dialog
 * @param onClose - Callback ao fechar
 * @param currentVersion - Versão atual instalada
 * @param previousVersion - Versão anterior
 */
export function MajorUpdate({
  open,
  onClose,
  currentVersion = '',
  previousVersion = '',
}: MajorUpdateProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Atualização Importante</DialogTitle>
          {currentVersion && previousVersion && (
            <DialogDescription className="text-base">
              <strong className="text-foreground">
                Playlite foi atualizado
              </strong>{' '}
              de{' '}
              <code className="bg-accent text-accent-foreground rounded px-1.5 py-0.5 font-mono text-sm">
                v{previousVersion}
              </code>{' '}
              para{' '}
              <code className="bg-accent text-accent-foreground rounded px-1.5 py-0.5 font-mono text-sm">
                v{currentVersion}
              </code>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            Esta versão do Playlite trouxe mudanças estruturais importantes no
            banco de dados e melhorias de compatibilidade.
          </p>

          <div className="space-y-2">
            {[
              'Backup automático criado',
              'Dados migrados com segurança',
              'Sistema de versionamento ativo',
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="bg-accent/50 border-border rounded-lg border p-4">
            <p className="text-sm">
              <strong className="text-foreground">
                Seus dados estão seguros!
              </strong>{' '}
              Um backup foi criado automaticamente na pasta{' '}
              <code className="bg-background text-foreground rounded px-1.5 py-0.5 font-mono text-xs">
                backups/
              </code>{' '}
              do diretório da aplicação.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Entendi, continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
