import React from 'react';

interface SettingsRowProps {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Linha de configuração reutilizável.
 * Layout consistente com ícone, título, descrição e controles.
 */
export function SettingsRow({
  icon: Icon,
  title,
  description,
  children,
  className = '',
}: SettingsRowProps) {
  return (
    <div
      className={`bg-card flex flex-col gap-4 rounded-xl border p-6 md:flex-row md:items-center md:justify-between ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="text-primary mt-1 rounded-lg bg-blue-500/10 p-2">
          <Icon size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="leading-none font-semibold tracking-tight">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>
      <div className="w-full md:w-auto md:min-w-75">{children}</div>
    </div>
  );
}
