import {
  BrainCircuit,
  Database,
  Download,
  ExternalLink,
  FileJson,
  HardDrive,
  History,
  Loader2,
  RefreshCcw,
  Save,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import { AboutPlaylite, SettingsRow, StatusBadge } from '@/components/common';
import {
  useRecommendation,
  useRecommendationSliders,
  useSettings,
} from '@/hooks';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Separator } from '@/ui/separator';
import { Slider } from '@/ui/slider';
import { Switch } from '@/ui/toggle-switch';

interface SettingsProps {
  onLibraryUpdate: () => void;
}

export default function Settings({ onLibraryUpdate }: SettingsProps) {
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
          <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
          <p className="text-muted-foreground mt-2">
            Gerencie suas integrações, chaves de API, algoritmo de recomendação
            e dados locais.
          </p>
        </div>

        <StatusBadge type={status.type} message={status.message} />
      </div>

      <Separator />

      {/* SEÇÃO 1: METADADOS */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Metadados</h3>
        {/* Configurações de API para metadados */}
        <SettingsRow
          icon={Search}
          title="RAWG.io"
          description="Usado como fonte de metadados, de jogos em alta e lançamentos próximos."
        >
          <Input
            type="password"
            placeholder="RAWG API Key"
            value={keys.rawgApiKey}
            onChange={e => setKeys({ ...keys, rawgApiKey: e.target.value })}
            className="bg-background/50"
          />
        </SettingsRow>

        {/* Ações para enriquecer metadados e buscar capas */}
        <SettingsRow
          icon={Search}
          title="Buscar Metadados"
          description="Baixa capas e sinopses em segundo plano."
        >
          <div className="w-full space-y-2">
            <div className="flex gap-2">
              <Button
                onClick={actions.enrichLibrary}
                variant="outline"
                className="flex-1"
                disabled={loading.enriching || loading.fetchingCovers}
              >
                {loading.enriching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Atualizar Metadados'
                )}
              </Button>

              <Button
                onClick={actions.fetchMissingCovers}
                variant="outline"
                className="flex-1"
                disabled={loading.fetchingCovers || loading.enriching}
                title="Busca apenas capas para jogos que estão sem imagem"
              >
                {loading.fetchingCovers ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Buscar Capas'
                )}
              </Button>
            </div>
            {(loading.enriching || loading.fetchingCovers) && progress && (
              <div className="text-muted-foreground animate-pulse text-center text-xs">
                Processando: {progress.game} ({progress.current}/
                {progress.total})
              </div>
            )}
          </div>
        </SettingsRow>

        {/* Configurações de API para tradução de descrições */}
        <SettingsRow
          icon={Sparkles}
          title="Google Gemini"
          description="Usado para traduzir descrições dos jogos para Português."
        >
          <div className="grid gap-2">
            <Input
              type="password"
              placeholder="Gemini API Key"
              value={keys.geminiApiKey}
              onChange={e => setKeys({ ...keys, geminiApiKey: e.target.value })}
              className="bg-background/50"
            />
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <span>Não tem uma chave?</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-0.5 text-blue-400 hover:underline"
              >
                Obter no Google AI Studio <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </SettingsRow>
      </section>

      {/* SEÇÃO 2: ALGORITMO DE RECOMENDAÇÃO */}
      <section className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          Algoritmo de Recomendação
        </h3>

        {/* Slider: Perfil vs Comunidade */}
        <SettingsRow
          icon={BrainCircuit}
          title="Foco da Recomendação"
          description="Ajuste o peso entre seu gosto pessoal (tags/gêneros) e o que é popular na comunidade."
        >
          <Slider
            min={0}
            max={100}
            step={5}
            value={weights}
            onChange={handleWeightChange}
            leftLabel={value => `Meu Perfil (${100 - value}%)`}
            rightLabel={value => `Comunidade (${value}%)`}
            description={weightsDescription}
          />
        </SettingsRow>

        {/* Slider: Age Decay */}
        <SettingsRow
          icon={History}
          title="Fator Nostalgia"
          description="Define o quanto jogos antigos são penalizados nas recomendações."
        >
          <Slider
            min={90}
            max={100}
            step={1}
            value={decay}
            onChange={handleDecayChange}
            leftLabel={() => 'Novidades (90%)'}
            rightLabel={() => 'Clássicos (100%)'}
            description={value =>
              `Valor atual: ${value}%. ${decayDescription(value)}`
            }
          />
        </SettingsRow>

        <SettingsRow
          icon={Sparkles}
          title="Configurações de Séries"
          description="Personalize como o algoritmo lida com sequências e franquias de jogos."
        >
          <div className="flex flex-col gap-4 pt-2">
            {/* Toggle Priorizar Séries */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Priorizar</span>
              <Switch
                checked={config.favor_series}
                onChange={handleSeriesToggle}
                labelOff="Desativado"
                labelOn="Ativado"
              />
            </div>
            {/* Select Diversidade de Séries */}
            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <span className="text-muted-foreground text-sm">Limite</span>
              <select
                value={config.series_limit}
                onChange={async e => {
                  const value = e.target.value as
                    | 'none'
                    | 'moderate'
                    | 'aggressive';
                  await setSeriesLimit(value);
                  toast.success('Limite de séries atualizado!');
                }}
                className="bg-secondary text-secondary-foreground focus:ring-primary rounded-md border-none px-3 py-2 text-sm font-medium outline-none focus:ring-1"
              >
                <option value="none">Sem limite</option>
                <option value="moderate">Moderado (2 por série)</option>
                <option value="aggressive">Agressivo (1 por série)</option>
              </select>
            </div>
          </div>
        </SettingsRow>

        <SettingsRow
          icon={ShieldAlert}
          title="Filtrar Conteúdo Adulto"
          description="Ocultar jogos com conteúdo adulto das recomendações."
        >
          <div className="flex justify-end">
            <Switch
              checked={config.filter_adult_content}
              onChange={async () => {
                await toggleAdultFilter();
                toast.success(
                  config.filter_adult_content
                    ? 'Filtro de conteúdo adulto desativado'
                    : 'Filtro de conteúdo adulto ativado'
                );
              }}
              labelOff="Desativado"
              labelOn="Ativado"
            />
          </div>
        </SettingsRow>

        <SettingsRow
          icon={Trash2}
          title="Limpar Feedback"
          description={`Restaurar ${ignoredIds.length} jogos marcados como "Não Útil".`}
        >
          <Button
            variant="outline"
            onClick={() => {
              resetFeedback();
              toast.success('Histórico de feedback limpo!');
            }}
            disabled={ignoredIds.length === 0}
            className="w-full text-red-500 hover:bg-red-500/10 hover:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Resetar Preferências
          </Button>
        </SettingsRow>
      </section>

      {/* SEÇÃO 3: ZONA DE DADOS */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-red-500/80">Zona de Dados</h3>

        <SettingsRow
          icon={Save}
          title="Salvar Credenciais"
          description="Armazena suas chaves localmente de forma encriptada."
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
            Salvar Chaves
          </Button>
        </SettingsRow>

        <SettingsRow
          icon={FileJson}
          title="Gerenciar Backup"
          description="Exporte ou restaure sua biblioteca completa (JSON). Backups automáticos são criados em atualizações importantes."
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
                    <Download className="mr-2 h-4 w-4" /> Importar
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
                    <Upload className="mr-2 h-4 w-4" /> Exportar
                  </>
                )}
              </Button>
            </div>
            <div className="text-muted-foreground text-xs">
              Backups automáticos são salvos em <code>app_data/backups/</code>
            </div>
          </div>
        </SettingsRow>

        <SettingsRow
          icon={Database}
          title="Limpar Cache"
          description="Remova dados expirados ou todo o cache para liberar espaço."
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
              Expirados
            </Button>
            <Button
              onClick={actions.clearAllCache}
              variant="outline"
              className="flex-1 text-red-500 hover:bg-red-500/10"
            >
              {loading.clearingAllCache ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Tudo
            </Button>
          </div>
        </SettingsRow>

        <SettingsRow
          icon={HardDrive} // Importe de lucide-react
          title="Armazenamento de Imagens"
          description="Salve as capas no seu computador para visualizar offline. Ocupa espaço em disco"
        >
          <div className="flex flex-col gap-3 pt-2">
            {/* Toggle */}
            <div className="flex items-center justify-end">
              <Switch
                checked={saveLocally}
                onChange={toggleSaveLocally}
                labelOff="Desativado"
                labelOn="Ativado"
              />
            </div>

            {/* Botão de Limpeza */}
            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCache}
                className="w-full text-xs text-red-400 hover:bg-red-500/10 hover:text-red-500"
              >
                <Trash2 size={12} className="mr-1" /> Excluir Imagens Salvas
              </Button>
            </div>
          </div>
        </SettingsRow>
      </section>

      {/* SEÇÃO 4: SOBRE O PLAYLITE */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Sobre</h3>
        <AboutPlaylite />
      </section>
    </div>
  );
}
