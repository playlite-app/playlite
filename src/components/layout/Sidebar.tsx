import {
  Gamepad2,
  Heart,
  Home,
  Library,
  Settings,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

import { avatarComponents } from '@/components/profile/AvatarIcons.tsx';
import { useUserProfile } from '@/hooks/user';
import { Game } from '@/types';

import ProfileModal from '../profile/ProfileModal';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  games: Game[];
}

const menuItems = [
  { id: 'home', label: 'Início', icon: Home },
  { id: 'libraries', label: 'Biblioteca', icon: Library },
  { id: 'favorites', label: 'Favoritos', icon: Heart },
  { id: 'playlist', label: 'Playlist', icon: Gamepad2 },
  { id: 'trending', label: 'Em Alta', icon: TrendingUp },
  { id: 'wishlist', label: 'Lista de Desejos', icon: ShoppingCart },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export default function Sidebar({
  activeSection,
  onSectionChange,
  games,
}: SidebarProps) {
  const { profile, getInitial, getColorFromName } = useUserProfile();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const renderAvatar = () => {
    if (profile.avatarType === 'preset' && profile.avatarData) {
      const AvatarComponent = avatarComponents[profile.avatarData];

      return (
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full shadow-sm">
          <AvatarComponent />
        </div>
      );
    }

    // Fallback para inicial
    return (
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br font-bold text-white shadow-sm ${getColorFromName(
          profile.name
        )}`}
      >
        {getInitial()}
      </div>
    );
  };

  return (
    <>
      <aside className="bg-sidebar border-sidebar-border flex h-screen w-17.5 flex-col border-r transition-all duration-300 lg:w-64">
        {/* Header / Logo */}
        <div className="border-sidebar-border flex h-16 items-center justify-center border-b lg:justify-start lg:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/app-icon.png"
              alt="Logo"
              className="h-8 w-8 shrink-0 object-contain"
            />
            <h1 className="text-sidebar-foreground hidden truncate text-xl font-bold lg:block">
              Playlite
            </h1>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-2 p-2 lg:p-4">
          {menuItems.map(item => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                title={item.label}
                className={`flex w-full items-center justify-center gap-3 rounded-lg px-3 py-3 transition-all duration-200 lg:justify-start ${
                  activeSection === item.id
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                } `}
              >
                <Icon size={22} />
                <span className="hidden font-medium lg:block">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="border-sidebar-border border-t p-3 lg:p-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="hover:bg-sidebar-accent/50 w-full rounded-lg transition-colors"
          >
            <div className="flex items-center justify-center gap-3 px-1 py-2 lg:justify-start lg:px-2">
              {renderAvatar()}
              <div className="hidden flex-1 overflow-hidden text-left lg:block">
                <p className="text-sidebar-foreground truncate text-base font-semibold">
                  {profile.name}
                </p>
                <p className="text-muted-foreground truncate text-sm">
                  {games.length} {games.length === 1 ? 'jogo' : 'jogos'}
                </p>
              </div>
            </div>
          </button>
        </div>
      </aside>

      {/* Modal de Perfil */}
      <ProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
