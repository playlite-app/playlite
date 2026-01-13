// Exemplo de integração do novo comando enrich_library_optimized no frontend

import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { useState } from 'react';

// Tipos para os eventos
interface EnrichProgress {
  current: number;
  total_found: number;
  last_game: string;
  status: 'running' | 'completed' | 'error';
}

// Hook personalizado para enriquecimento de biblioteca
export function useEnrichLibrary() {
  const [isEnriching, setIsEnriching] = useState(false);
  const [progress, setProgress] = useState<EnrichProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enrichLibrary = async (optimized = true) => {
    setIsEnriching(true);
    setError(null);
    setProgress(null);

    let unlistenProgress: UnlistenFn;
    let unlistenComplete: UnlistenFn;

    try {
      // Escuta eventos de progresso
      unlistenProgress = await listen<EnrichProgress>(
        'enrich_progress',
        event => {
          setProgress(event.payload);
          console.log(
            `[Enrich] ${event.payload.current}/${event.payload.total_found}: ${event.payload.last_game}`
          );
        }
      );

      // Escuta conclusão
      unlistenComplete = await listen<string>('enrich_complete', event => {
        console.log('[Enrich] Concluído:', event.payload);
        setIsEnriching(false);
        setProgress(null);

        // Cleanup listeners
        unlistenProgress();
        unlistenComplete();
      });

      // Invoca o comando (otimizado ou sequencial)
      const command = optimized ? 'enrich_library_optimized' : 'enrich_library';
      await invoke(command);

      console.log(`[Enrich] Comando ${command} iniciado com sucesso`);
    } catch (err) {
      console.error('[Enrich] Erro:', err);
      setError(err instanceof Error ? err.message : String(err));
      setIsEnriching(false);
      setProgress(null);

      // Cleanup listeners em caso de erro
      if (unlistenProgress) unlistenProgress();
      if (unlistenComplete) unlistenComplete();
    }
  };

  return {
    enrichLibrary,
    isEnriching,
    progress,
    error,
  };
}

// Exemplo de componente React
export function EnrichLibraryButton() {
  const { enrichLibrary, isEnriching, progress, error } = useEnrichLibrary();

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => enrichLibrary(true)}
        disabled={isEnriching}
        className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
      >
        {isEnriching ? 'Enriquecendo...' : 'Enriquecer Biblioteca'}
      </button>

      {/* Barra de progresso */}
      {progress && (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            {progress.current}/{progress.total_found} - {progress.last_game}
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-200">
            <div
              className="h-2.5 rounded-full bg-blue-600 transition-all"
              style={{
                width: `${(progress.current / progress.total_found) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="rounded bg-red-50 p-2 text-sm text-red-500">
          Erro: {error}
        </div>
      )}
    </div>
  );
}

// Exemplo de uso avançado com estatísticas
export function EnrichLibraryAdvanced() {
  const { enrichLibrary, isEnriching, progress, error } = useEnrichLibrary();
  const [stats, setStats] = useState({
    startTime: 0,
    totalProcessed: 0,
    successRate: 0,
  });

  const handleEnrich = async () => {
    setStats({ ...stats, startTime: Date.now() });
    await enrichLibrary(true);
  };

  // Calcula estatísticas em tempo real
  const currentStats = progress
    ? {
        ...stats,
        totalProcessed: progress.current,
        elapsedTime: ((Date.now() - stats.startTime) / 1000).toFixed(1),
        avgTimePerGame: (
          (Date.now() - stats.startTime) /
          1000 /
          progress.current
        ).toFixed(2),
        estimatedRemaining: (
          (((Date.now() - stats.startTime) / progress.current) *
            (progress.total_found - progress.current)) /
          1000
        ).toFixed(0),
      }
    : null;

  return (
    <div className="space-y-4 rounded-lg bg-white p-4 shadow">
      <h3 className="text-lg font-semibold">Enriquecer Biblioteca</h3>

      <button
        onClick={handleEnrich}
        disabled={isEnriching}
        className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 font-medium text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isEnriching ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processando...
          </span>
        ) : (
          '🚀 Iniciar Enriquecimento'
        )}
      </button>

      {/* Progresso detalhado */}
      {currentStats && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progresso</span>
            <span className="text-sm text-gray-600">
              {progress?.current}/{progress?.total_found} jogos
            </span>
          </div>

          <div className="relative pt-1">
            <div className="flex h-3 overflow-hidden rounded-full bg-gray-200 text-xs">
              <div
                style={{
                  width: `${
                    ((progress?.current || 0) / (progress?.total_found || 1)) *
                    100
                  }%`,
                }}
                className="flex flex-col justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-center whitespace-nowrap text-white shadow-none transition-all duration-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded bg-blue-50 p-2">
              <div className="text-gray-600">Tempo decorrido</div>
              <div className="font-semibold">{currentStats.elapsedTime}s</div>
            </div>
            <div className="rounded bg-purple-50 p-2">
              <div className="text-gray-600">Tempo estimado</div>
              <div className="font-semibold">
                {currentStats.estimatedRemaining}s
              </div>
            </div>
            <div className="rounded bg-green-50 p-2">
              <div className="text-gray-600">Média por jogo</div>
              <div className="font-semibold">
                {currentStats.avgTimePerGame}s
              </div>
            </div>
            <div className="rounded bg-yellow-50 p-2">
              <div className="text-gray-600">Atual</div>
              <div className="truncate text-xs font-semibold">
                {progress?.last_game}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="relative rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Info */}
      <div className="space-y-1 text-xs text-gray-500">
        <p>✨ Versão otimizada (3x mais rápida)</p>
        <p>📊 Processa até 3 jogos simultaneamente</p>
        <p>🎯 Inclui inferência automática de séries</p>
        <p>🔄 Salva metadados em lote para melhor performance</p>
      </div>
    </div>
  );
}

// Exemplo de integração em página de configurações
export function SettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-2xl font-bold">Configurações</h1>

      {/* Outras configurações... */}

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Metadados</h2>
        <EnrichLibraryAdvanced />
      </section>

      {/* Mais configurações... */}
    </div>
  );
}
