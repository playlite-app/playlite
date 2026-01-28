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

  // Carrega filtros do localStorage na inicialização
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      return saved ? JSON.parse(saved) : DEFAULT_PLATFORMS;
    } catch {
      return DEFAULT_PLATFORMS;
    }
  });

  // Persiste filtros no localStorage sempre que mudam
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedPlatforms));
    } catch (error) {
      console.error('Erro ao salvar filtros:', error);
    }
  }, [selectedPlatforms]);

  // Carrega Jogos Grátis
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

  // Filtra giveaways pelas plataformas selecionadas
  const filteredGiveaways = useMemo(() => {
    return giveaways.filter(game => {
      return selectedPlatforms.some(platform =>
        game.platforms.includes(platform)
      );
    });
  }, [giveaways, selectedPlatforms]);

  // Handler para alternar filtros
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
