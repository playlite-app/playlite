interface ContentErrorProps {
  message?: string;
  onRetry: () => void;
}

export function ContentError({ message, onRetry }: ContentErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-foreground text-sm font-medium">
        Não foi possível carregar
      </p>
      {message && (
        <p className="text-muted-foreground max-w-xs text-xs">{message}</p>
      )}
      <button
        onClick={onRetry}
        className="border-border text-foreground hover:bg-muted mt-1 rounded-md border px-3 py-1.5 text-xs transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  );
}
