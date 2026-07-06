import { FolderOpen } from 'lucide-react';

import { Button } from '@/ui/button';
import { Input } from '@/ui/input';

interface PathPickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBrowse: () => void;
  placeholder: string;
  browseLabel: string;
}

/**
 * Campo de caminho editável com botão de "procurar" (abre diálogo nativo)
 * e preview do valor selecionado abaixo. Usado por Heroic, Legacy Games e
 * Wine — qualquer plataforma que aceite um caminho manual opcional.
 *
 * Unifica um pequeno detalhe de UX que estava inconsistente: no Legacy
 * original o preview do caminho não era exibido (só no Heroic); aqui os
 * dois passam a mostrar o preview, o que é uma pequena melhoria visual.
 */
export function PathPickerField({
  value,
  onChange,
  onBrowse,
  placeholder,
  browseLabel,
}: Readonly<PathPickerFieldProps>) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-background/50 font-mono text-xs"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={onBrowse}
          className="shrink-0 text-xs"
        >
          <FolderOpen className="mr-1 h-3 w-3" />
          {browseLabel}
        </Button>
      </div>
      {value && (
        <code className="text-muted-foreground bg-secondary/40 truncate rounded-md border px-2 py-1.5 text-[10px]">
          {value}
        </code>
      )}
    </div>
  );
}
