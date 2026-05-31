import { invoke } from '@tauri-apps/api/core';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  ExternalLink,
  FolderOpen,
  HardDrive,
  Loader2,
  Monitor,
  Search,
  WifiOff,
  XCircle,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Game, GameDetails } from '@/types/game';

// === TIPOS — espelham PcgwScrapedResponse e PcgwData do backend ===

interface SystemRequirements {
  os_family: string;
  tier_title: string | null;
  target: string | null;
  min_os: string | null;
  min_cpu: string | null;
  min_cpu2: string | null;
  min_ram: string | null;
  min_gpu: string | null;
  min_gpu2: string | null;
  min_vram: string | null;
  min_dx: string | null;
  min_storage: string | null;
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

interface GameDataPath {
  kind: string;
  os: string;
  raw_path: string;
  expanded_path: string | null;
}

interface PcgwScrapedData {
  system_requirements: SystemRequirements[];
  config_paths: GameDataPath[];
  save_paths: GameDataPath[];
}

interface PcgwData {
  pcgwPageName: string | null;
  engine: string | null;
  availableOn: string | null;
  dxVersions: string | null;
  vulkanVersions: string | null;
  openglVersions: string | null;
  win64: string | null;
  linux64: string | null;
  // Video
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
  // Input
  controllerSupport: string | null;
  fullController: string | null;
  playstationControllers: string | null;
  xinputControllers: string | null;
  // Audio
  surroundSound: string | null;
  subtitles: string | null;
  closedCaptions: string | null;
  // L10n
  languagesInterface: string[] | null;
  languagesAudio: string[] | null;
  languagesSubtitles: string[] | null;
  // Tags
  hasSaveData: string | null;
  hasConfigData: string | null;
}

// === PROPS ===

interface GameExtrasProps {
  game: Game;
  details: GameDetails | null;
}

// === HELPERS — expansão de variáveis de path ===

/** Converte `{{p|localappdata}}\Game\` para `%LOCALAPPDATA%\Game\` */
function expandPathVars(raw: string): string {
  return (
    raw
      .replace(/\{\{p\|localappdata}}/gi, '%LOCALAPPDATA%')
      .replace(/\{\{p\|appdata}}/gi, '%APPDATA%')
      .replace(/\{\{p\|userprofile\\documents}}/gi, '%USERPROFILE%\\Documents')
      .replace(/\{\{p\|userprofile\/documents}}/gi, '%USERPROFILE%/Documents')
      .replace(/\{\{p\|userprofile}}/gi, '%USERPROFILE%')
      .replace(/\{\{p\|programdata}}/gi, '%PROGRAMDATA%')
      .replace(/\{\{p\|public}}/gi, '%PUBLIC%')
      .replace(/\{\{p\|game}}/gi, '<pasta do jogo>')
      .replace(/\{\{p\|steam}}/gi, '<pasta do Steam>')
      .replace(/\{\{p\|uid}}/gi, '<Steam User ID>')
      .replace(/\{\{p\|xdgdatahome}}/gi, '$XDG_DATA_HOME')
      .replace(/\{\{p\|editorconfig}}/gi, '$XDG_CONFIG_HOME')
      .replace(/\{\{p\|xdgcachehome}}/gi, '$XDG_CACHE_HOME')
      .replace(/\{\{p\|osxhome}}/gi, '$HOME')
      .replace(/\{\{p\|home}}/gi, '$HOME')
      // Remove qualquer {{p|...}} restante não mapeado
      .replace(/\{\{p\|([^}]+)}}/gi, '<$1>')
  );
}

function combineCpu(cpu: string | null, cpu2: string | null): string | null {
  if (cpu && cpu2) return `${cpu} / ${cpu2}`;

  return cpu ?? cpu2 ?? null;
}

// === COMPONENTES DE UI MENORES ===

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-muted-foreground mb-3 text-[10px] font-semibold tracking-widest uppercase">
      {children}
    </h3>
  );
}

function BoolBadge({ value, label }: { value: string | null; label: string }) {
  if (!value || value === 'unknown' || value === 'n/a') return null;

  const isTrue = value === 'true';
  const isHackable = value === 'hackable';

  return (
    <div className="flex items-center gap-1.5">
      {isTrue ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
      ) : isHackable ? (
        // hackable = disponível com mod/workaround
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
      ) : (
        <XCircle className="text-muted-foreground/40 h-3.5 w-3.5 shrink-0" />
      )}
      <span
        className={`text-xs ${
          isTrue
            ? 'text-foreground'
            : isHackable
              ? 'text-yellow-500/80'
              : 'text-muted-foreground/50 line-through'
        }`}
      >
        {label}
        {isHackable && (
          <span className="ml-1 text-[10px] opacity-70">(mod)</span>
        )}
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;

  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  );
}

function PathRow({ path }: { path: GameDataPath }) {
  const display = path.expanded_path ?? expandPathVars(path.raw_path);

  return (
    <div className="border-border/40 flex items-start gap-2 border-b py-2 last:border-0">
      <span className="bg-muted text-muted-foreground mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px]">
        {path.os}
      </span>
      <code className="text-foreground/80 text-[11px] leading-relaxed break-all">
        {display}
      </code>
    </div>
  );
}

// === REQUISITOS DE SISTEMA ===

function SysreqRow({
  label,
  min,
  rec,
}: {
  label: string;
  min: string | null;
  rec: string | null;
}) {
  if (!min && !rec) return null;

  return (
    <tr className="border-border/30 border-b last:border-0">
      <td className="text-muted-foreground py-2 pr-3 text-xs font-medium">
        {label}
      </td>
      <td className="text-foreground py-2 pr-3 text-xs">{min ?? '—'}</td>
      <td className="text-foreground py-2 text-xs">{rec ?? '—'}</td>
    </tr>
  );
}

function SystemRequirementsBlock({ req }: { req: SystemRequirements }) {
  const [expanded, setExpanded] = useState(true);

  const title = req.tier_title
    ? `${req.os_family} — ${req.tier_title}`
    : req.os_family;

  return (
    <div className="border-border/50 mb-3 overflow-hidden rounded-lg border">
      <button
        onClick={() => setExpanded(e => !e)}
        className="hover:bg-muted/30 flex w-full items-center justify-between px-4 py-3 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Monitor className="text-muted-foreground h-3.5 w-3.5" />
          <span className="text-sm font-medium">{title}</span>
          {req.target && (
            <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px]">
              {req.target}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="text-muted-foreground h-4 w-4" />
        ) : (
          <ChevronDown className="text-muted-foreground h-4 w-4" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-muted-foreground pb-2 text-left text-[10px] tracking-wider uppercase">
                  Componente
                </th>
                <th className="text-muted-foreground pb-2 text-left text-[10px] tracking-wider uppercase">
                  Mínimo
                </th>
                <th className="text-muted-foreground pb-2 text-left text-[10px] tracking-wider uppercase">
                  Recomendado
                </th>
              </tr>
            </thead>
            <tbody>
              <SysreqRow label="OS" min={req.min_os} rec={req.rec_os} />
              <SysreqRow
                label="CPU"
                min={combineCpu(req.min_cpu, req.min_cpu2)}
                rec={combineCpu(req.rec_cpu, req.rec_cpu2)}
              />
              <SysreqRow label="RAM" min={req.min_ram} rec={req.rec_ram} />
              <SysreqRow
                label="GPU"
                min={combineCpu(req.min_gpu, req.min_gpu2)}
                rec={combineCpu(req.rec_gpu, req.rec_gpu2)}
              />
              <SysreqRow label="VRAM" min={req.min_vram} rec={req.rec_vram} />
              <SysreqRow label="DirectX" min={req.min_dx} rec={req.rec_dx} />
              <SysreqRow
                label="Armazenamento"
                min={req.min_storage}
                rec={req.rec_storage}
              />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// === ESTADOS DE UI ===

function ExtrasLoading() {
  return (
    <div className="flex h-48 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        <p className="text-muted-foreground text-sm">
          Buscando dados técnicos…
        </p>
      </div>
    </div>
  );
}

function ExtrasNotFound({ gameName }: { gameName: string }) {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
      <Search className="text-muted-foreground/40 h-8 w-8" />
      <p className="text-sm font-medium">Não encontrado no PCGamingWiki</p>
      <p className="text-muted-foreground max-w-xs text-xs">
        Não foram encontrados dados técnicos para{' '}
        <span className="text-foreground font-medium">{gameName}</span> no
        PCGamingWiki.
      </p>
      <a
        href={`https://www.pcgamingwiki.com/w/index.php?search=${encodeURIComponent(gameName)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:text-primary/80 flex items-center gap-1 text-xs transition-colors"
      >
        Buscar manualmente <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

function ExtrasNoSteamId({ gameName }: { gameName: string }) {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
      <WifiOff className="text-muted-foreground/40 h-8 w-8" />
      <p className="text-sm font-medium">Steam AppID não disponível</p>
      <p className="text-muted-foreground max-w-xs text-xs">
        Os dados do PCGamingWiki requerem um Steam AppID.{' '}
        <span className="text-foreground font-medium">{gameName}</span> não
        possui este identificador.
      </p>
    </div>
  );
}

function ExtrasError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm font-medium">Não foi possível carregar</p>
      <button
        onClick={onRetry}
        className="border-border text-foreground hover:bg-muted rounded-md border px-3 py-1.5 text-xs transition-colors"
      >
        Tentar novamente
      </button>

      {/* Temporário — remover após debug */}
      <button
        onClick={async () => {
          const result = await invoke('debug_pcgw').catch(
            (e: unknown) => `ERRO: ${e}`
          );
          console.log('debug_pcgw:', result);
          alert(String(result));
        }}
        className="text-xs text-red-500 underline"
      >
        debug pcgw
      </button>
    </div>
  );
}

// === COMPONENTE PRINCIPAL ===

export function GameExtras({ game, details }: GameExtrasProps) {
  const [cargoData, setCargoData] = useState<PcgwData | null>(null);
  const [scrapedData, setScrapedData] = useState<PcgwScrapedData | null>(null);
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'not_found' | 'no_steam_id' | 'error'
  >('idle');

  const steamAppId = details?.steamAppId ?? null;

  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;

    return () => {
      abortRef.current = true;
    };
  }, [game.id]);

  const load = useCallback(async () => {
    if (!steamAppId) {
      setStatus('no_steam_id');

      return;
    }

    setStatus('loading');

    try {
      const cargo = await invoke<PcgwData | null>('get_or_fetch_pcgw_data', {
        steamAppId,
      });

      const scraped = await invoke<PcgwScrapedData | null>(
        'get_pcgw_scraped_data',
        { steamAppId }
      );

      if (abortRef.current) return; // componente desmontado ou jogo mudou

      if (!cargo && !scraped) {
        setStatus('not_found');

        return;
      }

      setCargoData(cargo);
      setScrapedData(scraped);
      setStatus('success');
    } catch {
      if (!abortRef.current) setStatus('error');
    }
  }, [steamAppId]);

  // 1. Reset ao trocar de jogo
  useEffect(() => {
    setCargoData(null);
    setScrapedData(null);
    setStatus('idle');
  }, [game.id]);

  // 2. Carrega quando idle (caminho normal)
  useEffect(() => {
    if (status === 'idle') load();
  }, [status, load]);

  // 3. Recupera se details chegou depois do mount
  useEffect(() => {
    if (steamAppId && status === 'no_steam_id') load();
  }, [steamAppId, status, load]);

  if (status === 'loading') return <ExtrasLoading />;

  if (status === 'no_steam_id') return <ExtrasNoSteamId gameName={game.name} />;

  if (status === 'not_found') return <ExtrasNotFound gameName={game.name} />;

  if (status === 'error')
    return <ExtrasError onRetry={() => setStatus('idle')} />;

  if (status !== 'success') return null;

  const hasSysreqs = (scrapedData?.system_requirements?.length ?? 0) > 0;
  const hasConfigPaths = (scrapedData?.config_paths?.length ?? 0) > 0;
  const hasSavePaths = (scrapedData?.save_paths?.length ?? 0) > 0;
  const hasLangs =
    cargoData?.languagesInterface ||
    cargoData?.languagesAudio ||
    cargoData?.languagesSubtitles;

  return (
    <div className="space-y-8">
      {/* ---- Cabeçalho com link para a página ---- */}
      {cargoData?.pcgwPageName && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs">
            Fonte:{' '}
            <a
              href={`https://www.pcgamingwiki.com/wiki/${encodeURIComponent(cargoData.pcgwPageName.replace(/ /g, '_'))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              PCGamingWiki
              <ExternalLink className="ml-1 inline h-3 w-3" />
            </a>
          </p>
        </div>
      )}
      {/* ---- Informações gerais ---- */}
      {cargoData && (
        <div>
          <SectionTitle>Informações Técnicas</SectionTitle>
          <div className="border-border/50 divide-border/30 divide-y rounded-lg border">
            <div className="px-4 py-1">
              <InfoRow label="Engine" value={cargoData.engine} />
              <InfoRow label="Plataformas" value={cargoData.availableOn} />
              <InfoRow label="DirectX" value={cargoData.dxVersions} />
              <InfoRow label="Vulkan" value={cargoData.vulkanVersions} />
              <InfoRow label="OpenGL" value={cargoData.openglVersions} />
            </div>
          </div>
        </div>
      )}
      {/* ---- Vídeo ---- */}
      {cargoData && (
        <div>
          <SectionTitle>Vídeo</SectionTitle>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 sm:grid-cols-3">
            <BoolBadge value={cargoData.fourKSupport} label="4K" />
            <BoolBadge value={cargoData.ultrawidescreen} label="Ultrawide" />
            <BoolBadge value={cargoData.hdr} label="HDR" />
            <BoolBadge value={cargoData.highFps} label="120 FPS+" />
            <BoolBadge value={cargoData.rayTracing} label="Ray Tracing" />
            <BoolBadge value={cargoData.fov} label="FOV ajustável" />
            <BoolBadge
              value={cargoData.borderlessWindowed}
              label="Borderless"
            />
            <BoolBadge value={cargoData.colorBlind} label="Daltonismo" />
            {cargoData.upscaling && (
              <div className="col-span-2 flex items-center gap-1.5 sm:col-span-3">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                <span className="text-xs">
                  Upscaling:{' '}
                  <span className="text-foreground">{cargoData.upscaling}</span>
                </span>
              </div>
            )}
            {cargoData.frameGen && (
              <div className="col-span-2 flex items-center gap-1.5 sm:col-span-3">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                <span className="text-xs">
                  Frame Gen:{' '}
                  <span className="text-foreground">{cargoData.frameGen}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ---- Input e Áudio ---- */}
      {cargoData && (
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <SectionTitle>Controles</SectionTitle>
            <div className="space-y-1.5">
              <BoolBadge value={cargoData.controllerSupport} label="Controle" />
              <BoolBadge
                value={cargoData.fullController}
                label="Suporte completo"
              />
              <BoolBadge
                value={cargoData.playstationControllers}
                label="PlayStation"
              />
              <BoolBadge
                value={cargoData.xinputControllers}
                label="XInput / Xbox"
              />
            </div>
          </div>

          <div>
            <SectionTitle>Áudio e Acessibilidade</SectionTitle>
            <div className="space-y-1.5">
              <BoolBadge value={cargoData.surroundSound} label="Surround" />
              <BoolBadge value={cargoData.subtitles} label="Legendas" />
              <BoolBadge
                value={cargoData.closedCaptions}
                label="Closed Captions"
              />
            </div>
          </div>
        </div>
      )}
      {/* ---- Idiomas ---- */}
      {hasLangs && (
        <div>
          <SectionTitle>Idiomas</SectionTitle>
          <div className="border-border/50 overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead className="bg-muted/20">
                <tr>
                  <th className="text-muted-foreground px-4 py-2 text-left text-[10px] tracking-wider uppercase">
                    Idioma
                  </th>
                  <th className="text-muted-foreground px-2 py-2 text-center text-[10px] tracking-wider uppercase">
                    Interface
                  </th>
                  <th className="text-muted-foreground px-2 py-2 text-center text-[10px] tracking-wider uppercase">
                    Áudio
                  </th>
                  <th className="text-muted-foreground px-2 py-2 text-center text-[10px] tracking-wider uppercase">
                    Legendas
                  </th>
                </tr>
              </thead>
              <tbody>
                {buildLanguageRows(
                  cargoData?.languagesInterface ?? null,
                  cargoData?.languagesAudio ?? null,
                  cargoData?.languagesSubtitles ?? null
                ).map(row => (
                  <tr
                    key={row.lang}
                    className="border-border/30 border-b last:border-0"
                  >
                    <td className="text-foreground px-4 py-2 text-xs">
                      {row.lang}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <LangDot has={row.interface} />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <LangDot has={row.audio} />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <LangDot has={row.subtitles} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* ---- Requisitos de Sistema ---- */}
      {hasSysreqs && (
        <div>
          <SectionTitle>
            <span className="flex items-center gap-1.5">
              <Cpu className="h-3 w-3" /> Requisitos de Sistema
            </span>
          </SectionTitle>
          {scrapedData!.system_requirements.map((req, i) => (
            <SystemRequirementsBlock key={i} req={req} />
          ))}
        </div>
      )}
      {/* ---- Caminhos de Save ---- */}
      {hasSavePaths && (
        <div>
          <SectionTitle>
            <span className="flex items-center gap-1.5">
              <HardDrive className="h-3 w-3" /> Localização dos Saves
            </span>
          </SectionTitle>
          <div className="border-border/50 rounded-lg border px-4">
            {scrapedData!.save_paths.map((p, i) => (
              <PathRow key={i} path={p} />
            ))}
          </div>
        </div>
      )}
      {/* ---- Caminhos de Config ---- */}
      {hasConfigPaths && (
        <div>
          <SectionTitle>
            <span className="flex items-center gap-1.5">
              <FolderOpen className="h-3 w-3" /> Arquivos de Configuração
            </span>
          </SectionTitle>
          <div className="border-border/50 rounded-lg border px-4">
            {scrapedData!.config_paths.map((p, i) => (
              <PathRow key={i} path={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// === HELPERS DE IDIOMAS ===

interface LangRow {
  lang: string;
  interface: boolean;
  audio: boolean;
  subtitles: boolean;
}

function LangDot({ has }: { has: boolean }) {
  return has ? (
    <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
  ) : (
    <span className="bg-muted-foreground/20 inline-block h-2 w-2 rounded-full" />
  );
}

/**
 * Reconstrói a tabela de idiomas a partir das três strings CSV do backend.
 * Cada string é uma lista separada por vírgula: "English,Portuguese,French".
 * Os índices correspondem entre as três listas.
 */
function buildLanguageRows(
  iface: string[] | null,
  audio: string[] | null,
  subs: string[] | null
): LangRow[] {
  const ifaceList = iface ?? [];
  const audioList = audio ?? [];
  const subsList = subs ?? [];

  // União de todos os idiomas encontrados em qualquer das três listas
  const allLangs = Array.from(
    new Set([...ifaceList, ...audioList, ...subsList])
  ).sort();

  return allLangs.map(lang => ({
    lang,
    interface: ifaceList.includes(lang),
    audio: audioList.includes(lang),
    subtitles: subsList.includes(lang),
  }));
}
