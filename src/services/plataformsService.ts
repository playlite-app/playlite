import { invoke } from '@tauri-apps/api/core';

export const platformsService = {
  /**
   * Importa a biblioteca completa de jogos Steam do usuário.
   * Obtém jogos instalados via VDF local, não instalados via cache e API como fallback.
   *
   * @throws Se as credenciais forem inválidas ou a API estiver indisponível
   */
  importSteamLibrary: async (
    steamId: string,
    apiKey: string,
    steamRoot: string
  ): Promise<string> => {
    return await invoke<string>('import_steam_library', {
      steamId,
      apiKey,
      steamRoot,
    });
  },

  /**
   * Importa jogos instalados da Epic Games Store.
   * Detecta automaticamente via manifestos do Epic Games Launcher.
   * Localização: C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests
   *
   * @throws Se o Epic Games Launcher não estiver instalado ou não houver jogos
   */
  importEpicGames: async (): Promise<string> => {
    return await invoke<string>('import_epic_games');
  },

  /**
   * Importa jogos instalados via Heroic Games Launcher (Linux).
   * Detecta automaticamente via installed.json do Heroic.
   * Localizações: ~/.config/heroic ou ~/.var/app/com.heroicgameslauncher.hgl/config/heroic
   *
   * @throws Se o Heroic não estiver instalado ou não houver jogos
   */
  importHeroicGames: async (): Promise<string> => {
    return await invoke<string>('import_heroic_games');
  },

  /**
   * Importa jogos da Ubisoft lendo o cache de configuração do Ubisoft Connect.
   * Detecta automaticamente via %LOCALAPPDATA%\Ubisoft Game Launcher (Windows)
   * ou via Wine prefix configurado (Linux).
   *
   * @throws Se o Ubisoft Connect não estiver instalado ou não houver jogos
   */
  importUbisoftGames: async (): Promise<string> => {
    const winePrefix = localStorage.getItem('wine_prefix') || undefined;

    return await invoke<string>('import_ubisoft_games', {
      winePrefix: winePrefix ?? null,
    });
  },
};
