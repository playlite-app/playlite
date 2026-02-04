import { invoke } from '@tauri-apps/api/core';
import { useEffect, useMemo } from 'react';
import { toast, Toaster } from 'sonner';

import AddGame from '@/dialogs/AddGame.tsx';
import { useDebounce, useGameDetails } from '@/hooks';
import { UpdateProvider } from '@/providers/UpdateProvider.tsx';
import { Game } from '@/types';
import GameWindow from '@/windows/GameWindow/GameWindow.tsx';

import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
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

  // Updater manual: sob demanda apenas
  const handleCheckUpdates = async () => {
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();

      if (update?.available) {
        toast.info(`Nova versão disponível: ${update.version}`, {
          description: 'Clique para atualizar agora',
          duration: 10000,
        });
      } else {
        toast.success('Você já está na versão mais recente!');
      }
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      toast.error('Não foi possível verificar atualizações');
    }
  };

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
            trendingFetchedAt={trendingFetchedAt}
            setTrendingFetchedAt={setTrendingFetchedAt}
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
            cachedFetchedAt={trendingFetchedAt}
            setCachedFetchedAt={setTrendingFetchedAt}
            upcomingCache={upcomingCache}
            setUpcomingCache={setUpcomingCache}
            upcomingFetchedAt={upcomingFetchedAt}
            setUpcomingFetchedAt={setUpcomingFetchedAt}
            giveawaysCache={giveawaysCache}
            setGiveawaysCache={setGiveawaysCache}
            giveawaysFetchedAt={giveawaysFetchedAt}
            setGiveawaysFetchedAt={setGiveawaysFetchedAt}
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
          onCheckUpdates={handleCheckUpdates}
        />
        <ErrorBoundary>{renderContent()}</ErrorBoundary>
      </main>
      <ErrorBoundary>
        <AddGame
          isOpen={isAddModalOpen}
          onClose={closeAddModal}
          onSave={handleSaveGameWrapper}
          gameToEdit={gameToEdit}
        />
        <GameWindow
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
    </div>
  );
}

export default function App() {
  return (
    <ConfirmProvider>
      <GameLibraryProvider>
        <UIProvider>
          <UpdateProvider>
            <AppContent />
          </UpdateProvider>
        </UIProvider>
      </GameLibraryProvider>
    </ConfirmProvider>
  );
}
