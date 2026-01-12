import { Clock } from 'lucide-react';

import { GameDetails } from '@/types/game';

interface GameHltbCardProps {
  details: GameDetails | null;
  loading?: boolean;
}

export function GameHltbCard({ details }: GameHltbCardProps) {
  // Se não tiver dados e não estiver carregando, não exibe nada
  if (!details || (!details.hltbMainStory && !details.hltbCompletionist)) {
    return null;
  }

  return (
    <div className="mt-6 space-y-3">
      <h3 className="text-muted-foreground flex items-center gap-2 text-sm font-bold uppercase">
        <Clock size={16} /> HowLongToBeat
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {details.hltbMainStory && (
          <div className="bg-muted/50 hover:bg-muted rounded p-2 text-center transition-colors">
            <div className="text-muted-foreground text-xs">História</div>
            <div className="font-mono font-bold">{details.hltbMainStory}h</div>
          </div>
        )}

        {details.hltbMainExtra && (
          <div className="bg-muted/50 hover:bg-muted rounded p-2 text-center transition-colors">
            <div className="text-muted-foreground text-xs">+ Extras</div>
            <div className="font-mono font-bold">{details.hltbMainExtra}h</div>
          </div>
        )}

        {details.hltbCompletionist && (
          <div className="bg-muted/50 hover:bg-muted col-span-2 rounded border border-yellow-500/20 p-2 text-center transition-colors">
            <div className="text-xs text-yellow-600">100% Completo</div>
            <div className="font-mono font-bold text-yellow-600">
              {details.hltbCompletionist}h
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
