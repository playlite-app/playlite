// types/game_detail.ts
//
// Tipos que espelham as estruturas retornadas pelo backend para dados do Gamebrain e PCGamingWiki.

import React from 'react';

// Tipo das abas disponíveis
export type GameTab = 'description' | 'discovery' | 'media' | 'extras';

export interface Tab {
  id: GameTab;
  label: string;
  icon: React.ReactNode;
}

/**
 * Espelha SimilarGame do backend (gamebrain.rs)
 * OBS.: campo because_of adicionado por ProfileSimilarGame
 */
export interface SimilarGame {
  id: string;
  name: string;
  cover_url: string | null;
  genre: string | null;
  year: number | null;
  rating: number | null;
  link: string | null;
  screenshots: string[];
  micro_trailer: string | null;
  adult_only: boolean;
  because_of: string; // nome do jogo âncora
}

/**
 * Requisitos de sistema de um bloco `{{System requirements}}`.
 * Um bloco representa um OS (`os_family`) e opcionalmente um tier extra
 * (`tier_title`), como "High" ou "Ultra" em jogos AAA modernos.
 *
 * Campos `min_cpu2` / `min_gpu2` chegam já combinados pelo backend como
 * "Intel Core i5 / AMD Ryzen 5" — mantidos aqui apenas para compatibilidade
 * caso o backend passe a enviar separado no futuro.
 */
export interface SystemRequirements {
  os_family: string;
  tier_title: string | null;
  target: string | null;
  // Mínimo
  min_os: string | null;
  min_cpu: string | null;
  min_cpu2: string | null;
  min_ram: string | null;
  min_gpu: string | null;
  min_gpu2: string | null;
  min_vram: string | null;
  min_dx: string | null;
  min_storage: string | null;
  // Recomendado
  rec_os: string | null;
  rec_cpu: string | null;
  rec_cpu2: string | null;
  rec_ram: string | null;
  rec_gpu: string | null;
  rec_gpu2: string | null;
  rec_vram: string | null;
  rec_dx: string | null;
  rec_storage: string | null;
}

/**
 * Caminho de save ou configuração extraído de `{{Game data/config|OS|path}}`
 * e `{{Game data/saves|OS|path}}`.
 *
 * `raw_path` preserva a sintaxe `{{p|variavel}}` do wikitext.
 * `expanded_path` é preenchido pelo backend quando possível; caso contrário
 * o frontend expande via `expandPathVars()` em `utils/pcgw.ts`.
 */
export interface GameDataPath {
  kind: 'config' | 'saves';
  os: string;
  raw_path: string;
  expanded_path: string | null;
}

/**
 * Conjunto completo de dados extraídos por scraping de wikitext.
 * Retornado pelo comando Tauri `get_pcgw_scraped_data`.
 */
export interface PcgwScrapedData {
  system_requirements: SystemRequirements[];
  config_paths: GameDataPath[];
  save_paths: GameDataPath[];
}

/**
 * Dados estruturados retornados pela Cargo API do PCGamingWiki.
 * Retornado pelo comando Tauri `get_or_fetch_pcgw_data`.
 *
 * Campos booleanos do PCGamingWiki (`true`, `false`, `hackable`, `unknown`,
 * `n/a`) chegam como string para que o frontend controle a semântica de
 * exibição via `BoolBadge`.
 *
 * Renomeado de `GameExtras` (nome original no componente) para `PcgwCargoData`
 * a fim de evitar conflito com o nome do componente `GameExtras`.
 */
export interface PcgwCargoData {
  steamAppId: string;
  pcgwPageId: string | null;
  pcgwPageName: string | null;
  // Geral
  engine: string | null;
  availableOn: string | null;
  // API gráfica
  dxVersions: string | null;
  vulkanVersions: string | null;
  openglVersions: string | null;
  // Suporte a SO (executáveis)
  win64: string | null;
  linux64: string | null;
  macOsArm: string | null;
  macOsIntel64: string | null;
  // Vídeo
  rayTracing: string | null;
  upscaling: string | null;
  frameGen: string | null;
  ultrawidescreen: string | null;
  fourKSupport: string | null;
  hdr: string | null;
  highFps: string | null;
  fov: string | null;
  borderlessWindowed: string | null;
  colorBlind: string | null;
  // Controles
  controllerSupport: string | null;
  fullController: string | null;
  playstationControllers: string | null;
  xinputControllers: string | null;
  // Áudio e acessibilidade
  surroundSound: string | null;
  subtitles: string | null;
  closedCaptions: string | null;
  // Localização
  languagesInterface: string[] | null;
  languagesAudio: string[] | null;
  languagesSubtitles: string[] | null;
  // Metadados
  hasSaveData: string | null;
  hasConfigData: string | null;
  fetchedAt: string | null;
}

/**
 * Linha normalizada da tabela de idiomas, derivada de `PcgwCargoData.languages*`.
 * Produzida por `buildLanguageRows()` em `utils/pcgw.ts`.
 */
export interface LangRow {
  lang: string;
  interface: boolean;
  audio: boolean;
  subtitles: boolean;
}
