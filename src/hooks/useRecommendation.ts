import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';

import { UserProfile } from '@/types';

interface Genre {
  name: string;
}

interface UseRecommendationProps {
  profileCache?: UserProfile | null;
  setProfileCache?: (profile: UserProfile) => void;
}

/**
 * Gerencia sistema de recomendações baseado no perfil de gêneros do usuário.
 * Busca perfil do backend (Rust) e fornece função de scoring.
 *
 * @param props.profileCache - Perfil em cache (evita requisição)
 * @param props.setProfileCache - Callback para salvar perfil em cache global
 * @returns Objeto com:
 *   - profile: Perfil com topGenres ordenados por score
 *   - loading: Estado da requisição
 *   - calculateAffinity: Função que calcula score de compatibilidade
 */
export function useRecommendation({
  profileCache,
  setProfileCache,
}: UseRecommendationProps = {}) {
  // Inicia com o cache se existir
  const [profile, setProfile] = useState<UserProfile | null>(
    profileCache || null
  );
  const [loading, setLoading] = useState(!profileCache);

  useEffect(() => {
    if (profileCache) {
      setLoading(false);

      return;
    }

    async function loadProfile() {
      setLoading(true);

      try {
        const data = await invoke<UserProfile>('get_user_profile');
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
  }, [profileCache]);

  /**
   * Calcula pontuação de afinidade somando scores dos gêneros em comum.
   *
   * @param gameGenres - Array de objetos {name: string} do jogo
   * @returns Score total (quanto maior, mais recomendado)
   * @example
   * calculateAffinity([{name: 'Action'}, {name: 'RPG'}]) // => 150
   */
  const calculateAffinity = (gameGenres: Genre[]) => {
    if (!profile || !gameGenres) return 0;

    let totalScore = 0;
    gameGenres.forEach(g => {
      // Busca se o gênero do jogo existe no perfil do usuário (case insensitive)
      const userGenre = profile.topGenres.find(
        ug => ug.name.toLowerCase() === g.name.toLowerCase()
      );

      if (userGenre) {
        totalScore += userGenre.score;
      }
    });

    return totalScore;
  };

  return { profile, loading, calculateAffinity };
}
