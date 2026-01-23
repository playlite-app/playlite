import { toast } from 'sonner';

import { Game, RawgGame } from '@/types';

export const launchGame = (game: Game | RawgGame | any) => {
  if (!game.platform || game.platform.toLowerCase() === 'steam') {
    const steamId = game.platformId;
    const steamUrl = `steam://rungameid/${steamId}`;

    try {
      window.open(steamUrl, '_self');
      toast.success(`Iniciando ${game.name}...`);
    } catch {
      toast.error('Erro ao iniciar jogo');
    }
  } else {
    toast.info(`Lançamento para ${game.platform} será implementado em breve`);
  }
};
