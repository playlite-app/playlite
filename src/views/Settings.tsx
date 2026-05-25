import { invoke } from '@tauri-apps/api/core';
import {
  BrainCircuit,
  Database,
  Download,
  ExternalLink,
  FileJson,
  Gamepad2,
  HardDrive,
  History,
  ImageIcon,
  Loader2,
  RefreshCcw,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
  WandSparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AboutPlaylite, SettingsRow, StatusBadge } from '@/components/common';
import { useRecommendation, useRecommendationSliders, useSettings, } from '@/hooks';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Separator } from '@/ui/separator';
import { Slider } from '@/ui/slider';
import { Switch } from '@/ui/toggle-switch';
import { toast } from '@/utils/toast';

// Definição dos serviços disponíveis
const SUBSCRIPTION_SERVICES = [
  {
    id: 'prime_gaming',
    name: 'Prime Gaming',
    description: 'Jogos gratuitos mensais incluídos no Amazon Prime',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    activeBorder: 'border-orange-500/60',
    activeBg: 'bg-orange-500/15',
  },
  {
    id: 'game_pass_pc',
    name: 'Game Pass PC',
    description: 'Catálogo de jogos para PC da Microsoft',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    activeBorder: 'border-green-500/60',
    activeBg: 'bg-green-500/15',
  },
  {
    id: 'ea_play',
    name: 'EA Play',
    description: 'Biblioteca de jogos da EA (incluído no Game Pass)',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    activeBorder: 'border-red-500/60',
    activeBg: 'bg-red-500/15',
  },
  {
    id: 'humble_choice',
    name: 'Humble Choice',
    description: 'Seleção mensal de jogos para manter',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    activeBorder: 'border-cyan-500/60',
    activeBg: 'bg-cyan-500/15',
  },
  {
    id: 'ubisoft_plus',
    name: 'Ubisoft+',
    description: 'Catálogo completo de jogos da Ubisoft',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    activeBorder: 'border-blue-500/60',
    activeBg: 'bg-blue-500/15',
  },
] as const;

interface SettingsProps {
  onLibraryUpdate: () => void;
}

export default function Settings({ onLibraryUpdate }: Readonly<SettingsProps>) {
  const { t } = useTranslation('settings');
  const {
    keys,
    setKeys,
    loading,
    status,
    progress,
    actions,
    saveLocally,
    toggleSaveLocally,
    handleClearCache,
  } = useSettings(onLibraryUpdate);

  // Hook de Recomendação para gerenciar configs e preferências
  const {
    config,
    updateConfig,
    resetFeedback,
    ignoredIds,
    toggleAdultFilter,
    setSeriesLimit,
  } = useRecommendation();

  // Hook para gerenciar sliders de recomendação
  const {
    weights,
    decay,
    handleWeightChange,
    handleDecayChange,
    handleSeriesToggle,
    weightsDescription,
    decayDescription,
  } = useRecommendationSliders(config, updateConfig);

  // Estado das assinaturas
  const [enabledServices, setEnabledServices] = useState<string[]>([]);
  const [savingServices, setSavingServices] = useState(false);

  // Aviso de EA Play incluso no Game Pass
  const showEaPlayWarning =
    enabledServices.includes('game_pass_pc') &&
    enabledServices.includes('ea_play');

  useEffect(() => {
    invoke<string[]>('get_subscription_settings')
      .then(setEnabledServices)
      .catch(() => setEnabledServices([]));
  }, []);

  const toggleService = (id: string) => {
    setEnabledServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSaveServices = async () => {
    setSavingServices(true);

    try {
      await invoke('save_subscription_settings', { services: enabledServices });
      toast.success('Assinaturas salvas com sucesso');
    } catch {
      toast.error('Erro ao salvar assinaturas');
    } finally {
      setSavingServices(false);
    }
  };

  if (loading.initial) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto p-8 pb-24">
      {/* HEADER E STATUS */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t('header_title')}
          </h2>
          <p className="text-muted-foreground mt-2">
            {t('header_description')}
          </p>
        </div>

        <StatusBadge type={status.type} message={status.message} />
      </div>

      <Separator />

      {/* SEÇÃO 1: ASSINATURAS */}
      <section className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          Serviços de Assinatura
        </h3>

        <SettingsRow
          icon={Gamepad2}
          title="Minhas Assinaturas"
          description="Marque os serviços que você assina para ver os jogos disponíveis na Home"
        >
          <div className="w-full space-y-3">
            {SUBSCRIPTION_SERVICES.map(service => {
              const isEnabled = enabledServices.includes(service.id);

              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => toggleService(service.id)}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-all duration-200 ${
                    isEnabled
                      ? `${service.activeBg} ${service.activeBorder}`
                      : `bg-background/30 ${service.border} hover:bg-background/60`
                  }`}
                >
                  <div>
                    <p
                      className={`text-sm font-medium ${isEnabled ? service.color : 'text-foreground'}`}
                    >
                      {service.name}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {service.description}
                    </p>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onChange={() => toggleService(service.id)}
                    labelOff="Não"
                    labelOn="Sim"
                  />
                </button>
              );
            })}

            {/* Aviso EA Play + Game Pass */}
            {showEaPlayWarning && (
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3">
                <p className="text-xs text-yellow-400">
                  ⚠️ O <strong>EA Play</strong> já está incluído no{' '}
                  <strong>Game Pass PC</strong>. Os jogos aparecerão apenas uma
                  vez na Home.
                </p>
              </div>
            )}

            <Button
              onClick={handleSaveServices}
              disabled={savingServices}
              className="w-full bg-orange-600 text-white hover:bg-orange-700"
            >
              {savingServices ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Assinaturas
            </Button>
          </div>
        </SettingsRow>
      </section>

      {/* SEÇÃO 2: METADADOS */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">{t('metadata_section')}</h3>

        {/* Configurações de API para tradução de descrições */}
        <SettingsRow
          icon={Sparkles}
          title={t('gemini_title')}
          description={t('gemini_description')}
        >
          <div className="grid gap-2">
            <Input
              type="password"
              placeholder={t('gemini_api_key_placeholder')}
              value={keys.geminiApiKey}
              onChange={e => setKeys({ ...keys, geminiApiKey: e.target.value })}
              className="bg-background/50"
            />
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <span>{t('no_key_question')}</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-0.5 text-blue-400 hover:underline"
              >
                {t('get_api_key_button')} <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </SettingsRow>

        {/* Configurações de API para metadados */}
        <SettingsRow
          icon={Search}
          title={t('rawg_title')}
          description={t('rawg_description')}
        >
          <Input
            type="password"
            placeholder={t('rawg_api_key_placeholder')}
            value={keys.rawgApiKey}
            onChange={e => setKeys({ ...keys, rawgApiKey: e.target.value })}
            className="bg-background/50"
          />
        </SettingsRow>

        {/* Ações para enriquecer metadados e buscar capas */}
        <SettingsRow
          icon={Search}
          title={t('search_metadata_title')}
          description={t('search_metadata_description')}
        >
          <div className="w-full space-y-2">
            <div className="flex gap-2">
              <Button
                onClick={actions.enrichLibrary}
                variant="outline"
                className="flex-1"
                disabled={
                  loading.enriching ||
                  loading.fetchingCovers ||
                  loading.fillingMissing
                }
              >
                {loading.enriching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('updating')}
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('update_button')}
                  </>
                )}
              </Button>

              <Button
                onClick={actions.fetchMissingCovers}
                variant="outline"
                className="flex-1"
                disabled={
                  loading.fetchingCovers ||
                  loading.enriching ||
                  loading.fillingMissing
                }
                title={t('fetch_covers_tooltip')}
              >
                {loading.fetchingCovers ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('searching')}
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {t('fetch_covers_button')}
                  </>
                )}
              </Button>
            </div>

            <Button
              onClick={actions.fillMissingMetadata}
              variant="outline"
              className="w-full"
              disabled={
                loading.fillingMissing ||
                loading.enriching ||
                loading.fetchingCovers
              }
              title={t('fill_missing_tooltip')}
            >
              {loading.fillingMissing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('filling_fields')}
                </>
              ) : (
                <>
                  <WandSparkles className="mr-2 h-4 w-4" />
                  {t('fill_missing_fields_button')}
                </>
              )}
            </Button>

            {(loading.enriching ||
              loading.fetchingCovers ||
              loading.fillingMissing) &&
              progress && (
                <div className="text-muted-foreground animate-pulse text-center text-xs">
                  {t('processing')} {progress.game} ({progress.current}/
                  {progress.total})
                </div>
              )}
          </div>
        </SettingsRow>
      </section>

      {/* SEÇÃO 3: ALGORITMO DE RECOMENDAÇÃO */}
      <section className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          {t('recommendation_algorithm_section')}
        </h3>

        {/* Slider: Perfil vs Comunidade */}
        <SettingsRow
          icon={BrainCircuit}
          title={t('recommendation_focus_title')}
          description={t('recommendation_focus_description')}
        >
          <Slider
            min={0}
            max={100}
            step={5}
            value={weights}
            onChange={handleWeightChange}
            leftLabel={value => `${t('my_profile_label')} (${100 - value}%)`}
            rightLabel={value => `${t('community_label')} (${value}%)`}
            description={weightsDescription}
          />
        </SettingsRow>

        {/* Slider: Age Decay */}
        <SettingsRow
          icon={History}
          title={t('nostalgia_factor_title')}
          description={t('nostalgia_factor_description')}
        >
          <Slider
            min={90}
            max={100}
            step={1}
            value={decay}
            onChange={handleDecayChange}
            leftLabel={() => t('new_games_label')}
            rightLabel={() => t('classics_label')}
            description={value =>
              `${t('current_value')}: ${value}%. ${decayDescription(value)}`
            }
          />
        </SettingsRow>

        <SettingsRow
          icon={Sparkles}
          title={t('series_settings_title')}
          description={t('series_settings_description')}
        >
          <div className="flex flex-col gap-4 pt-2">
            {/* Toggle Priorizar Séries */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {t('prioritize_label')}
              </span>
              <Switch
                checked={config.favor_series}
                onChange={handleSeriesToggle}
                labelOff={t('disabled')}
                labelOn={t('enabled')}
              />
            </div>
            {/* Select Diversidade de Séries */}
            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <span className="text-muted-foreground text-sm">
                {t('limit_label')}
              </span>
              <select
                value={config.series_limit}
                onChange={async e => {
                  const value = e.target.value as
                    | 'none'
                    | 'moderate'
                    | 'aggressive';
                  await setSeriesLimit(value);
                  toast.success(t('series_limit_updated_toast'));
                }}
                className="bg-secondary text-secondary-foreground focus:ring-primary rounded-md border-none px-3 py-2 text-sm font-medium outline-none focus:ring-1"
              >
                <option value="none">{t('no_limit')}</option>
                <option value="moderate">{t('moderate_limit')}</option>
                <option value="aggressive">{t('aggressive_limit')}</option>
              </select>
            </div>
          </div>
        </SettingsRow>

        <SettingsRow
          icon={ShieldAlert}
          title={t('filter_adult_title')}
          description={t('filter_adult_description')}
        >
          <div className="flex justify-end">
            <Switch
              checked={config.filter_adult_content}
              onChange={async () => {
                await toggleAdultFilter();
                toast.success(
                  config.filter_adult_content
                    ? t('filter_adult_disabled_toast')
                    : t('filter_adult_enabled_toast')
                );
              }}
              labelOff={t('disabled')}
              labelOn={t('enabled')}
            />
          </div>
        </SettingsRow>

        <SettingsRow
          icon={Trash2}
          title={t('clear_feedback_title')}
          description={t('clear_feedback_description', {
            count: ignoredIds.length,
          })}
        >
          <Button
            variant="outline"
            onClick={() => {
              resetFeedback();
              toast.success(t('feedback_cleared_toast'));
            }}
            disabled={ignoredIds.length === 0}
            className="w-full text-red-500 hover:bg-red-500/10 hover:text-red-600"
          >
            <>
              <Trash2 className="mr-2 h-4 w-4" />{' '}
              {t('reset_preferences_button')}
            </>
          </Button>
        </SettingsRow>
      </section>

      {/* SEÇÃO 4: ZONA DE DADOS */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-red-500/80">
          {t('data_zone_section')}
        </h3>

        <SettingsRow
          icon={Save}
          title={t('save_credentials_title')}
          description={t('save_credentials_description')}
        >
          <Button
            onClick={actions.saveKeys}
            disabled={loading.saving}
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading.saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t('save_keys_button')}
          </Button>
        </SettingsRow>

        <SettingsRow
          icon={FileJson}
          title={t('manage_backup_title')}
          description={t('manage_backup_description')}
        >
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                onClick={actions.importDatabase}
                variant="outline"
                className="flex-1"
                disabled={loading.importingBackup}
              >
                {loading.importingBackup ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" /> {t('import_button')}
                  </>
                )}
              </Button>
              <Button
                onClick={actions.exportDatabase}
                variant="outline"
                className="flex-1"
                disabled={loading.exporting}
              >
                {loading.exporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" /> {t('export_button')}
                  </>
                )}
              </Button>
            </div>
            <div className="text-muted-foreground text-xs">
              {t('backup_location_info')}
            </div>
          </div>
        </SettingsRow>

        <SettingsRow
          icon={Database}
          title={t('clear_cache_title')}
          description={t('clear_cache_description')}
        >
          <div className="flex gap-2">
            <Button
              onClick={actions.cleanupCache}
              variant="outline"
              className="flex-1"
            >
              {loading.cleaningCache ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              {t('expired_button')}
            </Button>
            <Button
              onClick={actions.clearAllCache}
              variant="outline"
              className="flex-1 text-red-500 hover:bg-red-500/10 hover:text-red-600"
            >
              {loading.clearingAllCache ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {t('all_button')}
            </Button>
          </div>
        </SettingsRow>

        <SettingsRow
          icon={HardDrive}
          title={t('image_storage_title')}
          description={t('image_storage_description')}
        >
          <div className="flex flex-col gap-3 pt-2">
            {/* Toggle */}
            <div className="flex items-center justify-end">
              <Switch
                checked={saveLocally}
                onChange={toggleSaveLocally}
                labelOff={t('disabled')}
                labelOn={t('enabled')}
              />
            </div>

            {/* Botão de Limpeza */}
            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCache}
                className="w-full text-xs text-red-500 hover:bg-red-500/10 hover:text-red-600"
              >
                <Trash2 size={12} className="mr-1" />{' '}
                {t('delete_saved_images_button')}
              </Button>
            </div>
          </div>
        </SettingsRow>
      </section>

      {/* SEÇÃO 4: SOBRE O PLAYLITE */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">{t('about_section')}</h3>
        <AboutPlaylite />
      </section>
    </div>
  );
}
