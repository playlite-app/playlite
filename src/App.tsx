import { invoke } from '@tauri-apps/api/core';
import { useEffect, useMemo } from 'react';
import { toast, Toaster } from 'sonner';

import GameDetailsModal from '@/components/game-details/GameDetailsModal.tsx';
import { UpdateManager } from '@/components/update/UpdateManager.tsx';
import { UpdateProvider } from '@/components/update/UpdateProvider.tsx';
import { useDebounce, useGameDetails } from '@/hooks';
import { Game } from '@/types';

import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import AddGameModal from './components/modals/AddGameModal';
import { ErrorBoundary } from './components/wrappers/ErrorBoundary';
import {
  GameLibraryProvider,
  UIProvider,
  useGameLibrary,
  useUI,
} from './contexts';
import Favorites from './pages/Favorites';
import Home from './pages/Home';
import Libraries from './pages/Libraries.tsx';
import Playlist from './pages/Playlist';
import Settings from './pages/Settings';
import Trending from './pages/Trending';
import Wishlist from './pages/Wishlist';
import { ConfirmProvider, useConfirm } from './providers/ConfirmProvider.tsx';

function AppContent() {
  // Contexts
  const { games, refreshGames, saveGame, removeGame, toggleFavorite } =
    useGameLibrary();
  const {
    activeSection,
    setActiveSection,
    searchTerm,
    setSearchTerm,
    isAddModalOpen,
    gameToEdit,
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
  } = useUI();

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { confirm } = useConfirm();

  // Inicia atualização em background de reviews e preços
  useEffect(() => {
    invoke('check_and_refresh_background').catch(err => {
      console.error('Erro ao iniciar atualização em background:', err);
    });
  }, []);

  // Selected game memo
  const selectedGame = useMemo(
    () => games.find(g => g.id === selectedGameId) || null,
    [games, selectedGameId]
  );

  const { details, loading, siblings, refresh } = useGameDetails(
    selectedGame,
    games
  );

  // Handlers
  const handleSettingsUpdate = () => {
    refreshGames();
    setTrendingCache([]);
    setTrendingKey(k => k + 1);
  };

  const handleSaveGameWrapper = async (data: Partial<Game>) => {
    try {
      await saveGame(data, gameToEdit?.id);
      closeAddModal();
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

  // Props comuns
  const commonGameActions = {
    onToggleFavorite: toggleFavorite,
    onGameClick: handleGameClick,
    onDeleteGame: handleDeleteWrapper,
    onEditGame: openEditModal,
  };

  // Roteamento
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
        return <Wishlist searchTerm={debouncedSearchTerm} />;
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
          isOpen={isAddModalOpen}
          onClose={closeAddModal}
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
          onRefresh={refresh}
        />
      </ErrorBoundary>
      <Toaster />
      <UpdateManager />
    </div>
  );
}

export default function App() {
  return (
    <UpdateProvider>
      <ConfirmProvider>
        <GameLibraryProvider>
          <UIProvider>
            <AppContent />
          </UIProvider>
        </GameLibraryProvider>
      </ConfirmProvider>
    </UpdateProvider>
  );
}
