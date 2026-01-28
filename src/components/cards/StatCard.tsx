import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}

export function StatCard({ icon, label, value, color, bg }: StatCardProps) {
  return (
    <div className="bg-card border-border hover:border-primary/50 flex items-center gap-4 rounded-xl border p-5 transition-colors">
      <div className={`rounded-lg p-3 ${bg} ${color}`}>{icon}</div>
      <div>
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
