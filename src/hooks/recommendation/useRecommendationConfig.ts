import { Store } from '@tauri-apps/plugin-store';
import { useCallback, useEffect, useState } from 'react';

import { RecommendationConfig } from '@/types/recommendation';

const STORE_FILENAME = 'recommendation.store';

/**
 * Configuração padrão do sistema de recomendação
 */
const DEFAULT_CONFIG: RecommendationConfig = {
  content_weight: 0.65,
  collaborative_weight: 0.35,
  age_decay: 0.95,
  favor_series: true,
};

/**
 * Hook para gerenciar configurações do sistema de recomendação.
 *
 * Permite ajustar:
 * - Pesos entre Content-Based e Collaborative Filtering
 * - Fator de decaimento por idade do jogo
 * - Preferência por jogos de séries conhecidas
 *
 * As configurações são persistidas localmente usando Tauri Store.
 *
 * @returns Objeto com configuração atual e função de atualização
 */
export function useRecommendationConfig() {
  const [config, setConfig] = useState<RecommendationConfig>(DEFAULT_CONFIG);
  const [ready, setReady] = useState(false);

  // Carregar configuração do store
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const store = await Store.load(STORE_FILENAME);
        const savedConfig =
          await store.get<RecommendationConfig>('user_config');

        if (savedConfig) {
          setConfig(savedConfig);
        }
      } catch (e) {
        console.warn('Erro ao carregar config:', e);
      } finally {
        setReady(true);
      }
    };

    loadConfig();
  }, []);

  /**
   * Atualiza a configuração e persiste
   */
  const updateConfig = useCallback(async (newConfig: RecommendationConfig) => {
    setConfig(newConfig);

    try {
      const store = await Store.load(STORE_FILENAME);
      await store.set('user_config', newConfig);
      await store.save();
    } catch (e) {
      console.error('Erro ao salvar config:', e);
    }
  }, []);

  /**
   * Reseta para configuração padrão
   */
  const resetConfig = useCallback(async () => {
    setConfig(DEFAULT_CONFIG);

    try {
      const store = await Store.load(STORE_FILENAME);
      await store.set('user_config', DEFAULT_CONFIG);
      await store.save();
    } catch (e) {
      console.error('Erro ao resetar config:', e);
    }
  }, []);

  return {
    config,
    ready,
    updateConfig,
    resetConfig,
  };
}
