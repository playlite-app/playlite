import { invoke } from '@tauri-apps/api/core';
import { useCallback, useEffect, useRef, useState } from 'react';

import { PcgwCargoData, PcgwScrapedData } from '@/types/game_detail';

type PcgwStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'not_found'
  | 'no_steam_id'
  | 'error';

interface UsePcgwDataReturn {
  cargoData: PcgwCargoData | null;
  scrapedData: PcgwScrapedData | null;
  status: PcgwStatus;
  retry: () => void;
}

/**
 * Busca os dados do PCGamingWiki para um jogo específico.
 *
 * Orquestra dois comandos Tauri em paralelo:
 * - `get_or_fetch_pcgw_data`   → Cargo API (PcgwCargoData)
 * - `get_pcgw_scraped_data`    → scraping de wikitext (PcgwScrapedData)
 *
 * Gerencia reset automático ao trocar de jogo via `gameId`, e recuperação
 * quando o `steamAppId` chega depois do mount (race condition comum quando
 * `GameDetails` ainda está carregando).
 */
export function usePcgwData(
  gameId: string,
  steamAppId: string | null | undefined
): UsePcgwDataReturn {
  const [cargoData, setCargoData] = useState<PcgwCargoData | null>(null);
  const [scrapedData, setScrapedData] = useState<PcgwScrapedData | null>(null);
  const [status, setStatus] = useState<PcgwStatus>('idle');

  // Evita atualizar estado após desmonte ou troca de jogo
  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;

    return () => {
      abortRef.current = true;
    };
  }, [gameId]);

  const load = useCallback(async () => {
    if (!steamAppId) {
      setStatus('no_steam_id');

      return;
    }

    setStatus('loading');

    try {
      const [cargo, scraped] = await Promise.all([
        invoke<PcgwCargoData | null>('get_or_fetch_pcgw_data', { steamAppId }),
        invoke<PcgwScrapedData | null>('get_pcgw_scraped_data', { steamAppId }),
      ]);

      if (abortRef.current) return;

      if (!cargo && !scraped) {
        setStatus('not_found');

        return;
      }

      setCargoData(cargo);
      setScrapedData(scraped);
      setStatus('success');
    } catch {
      if (!abortRef.current) setStatus('error');
    }
  }, [steamAppId]);

  // 1. Reset ao trocar de jogo
  useEffect(() => {
    setCargoData(null);
    setScrapedData(null);
    setStatus('idle');
  }, [gameId]);

  // 2. Carrega quando idle (caminho normal)
  useEffect(() => {
    if (status === 'idle') load();
  }, [status, load]);

  // 3. Recupera se steamAppId chegou depois do mount
  useEffect(() => {
    if (steamAppId && status === 'no_steam_id') load();
  }, [steamAppId, status, load]);

  return {
    cargoData,
    scrapedData,
    status,
    retry: () => setStatus('idle'),
  };
}
