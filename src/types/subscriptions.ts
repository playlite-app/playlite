export interface LunaGame {
  title: string;
  description: string | null;
  image_url: string | null;
  claim_url: string;
  end_time: string | null;
}

// Definição dos serviços
export const SUBSCRIPTION_SERVICES = [
  {
    id: 'prime_gaming',
    name: 'Prime Gaming',
    description: 'Jogos gratuitos mensais incluídos no Amazon Prime',
    url: 'https://gaming.amazon.com',
    color: 'text-orange-400',
    activeBg: 'bg-orange-500/10',
    activeBorder: 'border-orange-500/40',
  },
  {
    id: 'game_pass_pc',
    name: 'Game Pass PC',
    description: 'Catálogo de jogos para PC da Microsoft',
    url: 'https://www.xbox.com/pt-BR/xbox-game-pass',
    color: 'text-green-400',
    activeBg: 'bg-green-500/10',
    activeBorder: 'border-green-500/40',
  },
  {
    id: 'ea_play',
    name: 'EA Play',
    description: 'Biblioteca de jogos da EA (incluído no Game Pass)',
    url: 'https://www.ea.com/ea-play',
    color: 'text-red-400',
    activeBg: 'bg-red-500/10',
    activeBorder: 'border-red-500/40',
  },
  {
    id: 'humble_choice',
    name: 'Humble Choice',
    description: 'Seleção mensal de jogos para manter',
    url: 'https://www.humblebundle.com/membership',
    color: 'text-cyan-400',
    activeBg: 'bg-cyan-500/10',
    activeBorder: 'border-cyan-500/40',
  },
  {
    id: 'ubisoft_plus',
    name: 'Ubisoft+',
    description: 'Catálogo completo de jogos da Ubisoft',
    url: 'https://store.ubisoft.com/ofertas/ubisoftplus',
    color: 'text-blue-400',
    activeBg: 'bg-blue-500/10',
    activeBorder: 'border-blue-500/40',
  },
] as const;

export type ServiceId = (typeof SUBSCRIPTION_SERVICES)[number]['id'];
