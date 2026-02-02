import { invoke } from '@tauri-apps/api/core';
import { useEffect, useMemo, useState } from 'react';

import { calculateGiveawayAffinity } from '@/hooks';
import { useNetworkStatus } from '@/hooks/common';
import { Giveaway, UserPreferenceVector } from '@/types';

export interface GiveawayWithAffinity extends Giveaway {
  affinityData: ReturnType<typeof calculateGiveawayAffinity>;
}

const STORAGE_KEY = 'trending_platform_filters';

const DEFAULT_PLATFORMS = [
  'Steam',
  'Epic Games Store',
  'Prime Gaming',
  'GOG',
  'Ubisoft',
];

const GIVEAWAYS_TTL_MS = 30 * 60 * 1000; // 30 minutos

interface UseGiveawaysOptions {
  cachedGiveaways: Giveaway[];
  setCachedGiveaways: (games: Giveaway[]) => void;
  cachedFetchedAt: number | null;
  setCachedFetchedAt: (value: number | null) => void;
}

/**
 * Hook para gerenciar jogos grátis (giveaways) e filtros de plataforma.
 * Persiste filtros selecionados no localStorage.
 *
 * @returns {Object} Estado e funções para gerenciar giveaways
 *   - giveaways: Lista de todos os giveaways ativos
 *   - filteredGiveaways: Giveaways filtrados pelas plataformas selecionadas
 *   - loading: Estado de carregamento
 *   - selectedPlatforms: Plataformas atualmente selecionadas
 *   - togglePlatform: Função para alternar seleção de plataforma
 */
export function useGiveaways(
  profile: UserPreferenceVector | null,
  options?: UseGiveawaysOptions
) {
  const [giveaways, setGiveaways] = useState<Giveaway[]>(
    options?.cachedGiveaways ?? []
  );
  const [loading, setLoading] = useState(true);

  const isOnline = useNetworkStatus();

  // Carrega filtros
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      return saved ? JSON.parse(saved) : DEFAULT_PLATFORMS;
    } catch {
      return DEFAULT_PLATFORMS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedPlatforms));
    } catch (error) {
      console.error('Erro ao salvar filtros:', error);
    }
  }, [selectedPlatforms]);

  useEffect(() => {
    if (options?.cachedGiveaways?.length) {
      setGiveaways(options.cachedGiveaways);
    }
  }, [options?.cachedGiveaways]);

  // Busca dados (O backend retorna Cache se estiver offline)
  useEffect(() => {
    const loadData = async () => {
      const now = Date.now();
      const cacheFresh =
        options?.cachedFetchedAt &&
        now - options.cachedFetchedAt < GIVEAWAYS_TTL_MS;

      if (!isOnline && (options?.cachedGiveaways?.length ?? 0) > 0) {
        setLoading(false);

        return;
      }

      if (cacheFresh) {
        setLoading(false);

        return;
      }

      try {
        const data = await invoke<Giveaway[]>('get_active_giveaways');
        setGiveaways(data);
        options?.setCachedGiveaways(data);
        options?.setCachedFetchedAt(Date.now());
      } catch (error) {
        console.error('Erro ao buscar jogos grátis:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [
    isOnline,
    options?.cachedFetchedAt,
    options?.cachedGiveaways?.length,
    options?.setCachedGiveaways,
    options?.setCachedFetchedAt,
  ]);

  // Lógica de Filtragem: Plataforma + Validade (Novo)
  const filteredGiveaways = useMemo<GiveawayWithAffinity[]>(() => {
    const now = new Date();

    return giveaways
      .filter(game => {
        // 1. Filtro de Validade (Remove expirados do cache)
        if (game.end_date) {
          const endDate = new Date(game.end_date);

          // Se a data de término for menor que agora, o jogo já expirou
          if (endDate < now) return false;
        }

        // 2. Filtro de Plataforma
        return selectedPlatforms.some(platform =>
          game.platforms.includes(platform)
        );
      })
      .map(game => ({
        ...game,
        affinityData: calculateGiveawayAffinity(game, profile),
      }))
      .sort((a, b) => b.affinityData.affinity - a.affinityData.affinity); // Ordena por afinidade
  }, [giveaways, selectedPlatforms, profile]);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  return {
    giveaways,
    filteredGiveaways,
    loading,
    selectedPlatforms,
    togglePlatform,
  };
}
