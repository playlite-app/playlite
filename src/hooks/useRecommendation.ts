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
  const [error, setError] = useState<string | null>(null);

  // 1. Carregar Perfil - ATUALIZADO: usa get_user_profile_formatted
  useEffect(() => {
    if (profileCache) {
      setLoading(false);
      return;
    }

    async function loadProfile() {
      setLoading(true);

      try {
        // Usa o novo comando que retorna formato amigável
        const data = await invoke<UserPreferenceVector>(
          'get_user_profile_formatted'
        );
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
      const results = await invoke<GameRecommendationResult[]>(
        'recommend_from_library',
        {
          minPlaytime: 0,
          maxPlaytime: 300, // 5 horas
          limit: 10,
        }
      );

      const mapped = results
        .map(rec => allGames.find(g => g.id === rec.game_id))
        .filter((g): g is Game => !!g);

      setRecommendations(mapped);
    } catch (error) {
      console.error('Erro ao buscar recomendações:', error);
      setError('Erro ao buscar recomendações');
      setRecommendations([]);
    } finally {
      setLoadingRecommendations(false);
    }
  }, [allGames]);

  useEffect(() => {
    refreshRecommendations();
  }, [refreshRecommendations]);

  return {
    profile,
    loading,
    recommendations,
    loadingRecommendations,
    error,
  };
}
