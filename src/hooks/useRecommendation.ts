import { invoke } from '@tauri-apps/api/core';
import { Store } from '@tauri-apps/plugin-store';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Game, UserPreferenceVector } from '@/types';
import {
  RecommendationConfig,
  RecommendationReason,
  RecommendedGame,
} from '@/types/recommendation';

// Nome do arquivo de persistência
const STORE_FILENAME = 'recommendation.store';

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
 * Hook para gerenciar o sistema de recomendação de jogos.
 * Suporta abordagens Content-Based, Collaborative Filtering e Híbrida.
 * Inclui persistência local para blacklist de jogos ignorados e configurações do usuário.
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
  // Estados de dados
  const [profile, setProfile] = useState<UserPreferenceVector | null>(
    profileCache || null
  );
  const [recommendations, setRecommendations] = useState<RecommendedGame[]>([]);
  const [collaborativeRecs, setCollaborativeRecs] = useState<RecommendedGame[]>(
    []
  );
  const [hybridRecs, setHybridRecs] = useState<RecommendedGame[]>([]);

  // Estados de controle
  const [ignoredIds, setIgnoredIds] = useState<string[]>([]);
  const [config, setConfig] = useState<RecommendationConfig>({
    content_weight: 0.65,
    collaborative_weight: 0.35,
    age_decay: 0.95,
    favor_series: true,
  });

  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(!profileCache);
  const [storeReady, setStoreReady] = useState(false);

  // Ref para prevenir race conditions
  const isRefreshingRef = useRef(false);

  // 1. Inicializar Store (Carregar Blacklist e Configs)
  useEffect(() => {
    const initStore = async () => {
      try {
        const store = await Store.load(STORE_FILENAME);
        const savedIgnored = await store.get<string[]>('ignored_ids');

        if (savedIgnored) setIgnoredIds(savedIgnored);

        const savedConfig =
          await store.get<RecommendationConfig>('user_config');

        if (savedConfig) setConfig(savedConfig);
      } catch (e) {
        console.warn('Store de recomendação não encontrada ou erro:', e);
      } finally {
        setStoreReady(true);
      }
    };
    initStore();
  }, []);

  // 2. Carregar Perfil
  useEffect(() => {
    if (profileCache) {
      setProfile(profileCache);
      setLoadingProfile(false);

      return;
    }

    if (!storeReady) return;

    async function loadProfile() {
      setLoadingProfile(true);

      try {
        const data = await invoke<UserPreferenceVector>('get_user_profile');
        setProfile(data);

        if (setProfileCache) setProfileCache(data);
      } catch (error) {
        console.error('Falha ao carregar perfil:', error);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();
  }, [profileCache, setProfileCache, storeReady]);

  // 3. Buscar Recomendações
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
        const res = await invoke<GameRecommendationResult[]>(
          'recommend_from_library',
          {
            minPlaytime: contentBasedParams.minPlaytime,
            maxPlaytime: contentBasedParams.maxPlaytime,
            limit: contentBasedParams.limit,
          }
        );

        // Filtro Cliente: ignora Blacklist
        const mapped = mapToGame(res).filter(g => !ignoredIds.includes(g.id));
        setRecommendations(mapped);
      }

      // B. Collaborative
      if (enableCollaborative) {
        try {
          const res = await invoke<GameRecommendationResult[]>(
            'recommend_collaborative_library',
            {
              minPlaytime: collaborativeParams.minPlaytime,
              maxPlaytime: collaborativeParams.maxPlaytime,
              limit: collaborativeParams.limit,
            }
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
    // Deps profundas dos params
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

  // === AÇÕES DE FEEDBACK ===

  /**
   * Marca jogo como "Não Útil" e remove de todas as listas visualmente
   */
  const markAsNotUseful = useCallback(
    async (gameId: string) => {
      // 1. Optimistic Update (Remove da UI instantaneamente)
      setRecommendations(prev => prev.filter(g => g.id !== gameId));
      setCollaborativeRecs(prev => prev.filter(g => g.id !== gameId));
      setHybridRecs(prev => prev.filter(g => g.id !== gameId));

      // 2. Atualiza estado e persiste
      const newIgnored = [...ignoredIds, gameId];
      setIgnoredIds(newIgnored);

      try {
        const store = await Store.load(STORE_FILENAME);
        await store.set('ignored_ids', newIgnored);
        await store.save();
      } catch (e) {
        console.error('Erro ao salvar blacklist:', e);
      }
    },
    [ignoredIds]
  );

  /**
   * Reseta todo o feedback negativo (Limpa blacklist)
   */
  const resetFeedback = useCallback(async () => {
    setIgnoredIds([]); // Limpa estado local

    try {
      const store = await Store.load(STORE_FILENAME);
      await store.set('ignored_ids', []);
      await store.save();
      refreshRecommendations(); // Força recarga do backend
    } catch (e) {
      console.error('Erro ao resetar feedback:', e);
    }
  }, [refreshRecommendations]);

  /**
   * Atualiza configurações de pesos
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
  };
}
