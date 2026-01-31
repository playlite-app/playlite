import { invoke } from '@tauri-apps/api/core';
import { useEffect, useMemo, useState } from 'react';

import { Giveaway } from '@/types';

const STORAGE_KEY = 'trending_platform_filters';

const DEFAULT_PLATFORMS = [
  'Steam',
  'Epic Games Store',
  'Prime Gaming',
  'GOG',
  'Ubisoft',
];

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
export function useGiveaways() {
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Busca dados (O backend agora retorna Cache se estiver offline)
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await invoke<Giveaway[]>('get_active_giveaways');
        setGiveaways(data);
      } catch (error) {
        console.error('Erro ao buscar jogos grátis:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Lógica de Filtragem: Plataforma + Validade (Novo)
  const filteredGiveaways = useMemo(() => {
    const now = new Date();

    return giveaways.filter(game => {
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
    });
  }, [giveaways, selectedPlatforms]);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  return {
    giveaways,
    filteredGiveaways, // Agora retorna apenas jogos VÁLIDOS
    loading,
    selectedPlatforms,
    togglePlatform,
  };
}
