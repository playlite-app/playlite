import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import { Game, RawgGame, UserPreferenceVector } from '@/types';

interface UIContextType {
  // Navegação
  activeSection: string;
  setActiveSection: (section: string) => void;

  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;

  // Modals
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  gameToEdit: Game | null;
  setGameToEdit: (game: Game | null) => void;

  // Game Details
  selectedGameId: string | null;
  setSelectedGameId: (id: string | null) => void;

  // Filtros
  hideAdult: boolean;
  toggleAdultFilter: () => void;

  // Cache (Trending e Profile)
  trendingCache: RawgGame[];
  setTrendingCache: (games: RawgGame[]) => void;
  trendingKey: number;
  setTrendingKey: (key: number | ((prev: number) => number)) => void;
  profileCache: UserPreferenceVector | null;
  setProfileCache: (profile: UserPreferenceVector | null) => void;

  // Helpers
  openAddModal: () => void;
  openEditModal: (game: Game) => void;
  closeAddModal: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  // Navegação
  const [activeSection, setActiveSection] = useState('home');

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [gameToEdit, setGameToEdit] = useState<Game | null>(null);

  // Game Details
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  // Filtros
  const [hideAdult, setHideAdult] = useState(() => {
    return localStorage.getItem('playlite_hide_adult') === 'true';
  });

  // Cache
  const [trendingCache, setTrendingCache] = useState<RawgGame[]>([]);
  const [trendingKey, setTrendingKey] = useState(0);
  const [profileCache, setProfileCache] = useState<UserPreferenceVector | null>(
    null
  );

  const toggleAdultFilter = () => {
    const newValue = !hideAdult;
    setHideAdult(newValue);
    localStorage.setItem('playlite_hide_adult', String(newValue));
  };

  const openAddModal = () => {
    setGameToEdit(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (game: Game) => {
    setGameToEdit(game);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setGameToEdit(null);
  };

  const value = useMemo(
    () => ({
      activeSection,
      setActiveSection,
      searchTerm,
      setSearchTerm,
      isAddModalOpen,
      setIsAddModalOpen,
      gameToEdit,
      setGameToEdit,
      selectedGameId,
      setSelectedGameId,
      hideAdult,
      toggleAdultFilter,
      trendingCache,
      setTrendingCache,
      trendingKey,
      setTrendingKey,
      profileCache,
      setProfileCache,
      openAddModal,
      openEditModal,
      closeAddModal,
    }),
    [
      activeSection,
      searchTerm,
      isAddModalOpen,
      gameToEdit,
      selectedGameId,
      hideAdult,
      trendingCache,
      trendingKey,
      profileCache,
    ]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUI() {
  const context = useContext(UIContext);

  if (!context) {
    throw new Error('useUI must be used within UIProvider');
  }

  return context;
}
