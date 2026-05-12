import { toast } from '@/utils/toast';

import { Game } from '@/types';

export const launchGame = (game: Game) => {
  if (!game.platform || game.platform === 'Steam') {
    const steamId = game.platformGameId;
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

