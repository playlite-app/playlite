import {
  Gamepad2,
  Heart,
  Home,
  Library,
  Settings,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { Game } from "../types";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  games: Game[];
}

const menuItems = [
  { id: "home", label: "Início", icon: Home },
  { id: "libraries", label: "Biblioteca", icon: Library },
  { id: "favorites", label: "Favoritos", icon: Heart },
  { id: "playlist", label: "Playlist", icon: Gamepad2 },
  { id: "trending", label: "Em Alta", icon: TrendingUp },
  { id: "wishlist", label: "Lista de Desejos", icon: ShoppingCart },
  { id: "settings", label: "Configurações", icon: Settings },
];

export default function Sidebar({
  activeSection,
  onSectionChange,
  games,
}: SidebarProps) {
  return (
    <aside className="w-17.5 lg:w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col transition-all duration-300">

      {/* Header / Logo */}
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img
            src="/app-icon.png"
            alt="Logo"
            className="w-8 h-8 shrink-0 object-contain"
          />
          <h1 className="hidden lg:block text-xl font-bold text-sidebar-foreground truncate">
            Playlite
          </h1>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-2 lg:p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              title={item.label} // Tooltip nativo para quando estiver só ícone
              className={`
                w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-lg
                transition-all duration-200
                ${activeSection === item.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"}
              `}
            >
              <Icon size={22} />
              <span className="hidden lg:block font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-3 lg:p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-center lg:justify-start gap-3 px-1 lg:px-2 py-2">
          <div className="w-9 h-9 shrink-0 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
            U
          </div>
          <div className="hidden lg:block flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">
              Usuário
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {games.length} {games.length === 1 ? "jogo" : "jogos"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
