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
   *
   * Windows: C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests
   * Linux (Wine): <wine_prefix>/drive_c/ProgramData/Epic/EpicGamesLauncher/Data/Manifests
   *
   * @throws Se o Epic Games Launcher não estiver instalado ou não houver jogos
   */
  importEpicGames: async (): Promise<string> => {
    const winePrefix = localStorage.getItem('wine_prefix') || undefined;

    return await invoke<string>('import_epic_games', {
      winePrefix: winePrefix ?? null,
    });
  },

  /**
   * Importa jogos instalados via Heroic Games Launcher.
   * Detecta automaticamente via installed.json do Heroic.
   *
   * Linux: ~/.config/heroic ou ~/.var/app/com.heroicgameslauncher.hgl/config/heroic
   * Windows: %APPDATA%\heroic
   *
   * `heroicConfigPath` — caminho manual para o diretório de configuração do Heroic.
   * Quando omitido, a detecção automática é usada.
   *
   * @throws Se o Heroic não estiver instalado ou não houver jogos
   */
  importHeroicGames: async (heroicConfigPath?: string): Promise<string> => {
    return await invoke<string>('import_heroic_games', {
      heroicConfigPath: heroicConfigPath ?? null,
    });
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

  /**
   * Importa a biblioteca de jogos da Legacy Games.
   * Lê o arquivo app-state-bck.json do launcher.
   *
   * Windows: %APPDATA%\legacy-games-launcher\app-state-bck.json
   * Linux (Wine): <wine_prefix>/drive_c/users/<USER>/AppData/Roaming/legacy-games-launcher/app-state-bck.json
   *
   * @throws Se o Legacy Games Launcher não estiver instalado ou não houver jogos
   */
  importLegacyGames: async (appStatePath?: string): Promise<string> => {
    const winePrefix = localStorage.getItem('wine_prefix') || undefined;

    return await invoke<string>('import_legacy_games', {
      appStatePath: appStatePath ?? null,
      winePrefix: winePrefix ?? null,
    });
  },

  /**
   * Inicia o fluxo de login OAuth2 da conta GOG.
   * Abre uma janela de login; a Promise resolve quando o token é obtido e salvo.
   *
   * @throws Se o login falhar, for cancelado, ou a troca de token falhar
   */
  gogLogin: async (): Promise<string> => {
    return await invoke<string>('gog_login');
  },

  /**
   * Remove o token OAuth salvo da conta GOG (logout).
   */
  gogLogout: async (): Promise<void> => {
    return await invoke<void>('gog_logout');
  },

  /**
   * Verifica se existe uma conta GOG conectada (token salvo).
   * Não garante que o token ainda é válido — apenas que existe um login prévio.
   */
  gogIsAuthenticated: async (): Promise<boolean> => {
    return await invoke<boolean>('gog_is_authenticated');
  },

  /**
   * Importa a biblioteca completa de jogos possuídos na conta GOG.
   * Requer login prévio via `gogLogin`.
   *
   * @throws Se não houver conta conectada ou a API estiver indisponível
   */
  importGogGames: async (): Promise<string> => {
    const gogGamesDir = localStorage.getItem('gog_games_dir') || undefined;

    return await invoke<string>('import_gog_games', {
      gogGamesDir: gogGamesDir ?? null,
    });
  },

  /**
   * Importa jogos instalados via Battle.net (Blizzard/Activision).
   * Detecta automaticamente lendo `product.db` do Battle.net Agent.
   *
   * Windows apenas: C:\ProgramData\Battle.net\Agent\product.db
   * (Battle.net não roda de forma confiável via Wine no Linux.)
   *
   * @throws Se o Battle.net não estiver instalado ou não houver jogos
   */
  importBattleNetGames: async (): Promise<string> => {
    return await invoke<string>('import_battle_net_games');
  },

  /**
   * Importa jogos instalados via EA App (Electronic Arts).
   * A EA não expõe um arquivo estruturado e confiável com o status de instalação,
   * nem oferece um jeito viável de autenticar para listar a biblioteca completa —
   * a detecção depende inteiramente da pasta de instalação configurada pelo usuário.
   *
   * @throws Se a pasta não estiver configurada ou não houver jogos
   */
  importEaGames: async (): Promise<string> => {
    const eaInstallDir = localStorage.getItem('ea_install_dir') || undefined;

    return await invoke<string>('import_ea_games', {
      eaInstallDir: eaInstallDir ?? null,
    });
  },
};
