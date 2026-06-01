import { CheckCircle2, XCircle } from 'lucide-react';

interface BoolBadgeProps {
  value: string | null;
  label: string;
}

export function BoolBadge({ value, label }: BoolBadgeProps) {
  if (!value || value === 'unknown' || value === 'n/a') return null;

  const isTrue = value === 'true';
  const isHackable = value === 'hackable';

  return (
    <div className="flex items-center gap-1.5">
      {isTrue ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
      ) : isHackable ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
      ) : (
        <XCircle className="text-muted-foreground/40 h-3.5 w-3.5 shrink-0" />
      )}
      <span
        className={`text-xs ${
          isTrue
            ? 'text-foreground'
            : isHackable
              ? 'text-yellow-500/80'
              : 'text-muted-foreground/50 line-through'
        }`}
      >
        {label}
        {isHackable && <span className="ml-1 text-xs opacity-70">(mod)</span>}
      </span>
    </div>
  );
}
