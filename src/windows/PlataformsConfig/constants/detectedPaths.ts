/**
 * Caminhos de arquivo/config verificados automaticamente por cada
 * plataforma, exibidos nas caixas de "detecção automática".
 */
export const DETECTED_PATHS = {
  epic: {
    windows: 'C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests',
    linuxWine: '<wine_prefix>/drive_c/ProgramData/Epic/.../Manifests',
  },
  heroic: {
    linuxNative: '~/.config/heroic',
    linuxFlatpak: '~/.var/app/com.heroicgameslauncher.hgl/config/heroic',
    windows: '%APPDATA%\\heroic',
  },
  ubisoft: {
    windows: '%LOCALAPPDATA%\\Ubisoft Game Launcher',
  },
  legacy: {
    windows: '%APPDATA%\\Roaming\\legacy-games-launcher\\app-state.json',
    linuxWine:
      '<wine_prefix>/drive_c/users/<USER>/AppData/Roaming/legacy-games-launcher/',
  },
  amazon: {
    windows:
      'C:\\Users\\<user>\\AppData\\Local\\Amazon Games\\Data\\Games\\Sql\\GameInstallInfo.sqlite',
  },
} as const;
