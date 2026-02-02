import { Minus, ThumbsDown, ThumbsUp } from 'lucide-react';

import { SteamReviewSummary, traduzirSteamReview } from '@/types';

interface SteamReviewBadgeProps {
  label?: SteamReviewSummary;
  count?: number;
  score?: number;
}

export function SteamReviewBadge({
  label,
  count,
  score,
}: SteamReviewBadgeProps) {
  if (!label) return null;

  const lowerLabel = label.toLowerCase();
  let colorClass = 'text-gray-400 border-gray-500/50 bg-gray-500/10';
  let Icon = Minus;

  // Cores baseadas na UI da Steam
  if (lowerLabel.includes('positive')) {
    colorClass = 'text-[#66c0f4] border-[#66c0f4]/30 bg-[#66c0f4]/10';
    Icon = ThumbsUp;

    if (lowerLabel.includes('overwhelmingly')) {
      // Azul mais brilhante para "Extremamente Positivas"
      colorClass =
        'text-[#66c0f4] border-[#66c0f4]/50 bg-[#66c0f4]/20 shadow-[0_0_10px_rgba(102,192,244,0.1)]';
    }
  } else if (lowerLabel.includes('negative')) {
    colorClass = 'text-red-400 border-red-500/30 bg-red-500/10';
    Icon = ThumbsDown;
  } else if (lowerLabel.includes('mixed')) {
    colorClass = 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
  }

  return (
    <div
      className={`flex flex-col gap-1 rounded-lg border px-3 py-2 ${colorClass}`}
    >
      <div className="flex items-center gap-2">
        <Icon size={18} />
        <span className="text-base font-bold tracking-wide uppercase">
          {traduzirSteamReview(label)}
        </span>
      </div>
      {count && (
        <div className="flex justify-between font-mono text-sm opacity-80">
          <span>{count.toLocaleString()} análises</span>
          {score && <span>{Math.round(score)}%</span>}
        </div>
      )}
    </div>
  );
}
