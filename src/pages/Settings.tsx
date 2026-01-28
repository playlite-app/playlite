import {
  BrainCircuit,
  CloudDownload,
  Database,
  Download,
  ExternalLink,
  FileJson,
  Gamepad2,
  History,
  Loader2,
  RefreshCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import { SettingsRow, StatusBadge } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  useRecommendation,
  useRecommendationSliders,
  useSettings,
} from '@/hooks';

interface SettingsProps {
  onLibraryUpdate: () => void;
}

export default function Settings({ onLibraryUpdate }: SettingsProps) {
  const { keys, setKeys, loading, status, progress, actions } =
    useSettings(onLibraryUpdate);

  // Hook de Recomendação para gerenciar configs
  const { config, updateConfig, resetFeedback, ignoredIds } =
    useRecommendation();

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
            Gerencie suas integrações, chaves de API e dados locais.
          </p>
        </div>

        <StatusBadge type={status.type} message={status.message} />
      </div>

      <Separator />

      {/* SEÇÃO 1: PLATAFORMAS */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Plataformas</h3>
        <SettingsRow
          icon={Gamepad2}
          title="Credenciais da Steam"
          description="Necessário para importar sua biblioteca e conquistas."
        >
          <div className="grid gap-3">
            <Input
              placeholder="Steam ID (ex: 7656...)"
              value={keys.steamId}
              onChange={e => setKeys({ ...keys, steamId: e.target.value })}
              className="bg-background/50"
            />
            <Input
              type="password"
              placeholder="API Key da Steam"
              value={keys.steamApiKey}
              onChange={e => setKeys({ ...keys, steamApiKey: e.target.value })}
              className="bg-background/50"
            />
          </div>
        </SettingsRow>

        <SettingsRow
          icon={CloudDownload}
          title="Sincronizar Jogos"
          description="Importa jogos comprados na sua conta Steam."
        >
          <Button
            onClick={actions.importLibrary}
            variant="outline"
            className="w-full"
            disabled={loading.importing}
          >
            {loading.importing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CloudDownload className="mr-2 h-4 w-4" />
            )}
            Iniciar Importação
          </Button>
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
          <div className="space-y-3 pt-2">
            <div className="text-muted-foreground flex justify-between text-xs font-medium">
              <span>Meu Perfil ({100 - weights}%)</span>
              <span>Comunidade ({weights}%)</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={weights}
              onChange={e => handleWeightChange(parseInt(e.target.value))}
              className="bg-secondary accent-primary h-2 w-full cursor-pointer appearance-none rounded-lg"
            />
            <p className="text-muted-foreground text-xs">
              {weightsDescription(weights)}
            </p>
          </div>
        </SettingsRow>

        {/* Slider: Age Decay */}
        <SettingsRow
          icon={History}
          title="Fator Nostalgia"
          description="Define o quanto jogos antigos são penalizados nas recomendações."
        >
          <div className="space-y-3 pt-2">
            <div className="text-muted-foreground flex justify-between text-xs font-medium">
              <span>Novidades (90%)</span>
              <span>Clássicos (100%)</span>
            </div>
            <input
              type="range"
              min="90"
              max="100"
              step="1"
              value={decay}
              onChange={e => handleDecayChange(parseInt(e.target.value))}
              className="bg-secondary accent-primary h-2 w-full cursor-pointer appearance-none rounded-lg"
            />
            <p className="text-muted-foreground text-xs">
              Valor atual: {decay}%. {decayDescription(decay)}
            </p>
          </div>
        </SettingsRow>

        <SettingsRow
          icon={Sparkles}
          title="Priorizar Séries"
          description="Dar peso extra para sequências de jogos que você gosta."
        >
          <div className="flex justify-end">
            <label className="relative inline-flex cursor-pointer items-center gap-3">
              <span
                className={`text-sm font-medium transition-colors ${
                  !config.favor_series
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                Desativado
              </span>
              <input
                type="checkbox"
                className="peer sr-only"
                checked={config.favor_series}
                onChange={e => handleSeriesToggle(e.target.checked)}
              />
              <div className="peer bg-input relative h-6 w-11 rounded-full after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-5.5 peer-checked:after:border-white dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-green-800"></div>
              <span
                className={`text-sm font-medium transition-colors ${
                  config.favor_series
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                Ativado
              </span>
            </label>
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

      {/* SEÇÃO 3: METADADOS */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Metadados</h3>
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
                  'Baixar Capas'
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
      </section>

      {/* SEÇÃO 4: TRADUÇÃO COM IA */}
      <section className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          Tradução com IA
        </h3>
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

      {/* SEÇÃO 5: ZONA DE DADOS */}
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
          description="Exporte ou restaure sua biblioteca completa (JSON)."
        >
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
      </section>
    </div>
  );
}
