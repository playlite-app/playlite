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
}

export function useRecommendation({
  profileCache,
  setProfileCache,
  allGames = [],
}: UseRecommendationProps = {}) {
  const [profile, setProfile] = useState<UserPreferenceVector | null>(
    profileCache || null
  );

  const [recommendations, setRecommendations] = useState<Game[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [loading, setLoading] = useState(!profileCache);

  // 1. Carregar Perfil
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

    try {
      const results = await invoke<GameRecommendationResult[]>(
        'recommend_from_library',
        {
          minPlaytime: 0,
          maxPlaytime: 300,
          limit: 10,
        }
      );

      const mapped = results
        .map(rec => allGames.find(g => g.id === rec.game_id))
        .filter((g): g is Game => !!g);

      setRecommendations(mapped);
    } catch (error) {
      console.error('Erro ao buscar recomendações do backend:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  }, [allGames.length]);

  useEffect(() => {
    refreshRecommendations();
  }, [refreshRecommendations]);

  return {
    profile,
    loading,
    recommendations,
    loadingRecommendations,
  };
}
