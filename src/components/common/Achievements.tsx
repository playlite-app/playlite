import { invoke } from '@tauri-apps/api/core';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Medal, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Skeleton } from '@/ui/skeleton';

interface Achievement {
  game_name: string;
  achievement_name: string;
  unlock_time: number; // Timestamp Unix
  game_id: string;
}

export default function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke<Achievement[]>('get_recent_achievements')
      .then(setAchievements)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (achievements.length != 0) {
    return (
      <div className="space-y-3">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Trophy className="text-yellow-500" size={20} />
          Conquistas Recentes
        </h3>

        <div className="space-y-2">
          {achievements.map((ach, i) => (
            <div
              key={i}
              className="bg-card hover:bg-accent/5 flex items-center justify-between rounded-lg border p-3 transition-colors"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="shrink-0 rounded-full bg-yellow-500/10 p-2 text-yellow-500">
                  <Medal size={16} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {ach.achievement_name}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {ach.game_name}
                  </p>
                </div>
              </div>
              <span className="text-muted-foreground ml-2 shrink-0 text-[10px] whitespace-nowrap">
                {formatDistanceToNow(new Date(ach.unlock_time * 1000), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
