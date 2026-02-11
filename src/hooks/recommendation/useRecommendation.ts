import { invoke } from '@tauri-apps/api/core';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  useRecommendationBlacklist,
  useRecommendationConfig,
  useRecommendationProfile,
} from '@/hooks';
import { Game, UserPreferenceVector } from '@/types';
import { RecommendationReason, RecommendedGame } from '@/types/recommendation';

// Estrutura do resultado bruto que vem do Rust
interface GameRecommendationResult {
  game_id: string;
  score: number;
  reason: RecommendationReason;
}

interface UseRecommendationProps {
  profileCache?: UserPreferenceVector | null;
  setProfileCache?: (profile: UserPreferenceVector) => void;
  allGames?: Game[];

  // Flags de ativação
  enableContentBased?: boolean;
  enableCollaborative?: boolean;
  enableHybrid?: boolean;

  // Parâmetros de filtro
  contentBasedParams?: {
    minPlaytime?: number;
    maxPlaytime?: number;
    limit?: number;
  };
  collaborativeParams?: {
    minPlaytime?: number;
    maxPlaytime?: number;
    limit?: number;
  };
  hybridParams?: { minPlaytime?: number; maxPlaytime?: number; limit?: number };
}

/**
 * Hook principal do sistema de recomendação
 *
 * Gerencia recomendações calculadas pelo **backend Rust** usando:
 * - Content-Based Filtering (baseado em gêneros/tags dos jogos do usuário)
 * - Collaborative Filtering (baseado em similaridade com outros usuários)
 * - Hybrid (combinação de ambos)
 *
 * **Complementar:** useGameAffinity (calcula afinidade no frontend para jogos RAWG)
 *
 * Usa hooks menores para melhor organização:
 * - useRecommendationProfile: Gerencia perfil do usuário
 * - useRecommendationBlacklist: Gerencia jogos ignorados
 * - useRecommendationConfig: Gerencia configurações de peso
 *
 * @param profileCache - Perfil de preferências em cache (opcional)
 * @param setProfileCache - Função para atualizar o cache do perfil (opcional)
 * @param allGames - Lista completa de jogos para recomendações
 * @param enableContentBased - Ativa recomendações Content-Based
 * @param enableCollaborative - Ativa recomendações Collaborative Filtering
 * @param enableHybrid - Ativa recomendações Híbridas
 * @param contentBasedParams - Parâmetros de filtro para Content-Based
 * @param collaborativeParams - Parâmetros de filtro para Collaborative Filtering
 * @param hybridParams - Parâmetros de filtro para Híbrido
 *
 * @returns Objeto contendo perfil, listas de recomendações, estados de carregamento e ações de feedback
 */
export function useRecommendation({
  profileCache,
  setProfileCache,
  allGames = [],
  enableContentBased = true,
  enableCollaborative = true,
  enableHybrid = false,
  contentBasedParams = { minPlaytime: 0, maxPlaytime: 300, limit: 10 },
  collaborativeParams = { minPlaytime: 0, maxPlaytime: 120, limit: 10 },
  hybridParams = { minPlaytime: 0, maxPlaytime: 120, limit: 15 },
}: UseRecommendationProps = {}) {
  // === HOOKS MENORES ===

  const { profile, loading: loadingProfile } = useRecommendationProfile({
    profileCache,
    setProfileCache,
  });

  const {
    ignoredIds,
    ready: blacklistReady,
    addToBlacklist,
    clearBlacklist,
  } = useRecommendationBlacklist();

  const {
    config,
    ready: configReady,
    updateConfig,
    toggleAdultFilter,
    setSeriesLimit,
  } = useRecommendationConfig();

  // === ESTADOS LOCAIS ===

  const [recommendations, setRecommendations] = useState<RecommendedGame[]>([]);
  const [collaborativeRecs, setCollaborativeRecs] = useState<RecommendedGame[]>(
    []
  );
  const [hybridRecs, setHybridRecs] = useState<RecommendedGame[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Ref para prevenir race conditions
  const isRefreshingRef = useRef(false);

  // Store ready quando ambos os hooks estão prontos
  const storeReady = blacklistReady && configReady;

  // === BUSCAR RECOMENDAÇÕES ===

  const refreshRecommendations = useCallback(async () => {
    if (allGames.length === 0 || !storeReady || isRefreshingRef.current) return;

    isRefreshingRef.current = true;
    setLoadingRecommendations(true);

    // Helper para transformar dados do Rust em objetos de jogo completos
    const mapToGame = (
      results: GameRecommendationResult[]
    ): RecommendedGame[] => {
      return results
        .map(rec => {
          const game = allGames.find(g => g.id === rec.game_id);

          if (!game) return null;

          return {
            ...game,
            matchScore: rec.score,
            reason: rec.reason,
          } as RecommendedGame;
        })
        .filter((g): g is RecommendedGame => g !== null);
    };

    try {
      // A. Content-Based
      if (enableContentBased) {
        const options = {
          min_playtime: contentBasedParams.minPlaytime,
          max_playtime: contentBasedParams.maxPlaytime,
          limit: contentBasedParams.limit,
          ignored_game_ids: ignoredIds,
          config: config,
        };

        const res = await invoke<GameRecommendationResult[]>(
          'recommend_from_library',
          { options }
        );

        // Filtro Cliente: ignora Blacklist
        const mapped = mapToGame(res).filter(g => !ignoredIds.includes(g.id));
        setRecommendations(mapped);
      }

      // B. Collaborative
      if (enableCollaborative) {
        try {
          const options = {
            min_playtime: collaborativeParams.minPlaytime,
            max_playtime: collaborativeParams.maxPlaytime,
            limit: collaborativeParams.limit,
            ignored_game_ids: ignoredIds,
            config: null,
          };

          const res = await invoke<GameRecommendationResult[]>(
            'recommend_collaborative_library',
            { options }
          );

          // Filtro Cliente: ignora Blacklist
          const mapped = mapToGame(res).filter(g => !ignoredIds.includes(g.id));
          setCollaborativeRecs(mapped);
        } catch (e) {
          console.warn('CF indisponível:', e);
          setCollaborativeRecs([]);
        }
      }

      // C. Híbrido (Para Playlist - Sidebar)
      if (enableHybrid) {
        try {
          const res = await invoke<GameRecommendationResult[]>(
            'recommend_hybrid_library',
            {
              options: {
                min_playtime: hybridParams.minPlaytime,
                max_playtime: hybridParams.maxPlaytime,
                limit: hybridParams.limit,
                ignored_game_ids: ignoredIds, // Remove jogos na blacklist
                config: config,
              },
            }
          );
          setHybridRecs(mapToGame(res));
        } catch (e) {
          console.warn('Híbrido indisponível:', e);
          setHybridRecs([]);
        }
      }
    } catch (error) {
      console.error('Erro geral na recomendação:', error);
    } finally {
      setLoadingRecommendations(false);
      isRefreshingRef.current = false;
    }
  }, [
    allGames,
    storeReady,
    ignoredIds,
    config,
    enableContentBased,
    enableCollaborative,
    enableHybrid,
    contentBasedParams.limit,
    contentBasedParams.maxPlaytime,
    contentBasedParams.minPlaytime,
    collaborativeParams.limit,
    collaborativeParams.maxPlaytime,
    collaborativeParams.minPlaytime,
    hybridParams.limit,
    hybridParams.maxPlaytime,
    hybridParams.minPlaytime,
  ]);

  useEffect(() => {
    refreshRecommendations();
  }, [refreshRecommendations]);

  // Marca jogo como "Não Útil" e remove de todas as listas visualmente
  const markAsNotUseful = useCallback(
    async (gameId: string) => {
      // 1. Optimistic Update (Remove da UI instantaneamente)
      setRecommendations(prev => prev.filter(g => g.id !== gameId));
      setCollaborativeRecs(prev => prev.filter(g => g.id !== gameId));
      setHybridRecs(prev => prev.filter(g => g.id !== gameId));

      // 2. Atualiza blacklist (hook gerencia persistência)
      await addToBlacklist(gameId);
    },
    [addToBlacklist]
  );

  // Reseta feedback negativo (Limpa blacklist)
  const resetFeedback = useCallback(async () => {
    await clearBlacklist();
    refreshRecommendations(); // Força recarga do backend
  }, [clearBlacklist, refreshRecommendations]);

  return {
    profile,
    loading: loadingProfile || !storeReady,
    loadingRecommendations,

    // Listas de Jogos
    recommendations, // Content-Based
    collaborativeRecs, // Collaborative
    hybridRecs, // Hybrid
    ignoredIds, // Blacklist

    // Ações e Config
    markAsNotUseful,
    updateConfig,
    config,
    resetFeedback,
    refreshRecommendations,
    toggleAdultFilter,
    setSeriesLimit,
  };
}
