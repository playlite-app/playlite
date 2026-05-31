import {
  CheckCircle2,
  Cpu,
  ExternalLink,
  FolderOpen,
  HardDrive,
  Search,
  WifiOff,
  XCircle,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { ContentError, ContentLoading } from '@/components';
import { usePcgwData } from '@/hooks/game';
import { GameDataPath } from '@/types';
import { Game, GameDetails } from '@/types/game';
import { expandPathVars, formatEngine, formatList } from '@/utils/pcgw.ts';
import { LanguageTable, SystemRequirementsBlock } from '@/windows';

// === PROPS ===

interface GameExtrasProps {
  game: Game;
  details: GameDetails | null;
}

// === COMPONENTES DE UI MENORES ===

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-muted-foreground mb-3 text-sm font-semibold tracking-widest uppercase">
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
        {isHackable && <span className="ml-1 text-xs opacity-70">(mod)</span>}
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
      <span className="bg-muted text-muted-foreground mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs">
        {path.os}
      </span>
      <code className="text-foreground/80 text-xs leading-relaxed break-all">
        {display}
      </code>
    </div>
  );
}

// === ESTADOS DE UI ===

function ExtrasNotFound({ gameName }: { gameName: string }) {
  const { t } = useTranslation('game_detail');

  return (
    <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
      <Search className="text-muted-foreground/40 h-8 w-8" />
      <p className="text-sm font-medium">{t('extras_not_found_title')}</p>
      <p className="text-muted-foreground max-w-xs text-xs">
        {t('extras_not_found_description')}{' '}
        <span className="text-foreground font-medium">{gameName}</span>{' '}
        {t('extras_not_found_suffix')}.
      </p>
      <a
        href={`https://www.pcgamingwiki.com/w/index.php?search=${encodeURIComponent(gameName)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:text-primary/80 flex items-center gap-1 text-xs transition-colors"
      >
        {t('extras_manual_search')} <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

function ExtrasNoSteamId({ gameName }: { gameName: string }) {
  const { t } = useTranslation('game_detail');

  return (
    <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
      <WifiOff className="text-muted-foreground/40 h-8 w-8" />
      <p className="text-sm font-medium">{t('extras_no_steam_id_title')}</p>
      <p className="text-muted-foreground max-w-xs text-xs">
        {t('extras_no_steam_id_description1')}{' '}
        <span className="text-foreground font-medium">{gameName}</span>{' '}
        {t('extras_no_steam_id_description2')}
      </p>
    </div>
  );
}

// === COMPONENTE PRINCIPAL ===

export function GameExtras({ game, details }: GameExtrasProps) {
  const { t } = useTranslation('game_detail');
  const { cargoData, scrapedData, status, retry } = usePcgwData(
    game.id,
    details?.steamAppId
  );

  if (status === 'loading')
    return <ContentLoading message={t('extras_loading_message')} />;

  if (status === 'no_steam_id') return <ExtrasNoSteamId gameName={game.name} />;

  if (status === 'not_found') return <ExtrasNotFound gameName={game.name} />;

  if (status === 'error') return <ContentError onRetry={retry} />;

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
          <p className="text-muted-foreground text-sm">
            {t('extras_source_label')}{' '}
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
          <SectionTitle>{t('extras_section_technical')}</SectionTitle>
          <div className="border-border/50 divide-border/30 divide-y rounded-lg border">
            <div className="px-4 py-1">
              <InfoRow
                label={t('extras_info_engine')}
                value={formatEngine(cargoData.engine)}
              />
              <InfoRow
                label={t('extras_info_platforms')}
                value={formatList(cargoData.availableOn)}
              />
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
          <SectionTitle>{t('extras_section_video')}</SectionTitle>
          <div className="border-border/50 grid grid-cols-2 gap-x-8 gap-y-1.5 rounded-lg border p-4 sm:grid-cols-3">
            <BoolBadge value={cargoData.fourKSupport} label="4K" />
            <BoolBadge value={cargoData.ultrawidescreen} label="Ultrawide" />
            <BoolBadge value={cargoData.hdr} label="HDR" />
            <BoolBadge value={cargoData.highFps} label="120 FPS+" />
            <BoolBadge value={cargoData.rayTracing} label="Ray Tracing" />
            <BoolBadge value={cargoData.fov} label={t('extras_badge_fov')} />
            <BoolBadge
              value={cargoData.borderlessWindowed}
              label="Borderless"
            />
            <BoolBadge
              value={cargoData.colorBlind}
              label={t('extras_badge_color_blind')}
            />
            {cargoData.upscaling && (
              <div className="col-span-2 flex items-center gap-1.5 sm:col-span-3">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                <span className="text-xs">
                  {t('extras_label_upscaling')}{' '}
                  <span className="text-foreground">
                    {formatList(cargoData.upscaling)}
                  </span>
                </span>
              </div>
            )}
            {cargoData.frameGen && (
              <div className="col-span-2 flex items-center gap-1.5 sm:col-span-3">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                <span className="text-xs">
                  {t('extras_label_frame_gen')}{' '}
                  <span className="text-foreground">
                    {formatList(cargoData.frameGen)}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Input e Áudio ---- */}
      {cargoData && (
        <div>
          <SectionTitle>{t('extras_section_compatibility')}</SectionTitle>
          <div className="border-border/50 grid gap-8 rounded-lg border p-4 sm:grid-cols-2">
            <div>
              <SectionTitle>{t('extras_section_controls')}</SectionTitle>
              <div className="space-y-1.5">
                <BoolBadge
                  value={cargoData.controllerSupport}
                  label={t('extras_badge_controller')}
                />
                <BoolBadge
                  value={cargoData.fullController}
                  label={t('extras_badge_full_controller')}
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
              <SectionTitle>{t('extras_section_audio')}</SectionTitle>
              <div className="space-y-1.5">
                <BoolBadge value={cargoData.surroundSound} label="Surround" />
                <BoolBadge
                  value={cargoData.subtitles}
                  label={t('extras_badge_subtitles')}
                />
                <BoolBadge
                  value={cargoData.closedCaptions}
                  label="Closed Captions"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Idiomas ---- */}
      {hasLangs && (
        <LanguageTable
          interface={cargoData?.languagesInterface ?? null}
          audio={cargoData?.languagesAudio ?? null}
          subtitles={cargoData?.languagesSubtitles ?? null}
        />
      )}

      {/* ---- Requisitos de Sistema ---- */}
      {hasSysreqs && (
        <div>
          <SectionTitle>
            <span className="flex items-center gap-1.5">
              <Cpu className="h-3 w-3" />{' '}
              {t('extras_section_system_requirements')}
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
              <HardDrive className="h-3 w-3" /> {t('extras_section_save_paths')}
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
              <FolderOpen className="h-3 w-3" />{' '}
              {t('extras_section_config_paths')}
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
