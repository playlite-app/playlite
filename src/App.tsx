import { useMemo, useState } from 'react';
import { toast, Toaster } from 'sonner';

import { Game, RawgGame, UserPreferenceVector } from '@/types';

import AddGameModal from './components/AddGameModal';
import GameDetailsModal from './components/game-details/GameDetailsModal';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { ErrorBoundary } from './components/wrappers/ErrorBoundary';
import { useDebounce } from './hooks/useDebounce';
import { useGameDetails } from './hooks/useGameDetails';
import { useLibraries } from './hooks/useLibraries.ts';
import Favorites from './pages/Favorites';
import Home from './pages/Home';
import Libraries from './pages/Libraries.tsx';
import Playlist from './pages/Playlist';
import Settings from './pages/Settings';
import Trending from './pages/Trending';
import Wishlist from './pages/Wishlist';
import { ConfirmProvider, useConfirm } from './providers/ConfirmProvider.tsx';

function AppContent() {
  // Estado Global de Jogos e UI
  const { games, refreshGames, saveGame, removeGame, toggleFavorite } =
    useLibraries();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [activeSection, setActiveSection] = useState('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gameToEdit, setGameToEdit] = useState<Game | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const selectedGame = useMemo(
    () => games.find(g => g.id === selectedGameId) || null,
    [games, selectedGameId]
  );
  const [trendingCache, setTrendingCache] = useState<RawgGame[]>([]);
  const [trendingKey, setTrendingKey] = useState(0);
  const [profileCache, setProfileCache] = useState<UserPreferenceVector | null>(
    null
  );
  const [hideAdult, setHideAdult] = useState(() => {
    return localStorage.getItem('playlite_hide_adult') === 'true';
  });

  const toggleAdultFilter = () => {
    const newValue = !hideAdult;
    setHideAdult(newValue);
    localStorage.setItem('playlite_hide_adult', String(newValue));
  };

  const { confirm } = useConfirm();

  const { details, loading, siblings } = useGameDetails(selectedGame, games);

  // Handlers de UI e Ações
  const handleSettingsUpdate = () => {
    refreshGames();
    setTrendingCache([]);
    setTrendingKey(k => k + 1);
  };

  const openAddModal = () => {
    setGameToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (game: Game) => {
    setGameToEdit(game);
    setIsModalOpen(true);
  };

  const handleSaveGameWrapper = async (data: Partial<Game>) => {
    try {
      await saveGame(data, gameToEdit?.id);
      setIsModalOpen(false);
      setGameToEdit(null);
    } catch (e) {
      toast.error('Erro ao salvar: ' + e);
    }
  };

  const handleDeleteWrapper = async (id: string) => {
    const confirmed = await confirm({
      title: 'Excluir Jogo',
      description:
        'Tem certeza que deseja excluir este jogo? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
    });

    if (confirmed) {
      try {
        await removeGame(id);
        toast.success('Jogo excluído com sucesso!');
      } catch {
        toast.error('Erro ao excluir jogo.');
      }
    }
  };

  const handleGameClick = (game: Game) => {
    setSelectedGameId(game.id);
  };

  const handleSwitchGame = (id: string) => {
    setSelectedGameId(id);
  };

  const closeDetails = () => {
    setSelectedGameId(null);
  };

  // Props comuns passadas para as listas de jogos
  const commonGameActions = {
    onToggleFavorite: toggleFavorite,
    onGameClick: handleGameClick,
    onDeleteGame: handleDeleteWrapper,
    onEditGame: openEditModal,
  };

  // Roteamento Simples
  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return (
          <Home
            onChangeTab={setActiveSection}
            games={games}
            trendingCache={trendingCache}
            setTrendingCache={setTrendingCache}
            profileCache={profileCache}
            setProfileCache={setProfileCache}
            onGameClick={handleGameClick}
          />
        );
      case 'libraries':
        return (
          <Libraries
            games={games}
            searchTerm={debouncedSearchTerm}
            hideAdult={hideAdult}
            {...commonGameActions}
          />
        );
      case 'favorites':
        return (
          <Favorites
            games={games}
            searchTerm={debouncedSearchTerm}
            hideAdult={hideAdult}
            {...commonGameActions}
          />
        );
      case 'playlist':
        return (
          <Playlist
            allGames={games}
            onGameClick={handleGameClick}
            profileCache={profileCache}
          />
        );
      case 'trending':
        return (
          <Trending
            key={trendingKey}
            userGames={games}
            onChangeTab={setActiveSection}
            cachedGames={trendingCache}
            setCachedGames={setTrendingCache}
          />
        );
      case 'wishlist':
        return <Wishlist />;
      case 'settings':
        return <Settings onLibraryUpdate={handleSettingsUpdate} />;
      default:
        return <div className="p-10 text-center">Página não encontrada</div>;
    }
  };

  return (
    <div className="bg-background text-foreground flex h-screen overflow-hidden">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        games={games}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <Header
          onAddGame={openAddModal}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          activeSection={activeSection}
          hideAdult={hideAdult}
          onToggleAdultFilter={toggleAdultFilter}
        />
        <ErrorBoundary>{renderContent()}</ErrorBoundary>
      </main>
      <ErrorBoundary>
        <AddGameModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveGameWrapper}
          gameToEdit={gameToEdit}
        />
        <GameDetailsModal
          isOpen={!!selectedGameId}
          onClose={closeDetails}
          game={selectedGame}
          details={details}
          loading={loading}
          siblings={siblings}
          onSwitchGame={handleSwitchGame}
        />
      </ErrorBoundary>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <ConfirmProvider>
      <AppContent />
    </ConfirmProvider>
  );
}
