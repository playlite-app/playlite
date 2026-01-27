import { invoke } from '@tauri-apps/api/core';
import { useCallback, useEffect, useState } from 'react';

import { Game, UserPreferenceVector } from '@/types';

interface GameRecommendationResult {
  game_id: string;
  score: number;
}

interface UseRecommendationProps {
  profileCache?: UserPreferenceVector | null;
  setProfileCache?: (profile: UserPreferenceVector) => void;
  allGames?: Game[];
  enableContentBased?: boolean; // Habilita recomendações CB
  enableCollaborative?: boolean; // Habilita recomendações CF
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
  enableHybrid?: boolean; // Habilita recomendações híbridas (CB + CF)
  hybridParams?: {
    minPlaytime?: number;
    maxPlaytime?: number;
    limit?: number;
  };
}

export function useRecommendation({
  profileCache,
  setProfileCache,
  allGames = [],
  enableContentBased = true,
  enableCollaborative = true,
  enableHybrid = false,
  contentBasedParams = {
    minPlaytime: 0,
    maxPlaytime: 300,
    limit: 10,
  },
  collaborativeParams = {
    minPlaytime: 0,
    maxPlaytime: 120,
    limit: 10,
  },
  hybridParams = {
    minPlaytime: 0,
    maxPlaytime: 120,
    limit: 15,
  },
}: UseRecommendationProps = {}) {
  const [profile, setProfile] = useState<UserPreferenceVector | null>(
    profileCache || null
  );

  const [recommendations, setRecommendations] = useState<Game[]>([]);
  const [collaborativeRecs, setCollaborativeRecs] = useState<Game[]>([]);
  const [hybridRecs, setHybridRecs] = useState<Game[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [loading, setLoading] = useState(!profileCache);
  const [error, setError] = useState<string | null>(null);

  // 1. Carregar Perfil do Usuário
  useEffect(() => {
    if (profileCache) {
      setLoading(false);

      return;
    }

    async function loadProfile() {
      setLoading(true);

      try {
        const data = await invoke<UserPreferenceVector>('get_user_profile');
        setProfile(data);

        if (setProfileCache) setProfileCache(data);
      } catch (error) {
        console.error('Falha ao carregar perfil:', error);
        setError('Erro ao carregar perfil de recomendações');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [profileCache, setProfileCache]);

  // 2. Buscar Recomendações no Backend
  const refreshRecommendations = useCallback(async () => {
    if (allGames.length === 0) return;

    setLoadingRecommendations(true);
    setError(null);

    try {
      // 1. Recomendação Content-Based (CB) - "Recomendados para você"
      if (enableContentBased) {
        const cbResults = await invoke<GameRecommendationResult[]>(
          'recommend_from_library',
          {
            minPlaytime: contentBasedParams.minPlaytime,
            maxPlaytime: contentBasedParams.maxPlaytime,
            limit: contentBasedParams.limit,
          }
        );

        const mappedCb = cbResults
          .map(rec => allGames.find(g => g.id === rec.game_id))
          .filter((g): g is Game => !!g);

        setRecommendations(mappedCb);
      } else {
        setRecommendations([]);
      }

      // 2. Recomendação Collaborative Filtering (CF) - "Jogadores como você gostaram"
      if (enableCollaborative) {
        try {
          const cfResults = await invoke<GameRecommendationResult[]>(
            'recommend_collaborative_library',
            {
              minPlaytime: collaborativeParams.minPlaytime,
              maxPlaytime: collaborativeParams.maxPlaytime,
              limit: collaborativeParams.limit,
            }
          );

          const mappedCf = cfResults
            .map(rec => allGames.find(g => g.id === rec.game_id))
            .filter((g): g is Game => !!g);

          setCollaborativeRecs(mappedCf);
        } catch (cfError) {
          // CF é opcional - se falhar, apenas loga e mantém vazio
          console.warn('CF não disponível (usando apenas CB):', cfError);
          setCollaborativeRecs([]);
        }
      } else {
        setCollaborativeRecs([]);
      }

      // 3. Recomendação Híbrida
      if (enableHybrid) {
        try {
          const hybridResults = await invoke<GameRecommendationResult[]>(
            'recommend_hybrid_library',
            {
              minPlaytime: hybridParams.minPlaytime,
              maxPlaytime: hybridParams.maxPlaytime,
              limit: hybridParams.limit,
            }
          );

          const mappedHybrid = hybridResults
            .map(rec => allGames.find(g => g.id === rec.game_id))
            .filter((g): g is Game => !!g);

          setHybridRecs(mappedHybrid);
        } catch (hError) {
          console.warn('Híbrido não disponível:', hError);
          setHybridRecs([]);
        }
      } else {
        setHybridRecs([]);
      }
    } catch (error) {
      console.error('Erro ao buscar recomendações:', error);
      setError('Erro ao buscar recomendações');
      setRecommendations([]);
      setCollaborativeRecs([]);
      setHybridRecs([]);
    } finally {
      setLoadingRecommendations(false);
    }
  }, [
    allGames,
    enableContentBased,
    enableCollaborative,
    enableHybrid,
    contentBasedParams.minPlaytime,
    contentBasedParams.maxPlaytime,
    contentBasedParams.limit,
    collaborativeParams.minPlaytime,
    collaborativeParams.maxPlaytime,
    collaborativeParams.limit,
    hybridParams.minPlaytime,
    hybridParams.maxPlaytime,
    hybridParams.limit,
  ]);

  useEffect(() => {
    refreshRecommendations();
  }, [refreshRecommendations]);

  return {
    profile,
    loading,
    recommendations,
    collaborativeRecs,
    hybridRecs,
    loadingRecommendations,
    error,
  };
}
