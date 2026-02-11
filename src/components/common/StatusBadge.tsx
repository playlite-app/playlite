import { AlertCircle, CheckCircle } from 'lucide-react';

interface StatusBadgeProps {
  type: 'success' | 'error' | null;
  message: string;
}

export function StatusBadge({ type, message }: StatusBadgeProps) {
  if (!type) return null;

  const isSuccess = type === 'success';

  return (
    <div
      className={`animate-in fade-in slide-in-from-top-2 flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-medium shadow-sm ${
        isSuccess
          ? 'border-green-500/20 bg-green-500/10 text-green-500'
          : 'border-red-500/20 bg-red-500/10 text-red-500'
      }`}
    >
      {isSuccess ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  );
}
