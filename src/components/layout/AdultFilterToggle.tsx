import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AdultFilterToggleProps {
  hideAdult: boolean;
  onToggle: () => void;
}

export function AdultFilterToggle({
  hideAdult,
  onToggle,
}: AdultFilterToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={`shrink-0 transition-colors ${
            hideAdult
              ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-600'
              : 'text-muted-foreground hover:bg-red-500/10 hover:text-red-500'
          }`}
        >
          {hideAdult ? <EyeOff size={18} /> : <Eye size={18} />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>
          {hideAdult ? 'Conteúdo adulto oculto' : 'Ocultar conteúdo adulto'}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
