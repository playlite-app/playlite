import { ImageOff, Pencil, Star, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Game } from '@/types';

interface GameHeaderProps {
  game: Game;
  onClose: () => void;
  onEditToggle: () => void;
  isEditing: boolean;
}

export function GameHeader({
  game,
  onClose,
  onEditToggle,
  isEditing,
}: GameHeaderProps) {
  // Configuração de tamanhos fixos para Desktop
  const HEADER_HEIGHT = 'h-56'; // Altura total do componente
  const CONTENT_HEIGHT = 'h-40'; // Altura compartilhada (Capa e Texto)
  const COVER_WIDTH = 'w-28'; // Largura da capa

  return (
    <div
      className={`bg-muted relative w-full shrink-0 overflow-hidden ${HEADER_HEIGHT}`}
    >
      {/* --- GRUPO DE AÇÕES (Topo Direito) --- */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={onEditToggle}
          className={`rounded-full p-2 backdrop-blur-md transition-all ${
            isEditing
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-black/40 text-white hover:bg-black/70'
          }`}
          title={isEditing ? 'Cancelar Edição' : 'Editar Detalhes'}
        >
          <Pencil size={18} />
        </button>

        <button
          onClick={onClose}
          className="rounded-full bg-black/40 p-2 text-white backdrop-blur-md transition-all hover:bg-black/70"
          title="Fechar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Imagem de Fundo (Blur) */}
      {game.coverUrl && (
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center opacity-60 blur-3xl"
          style={{ backgroundImage: `url(${game.coverUrl})` }}
        />
      )}

      {/* Gradiente de Leitura */}
      <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/90" />

      {/* --- CONTEÚDO (Alinhado embaixo) --- */}
      <div className="absolute bottom-0 left-0 z-10 flex w-full items-end p-8">
        {/* CAPA (Tamanho Fixo) */}
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
            alt=""
            className={`mr-6 rounded-lg object-cover shadow-2xl ${CONTENT_HEIGHT} ${COVER_WIDTH} bg-muted`}
          />
        ) : (
          <div
            className={`bg-muted flex items-center justify-center rounded-lg shadow-2xl ${CONTENT_HEIGHT} ${COVER_WIDTH}`}
          >
            <ImageOff className="h-10 w-10 opacity-50" />
          </div>
        )}

        {/* COLUNA DE TEXTO */}
        <div
          className={`flex flex-1 flex-col justify-between pb-1 ${CONTENT_HEIGHT}`}
        >
          {/* TÍTULO */}
          <h1 className="line-clamp-2 text-5xl leading-none font-black tracking-tight text-white drop-shadow-xl">
            {game.name}
          </h1>

          {/* BADGES */}
          <div className="flex items-center gap-3">
            <Badge className="border-white/10 bg-white/10 px-3 py-1 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20">
              {game.platform || 'PC'}
            </Badge>

            {game.userRating && (
              <div className="flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-black/50 px-3 py-1 text-sm font-bold text-yellow-400 backdrop-blur-md">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                {game.userRating}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
