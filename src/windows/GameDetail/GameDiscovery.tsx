import { invoke } from '@tauri-apps/api/core';
import { Frown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ContentError, ContentLoading, SimilarGameCard } from '@/components';
import { SimilarGame } from '@/types';
import { Game } from '@/types/game';

interface GameDiscoveryProps {
  game: Game;
}

// === ESTADOS DE UI ===

function DiscoveryEmpty({ gameName }: { gameName: string }) {
  const { t } = useTranslation('game_detail');

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <Frown className="text-muted-foreground/50 h-8 w-8" />
      <p className="text-foreground text-sm font-medium">
        {t('discovery_empty_title')}
      </p>
      <p className="text-muted-foreground max-w-xs text-xs">
        {t('discovery_empty_description')}{' '}
        <span className="text-foreground font-medium">{gameName}</span>.
      </p>
    </div>
  );
}

// === COMPONENTE PRINCIPAL ===

export function GameDiscovery({ game }: GameDiscoveryProps) {
  const { t } = useTranslation('game_detail');
  const [results, setResults] = useState<SimilarGame[]>([]);
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const load = async () => {
    setStatus('loading');
    setErrorMsg('');

    try {
      const data = await invoke<SimilarGame[]>('get_similar_games', {
        gameId: game.id,
        gameName: game.name,
      });

      setResults(data);
      setStatus('success');
    } catch (err) {
      const msg = typeof err === 'string' ? err : t('discovery_unknown_error');
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  // Carrega ao montar ou quando o jogo muda
  useEffect(() => {
    setResults([]);
    setStatus('idle');
  }, [game.id]);

  useEffect(() => {
    if (status === 'idle') {
      load();
    }
  }, [status]);

  if (status === 'loading')
    return <ContentLoading message={t('discovery_loading_message')} />;

  if (status === 'error')
    return (
      <ContentError message={errorMsg} onRetry={() => setStatus('idle')} />
    );

  if (status === 'success' && results.length === 0)
    return <DiscoveryEmpty gameName={game.name} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-sm font-semibold">
          {t('discovery_header_title')}{' '}
          <span className="text-primary">{game.name}</span>
        </h3>
        <span className="text-muted-foreground text-xs">
          {results.length} {t('discovery_games_count')}
        </span>
      </div>

      {/* Grid responsivo — 2 cols em telas pequenas, 3 em médias, 4 em grandes */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {results.map(similar => (
          <SimilarGameCard key={similar.id} game={similar} />
        ))}
      </div>
    </div>
  );
}
