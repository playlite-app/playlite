import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';

import { UserPreferenceVector } from '@/types';

interface UseRecommendationProfileProps {
  profileCache?: UserPreferenceVector | null;
  setProfileCache?: (profile: UserPreferenceVector) => void;
}

/**
 * Hook para gerenciar o perfil de preferências do usuário.
 *
 * O perfil contém informações sobre:
 * - Gêneros e tags favoritos
 * - Padrões de tempo de jogo
 * - Preferências de plataforma
 *
 * Busca os dados do backend Rust e mantém cache local.
 *
 * @param profileCache - Perfil em cache (opcional)
 * @param setProfileCache - Função para atualizar o cache (opcional)
 * @returns Objeto com perfil e estado de carregamento
 */
export function useRecommendationProfile({
  profileCache,
  setProfileCache,
}: UseRecommendationProfileProps = {}) {
  const [profile, setProfile] = useState<UserPreferenceVector | null>(
    profileCache || null
  );
  const [loading, setLoading] = useState(!profileCache);

  useEffect(() => {
    // Se já tem cache, usa ele
    if (profileCache) {
      setProfile(profileCache);
      setLoading(false);

      return;
    }

    // Busca do backend
    async function loadProfile() {
      setLoading(true);

      try {
        const data = await invoke<UserPreferenceVector>('get_user_profile');
        setProfile(data);

        if (setProfileCache) {
          setProfileCache(data);
        }
      } catch (error) {
        console.error('Falha ao carregar perfil:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [profileCache, setProfileCache]);

  return {
    profile,
    loading,
  };
}
