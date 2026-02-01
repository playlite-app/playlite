import { Moon, Plus, Search, Settings, Sun } from 'lucide-react';
import { useState } from 'react';

import { AdultFilterToggle } from '@/components/layout';
import { QuickSettingsModal } from '@/components/modals/QuickSettingsModal';
import { Button } from '@/components/ui/button';
import { useHeaderState, useRecommendationAnalysis, useTheme } from '@/hooks';

interface HeaderProps {
  onAddGame: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  activeSection: string;
  hideAdult: boolean;
  onToggleAdultFilter: () => void;
  onCheckUpdates: () => void;
}

export default function Header({
  onAddGame,
  searchTerm,
  onSearchChange,
  activeSection,
  hideAdult,
  onToggleAdultFilter,
  onCheckUpdates,
}: HeaderProps) {
  const { isDark, toggleTheme } = useTheme();
  const { isSearchable, searchPlaceholder, searchAriaLabel } =
    useHeaderState(activeSection);

  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);

  // Hook para gerenciar análises de recomendação
  const { analysisStatus, generateRecommendationAnalysis } =
    useRecommendationAnalysis();

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 border-border sticky top-0 z-50 flex h-16 items-center justify-between gap-4 border-b px-4 backdrop-blur md:px-6">
      {/* Search Bar */}
      <div className="max-w-xl flex-1 transition-opacity duration-200">
        <div className="group relative">
          <Search
            className={`absolute top-1/2 left-3 -translate-y-1/2 transition-colors ${
              isSearchable
                ? 'text-muted-foreground group-focus-within:text-primary'
                : 'text-muted-foreground/40'
            }`}
            size={18}
          />
          <input
            type="text"
            disabled={!isSearchable}
            placeholder={searchPlaceholder}
            aria-label={searchAriaLabel}
            value={isSearchable ? searchTerm : ''}
            onChange={e => onSearchChange(e.target.value)}
            className={`h-9 w-full rounded-md border py-2 pr-4 pl-9 text-sm transition-all ${
              isSearchable
                ? 'bg-muted/50 hover:bg-muted focus:bg-background focus:border-primary focus:ring-primary/20 text-foreground placeholder:text-muted-foreground border-transparent focus:ring-1 focus:outline-none'
                : 'bg-muted/20 text-muted-foreground placeholder:text-muted-foreground/40 cursor-not-allowed border-transparent'
            } `}
          />
        </div>
      </div>

      {/* Status de Análise */}
      {analysisStatus && (
        <div className="text-muted-foreground animate-pulse text-xs">
          {analysisStatus}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Botão de Adicionar Jogo */}
        <Button
          onClick={onAddGame}
          size="sm"
          className="shrink-0 px-3 md:px-4"
          title="Adicionar Jogo"
        >
          <Plus size={18} />
          <span className="ml-1 hidden md:inline">Adicionar</span>
        </Button>

        {/* Botão de Filtro Adulto (Só aparece em telas de listagem) */}
        {isSearchable && (
          <AdultFilterToggle
            hideAdult={hideAdult}
            onToggle={onToggleAdultFilter}
          />
        )}

        {/* Quick Settings */}
        <Button
          onClick={() => setIsQuickSettingsOpen(true)}
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground shrink-0"
          title="Configurações Rápidas"
        >
          <Settings size={18} />
        </Button>

        {/* Theme Toggle */}
        <Button
          onClick={toggleTheme}
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground shrink-0"
          title="Alternar tema"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
      </div>

      <QuickSettingsModal
        open={isQuickSettingsOpen}
        onClose={() => setIsQuickSettingsOpen(false)}
        onGenerateReport={generateRecommendationAnalysis}
        onCheckUpdates={onCheckUpdates}
      />
    </header>
  );
}
