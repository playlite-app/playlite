import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react';

import { Game, Giveaway, RawgGame, UserPreferenceVector } from '@/types';

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

  // Cache de sessao (offline-first no backend)
  trendingFetchedAt: number | null;
  setTrendingFetchedAt: (value: number | null) => void;
  upcomingCache: RawgGame[];
  setUpcomingCache: (games: RawgGame[]) => void;
  upcomingFetchedAt: number | null;
  setUpcomingFetchedAt: (value: number | null) => void;
  giveawaysCache: Giveaway[];
  setGiveawaysCache: (games: Giveaway[]) => void;
  giveawaysFetchedAt: number | null;
  setGiveawaysFetchedAt: (value: number | null) => void;

  // Updater
  enableUpdaterChecks: boolean;
  setEnableUpdaterChecks: (value: boolean) => void;

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

  const [trendingFetchedAt, setTrendingFetchedAt] = useState<number | null>(
    null
  );
  const [upcomingCache, setUpcomingCache] = useState<RawgGame[]>([]);
  const [upcomingFetchedAt, setUpcomingFetchedAt] = useState<number | null>(
    null
  );
  const [giveawaysCache, setGiveawaysCache] = useState<Giveaway[]>([]);
  const [giveawaysFetchedAt, setGiveawaysFetchedAt] = useState<number | null>(
    null
  );

  const [enableUpdaterChecks, setEnableUpdaterChecks] = useState(true);

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
      trendingFetchedAt,
      setTrendingFetchedAt,
      upcomingCache,
      setUpcomingCache,
      upcomingFetchedAt,
      setUpcomingFetchedAt,
      giveawaysCache,
      setGiveawaysCache,
      giveawaysFetchedAt,
      setGiveawaysFetchedAt,
      enableUpdaterChecks,
      setEnableUpdaterChecks,
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
      trendingFetchedAt,
      upcomingCache,
      upcomingFetchedAt,
      giveawaysCache,
      giveawaysFetchedAt,
      enableUpdaterChecks,
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
