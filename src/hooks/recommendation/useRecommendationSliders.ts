import { useCallback, useEffect, useState } from 'react';

import { RecommendationConfig } from '@/types/recommendation';

/**
 * Hook para gerenciar sliders de configuração de recomendação.
 * Converte valores entre formato interno (0.0-1.0) e formato de slider (0-100).
 *
 * @param config - Configuração atual de recomendação
 * @param updateConfig - Função para atualizar a configuração
 *
 * @returns Objeto com valores dos sliders e handlers
 */
export function useRecommendationSliders(
  config: RecommendationConfig,
  updateConfig: (config: RecommendationConfig) => void
) {
  // Estado local para sliders (0-100)
  const [weights, setWeights] = useState(50);
  const [decay, setDecay] = useState(95);

  // Sincroniza estado local quando a config carrega
  useEffect(() => {
    if (config) {
      // Converte pesos (0.0-1.0) para slider (0-100)
      // Usa collaborative_weight como referência
      const total = config.content_weight + config.collaborative_weight;
      const collabShare = (config.collaborative_weight / total) * 100;
      setWeights(Math.round(collabShare));

      // Age decay: 0.90 a 1.00 -> 0-100
      setDecay(Math.round(config.age_decay * 100));
    }
  }, [config]);

  // Handler para slider de pesos
  const handleWeightChange = useCallback(
    (value: number) => {
      setWeights(value);
      const collab = value / 100;
      const content = 1 - collab;

      updateConfig({
        ...config,
        content_weight: Number(content.toFixed(2)),
        collaborative_weight: Number(collab.toFixed(2)),
      });
    },
    [config, updateConfig]
  );

  // Handler para slider de decay
  const handleDecayChange = useCallback(
    (value: number) => {
      setDecay(value);
      updateConfig({
        ...config,
        age_decay: value / 100,
      });
    },
    [config, updateConfig]
  );

  // Handler para toggle de séries
  const handleSeriesToggle = useCallback(
    (checked: boolean) => {
      updateConfig({ ...config, favor_series: checked });
    },
    [config, updateConfig]
  );

  // Texto descritivo para o slider de pesos
  const weightsDescription = useCallback((value: number) => {
    if (value < 30) return 'Focado estritamente no que você joga.';

    if (value > 70) return 'Focado em tendências e descobertas.';

    return 'Equilíbrio entre gosto pessoal e tendências.';
  }, []);

  // Texto descritivo para o slider de decay
  const decayDescription = useCallback((value: number) => {
    return value === 100
      ? 'Mesmo peso de lançamentos.'
      : 'Jogos antigos perdem relevância.';
  }, []);

  return {
    weights,
    decay,
    handleWeightChange,
    handleDecayChange,
    handleSeriesToggle,
    weightsDescription,
    decayDescription,
  };
}
