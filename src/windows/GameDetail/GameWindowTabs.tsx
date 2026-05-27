import { BookOpen, Compass, Play, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Game, GameDetails, GameTab, Tab } from '@/types/game';
import { GameDescription, GameDiscovery } from '@/windows';

// === COMPONENTE DE ABAS ===

interface GameTabsProps {
  activeTab: GameTab;
  onTabChange: (tab: GameTab) => void;
}

export function GameTabs({ activeTab, onTabChange }: GameTabsProps) {
  const tabs: Tab[] = [
    { id: 'description', label: 'Descrição', icon: <BookOpen /> },
    { id: 'discovery', label: 'Descoberta', icon: <Compass /> },
    { id: 'media', label: 'Mídia', icon: <Play /> },
    { id: 'extras', label: 'Extras', icon: <Wrench /> },
  ];

  return (
    <div className="border-border flex items-center gap-1 border-b">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-1 border-b-2 px-4 py-2 text-sm font-medium transition-all duration-150 focus:outline-none ${
            activeTab === tab.id
              ? 'border-primary text-primary bg-primary/5'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border-transparent'
          } `}
        >
          <span
            className={
              activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'
            }
          >
            {tab.icon}
          </span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// === PLACEHOLDERS DAS NOVAS VIEWS ===
// Mova cada um para seu próprio arquivo quando implementar o conteúdo real.

interface PlaceholderProps {
  gameId: string;
}

/**
 * Placeholder — src/windows/game/GameMedia.tsx
 *
 * Conteúdo futuro:
 * - Galeria de screenshots
 * - Player de trailers
 */
export function GameMedia({ gameId }: PlaceholderProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="bg-muted rounded-full p-4">
        <Play />
      </div>
      <p className="text-foreground text-sm font-medium">Mídia</p>
      <p className="text-muted-foreground max-w-xs text-xs">
        Screenshots e trailers via GameBrain — em breve.
      </p>
      {process.env.NODE_ENV === 'development' && (
        <code className="bg-muted text-muted-foreground mt-2 rounded px-2 py-1 text-xs">
          gameId: {gameId}
        </code>
      )}
    </div>
  );
}

/**
 * Placeholder — src/windows/game/GameExtras.tsx
 *
 * Conteúdo futuro:
 * - Dados do PCGamingWiki (localização de saves, suporte a mods, etc.)
 */
export function GameExtras({ gameId }: PlaceholderProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="bg-muted rounded-full p-4">
        <Wrench />
      </div>
      <p className="text-foreground text-sm font-medium">Extras</p>
      <p className="text-muted-foreground max-w-xs text-xs">
        Dados do PCGamingWiki — em breve.
      </p>
      {process.env.NODE_ENV === 'development' && (
        <code className="bg-muted text-muted-foreground mt-2 rounded px-2 py-1 text-xs">
          gameId: {gameId}
        </code>
      )}
    </div>
  );
}

// === COMPONENTE ORQUESTRADOR ===
// Este é o que entra no GameDetail.tsx no lugar do bloco atual da Coluna 2.

interface GameContentTabsProps {
  game: Game;
  details: GameDetails | null;
  loading: boolean;
  isEditing: boolean;
  onDescriptionUpdate: (translated: string) => void;
  // Importar GameEditForm no GameDetail e passar como prop evita
  // acoplamento circular. Alternativa: renderizar o form no próprio GameDetail
  // e só montar este componente quando !isEditing.
}

export function GameContentTabs({
  game,
  details,
  loading,
  isEditing,
  onDescriptionUpdate,
}: GameContentTabsProps) {
  const [activeTab, setActiveTab] = useState<GameTab>('description');

  // Reset para Descrição quando abrir um novo jogo
  useEffect(() => {
    setActiveTab('description');
  }, [game.id]);

  // Quando entrar em modo edição, força a aba Descrição
  useEffect(() => {
    if (isEditing) setActiveTab('description');
  }, [isEditing]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Só mostra as abas fora do modo edição */}
      {!isEditing && (
        <GameTabs activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {/* Conteúdo da aba ativa */}
      <div className="custom-scrollbar flex-1 overflow-y-auto p-6 lg:p-10">
        {activeTab === 'description' && (
          <GameDescription
            gameId={game.id}
            details={details}
            loading={loading}
            onDescriptionUpdate={onDescriptionUpdate}
          />
        )}
        {activeTab === 'discovery' && !isEditing && (
          <GameDiscovery game={game} />
        )}
        {activeTab === 'media' && !isEditing && <GameMedia gameId={game.id} />}
        {activeTab === 'extras' && !isEditing && (
          <GameExtras gameId={game.id} />
        )}
      </div>
    </div>
  );
}
