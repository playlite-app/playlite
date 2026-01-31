import { invoke } from '@tauri-apps/api/core';
import { useCallback, useEffect, useState } from 'react';

interface UserPreferences {
  filter_adult_content: boolean;
  series_limit: 'none' | 'moderate' | 'aggressive';
}

/**
 * Hook para gerenciar preferências do usuário relacionadas a recomendações
 *
 * Usa arquivo JSON (Tauri Store pattern) para persistência
 */
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    filter_adult_content: false,
    series_limit: 'moderate',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carregar preferências ao montar
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = useCallback(async () => {
    try {
      const prefs = await invoke<UserPreferences>('get_user_preferences');
      setPreferences(prefs);
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const savePreferences = useCallback(
    async (newPrefs: Partial<UserPreferences>) => {
      setSaving(true);

      try {
        const updated = { ...preferences, ...newPrefs };
        await invoke('save_user_preferences', { preferences: updated });
        setPreferences(updated);

        return true;
      } catch (error) {
        console.error('Erro ao salvar preferências:', error);

        return false;
      } finally {
        setSaving(false);
      }
    },
    [preferences]
  );

  const toggleAdultFilter = useCallback(async () => {
    return savePreferences({
      filter_adult_content: !preferences.filter_adult_content,
    });
  }, [preferences.filter_adult_content, savePreferences]);

  const setSeriesLimit = useCallback(
    async (limit: 'none' | 'moderate' | 'aggressive') => {
      return savePreferences({ series_limit: limit });
    },
    [savePreferences]
  );

  return {
    preferences,
    loading,
    saving,
    toggleAdultFilter,
    setSeriesLimit,
    savePreferences,
  };
}
