import { useEffect, useState } from 'react';

export type AvatarType = 'initial' | 'preset';
export type PresetAvatar = 'dog' | 'cat' | 'fox' | 'bear' | 'rabbit' | 'panda';

export interface UserProfile {
  name: string;
  avatarType: AvatarType;
  avatarData: PresetAvatar | null;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Usuário',
  avatarType: 'initial',
  avatarData: null,
};

const STORAGE_KEY = 'playlite_user_profile';

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  // Carregar perfil do localStorage na inicialização
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setProfile(parsed);
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      }
    }
  }, []);

  // Salvar perfil no localStorage sempre que mudar
  const updateProfile = (updates: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
  };

  // Obter inicial do nome
  const getInitial = () => {
    return profile.name.charAt(0).toUpperCase() || 'U';
  };

  // Obter cor baseada no nome (consistente)
  const getColorFromName = (name: string) => {
    const colors = [
      'from-blue-500 to-purple-600',
      'from-green-500 to-teal-600',
      'from-orange-500 to-red-600',
      'from-pink-500 to-rose-600',
      'from-indigo-500 to-blue-600',
      'from-yellow-500 to-orange-600',
      'from-purple-500 to-pink-600',
      'from-teal-500 to-cyan-600',
    ];

    // Hash simples do nome para escolher cor consistente
    let hash = 0;

    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;

    return colors[index];
  };

  return {
    profile,
    updateProfile,
    getInitial,
    getColorFromName,
  };
};
