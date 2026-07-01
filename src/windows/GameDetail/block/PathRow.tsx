import { Copy } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GameDataPath } from '@/types';
import { expandPathVars } from '@/utils/pcgw';

interface PathRowProps {
  path: GameDataPath;
}

export function PathRow({ path }: PathRowProps) {
  const { t } = useTranslation('game_detail');
  const [copied, setCopied] = useState(false);

  const display = path.expandedPath ?? expandPathVars(path.rawPath);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="border-border/40 flex items-start gap-2 border-b py-2 last:border-0">
      <span className="bg-muted text-muted-foreground mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs">
        {path.os}
      </span>
      <code className="text-foreground/80 min-w-0 flex-1 text-xs leading-relaxed break-all">
        {display}
      </code>
      <div className="mt-0.5 flex shrink-0 gap-1">
        <button
          onClick={handleCopy}
          title={t('path_row_copy_tooltip')}
          className="text-muted-foreground hover:text-foreground rounded p-0.5 transition-colors"
        >
          <Copy className={`h-3.5 w-3.5 ${copied ? 'text-green-500' : ''}`} />
        </button>
      </div>
    </div>
  );
}
