import {
  AlertCircle,
  CheckCircle,
  CloudDownload,
  Database,
  Download,
  ExternalLink,
  Gamepad2,
  HardDrive,
  Loader2,
  RefreshCcw,
  Save,
  Search,
  ShoppingCart,
  Sparkles,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

import { useSettings } from '../hooks/useSettings';

interface SettingsProps {
  onLibraryUpdate: () => void;
}

const SettingsRow = ({
  icon: Icon,
  title,
  description,
  children,
  className = '',
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-card flex flex-col gap-4 rounded-xl border p-6 md:flex-row md:items-center md:justify-between ${className}`}
  >
    <div className="flex items-start gap-4">
      <div className="text-primary mt-1 rounded-lg bg-blue-500/10 p-2">
        <Icon size={24} />
      </div>
      <div className="space-y-1">
        <h3 className="leading-none font-semibold tracking-tight">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
    <div className="w-full md:w-auto md:min-w-75">{children}</div>
  </div>
);

export default function Settings({ onLibraryUpdate }: SettingsProps) {
  const { keys, setKeys, loading, status, progress, cacheStats, actions } =
    useSettings(onLibraryUpdate);

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

        {status.type && (
          <div
            className={`animate-in fade-in slide-in-from-top-2 flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-medium shadow-sm ${
              status.type === 'success'
                ? 'border-green-500/20 bg-green-500/10 text-green-500'
                : 'border-red-500/20 bg-red-500/10 text-red-500'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            {status.message}
          </div>
        )}
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

      {/* SEÇÃO 2: METADADOS */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Metadados</h3>
        {/* RAWG */}
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
              {/* BOTÃO 1: Metadados (Usa loading.enriching) */}
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

              {/* BOTÃO 2: Capas (Usa loading.fetchingCovers) */}
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

            {/* Feedback de Progresso (Mostra se QUALQUER um estiver rodando) */}
            {(loading.enriching || loading.fetchingCovers) && progress && (
              <div className="text-muted-foreground animate-pulse text-center text-xs">
                Processando: {progress.game} ({progress.current}/
                {progress.total})
              </div>
            )}
          </div>
        </SettingsRow>
      </section>

      {/* SEÇÃO 3: TRADUÇÃO COM IA */}
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

      {/* SEÇÃO 4: GERENCIAMENTO DE CACHE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Gerenciamento de Cache</h3>
          {cacheStats && (
            <div className="text-muted-foreground text-xs">
              {cacheStats.total} entradas armazenadas
              {cacheStats.expired > 0 && (
                <span className="ml-2 text-yellow-500">
                  ({cacheStats.expired} expiradas)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Estatísticas do Cache */}
        <SettingsRow
          icon={HardDrive}
          title="Estatísticas do Cache"
          description="Visualize dados armazenados localmente para acelerar atualizações."
        >
          <div className="space-y-2">
            {loading.loadingCacheStats ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              </div>
            ) : cacheStats ? (
              <div className="bg-background/50 grid grid-cols-2 gap-2 rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">RAWG:</span>
                  <span className="font-medium">
                    {cacheStats.rawg_searches}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Steam Store:</span>
                  <span className="font-medium">{cacheStats.steam_store}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Reviews:</span>
                  <span className="font-medium">
                    {cacheStats.steam_reviews}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Playtime:</span>
                  <span className="font-medium">
                    {cacheStats.steam_playtime}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center text-sm">
                Nenhum dado de cache disponível
              </p>
            )}
            <Button
              onClick={actions.loadCacheStats}
              variant="ghost"
              size="sm"
              className="w-full"
              disabled={loading.loadingCacheStats}
            >
              {loading.loadingCacheStats ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-3 w-3" />
              )}
              Atualizar Estatísticas
            </Button>
          </div>
        </SettingsRow>

        {/* Atualização Seletiva de Reviews */}
        <SettingsRow
          icon={Star}
          title="Atualizar Reviews Steam"
          description="Atualiza apenas reviews desatualizados (> 7 dias) sem reprocessar metadados."
        >
          <div className="space-y-2">
            <Button
              onClick={actions.refreshSteamReviews}
              variant="outline"
              className="w-full"
              disabled={loading.refreshingReviews}
            >
              {loading.refreshingReviews ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Star className="mr-2 h-4 w-4" />
              )}
              Atualizar Reviews
            </Button>
            {loading.refreshingReviews && progress && (
              <div className="text-muted-foreground animate-pulse text-center text-xs">
                Atualizando: {progress.game} ({progress.current}/
                {progress.total})
              </div>
            )}
          </div>
        </SettingsRow>

        {/* Atualização Automática de Preços */}
        <SettingsRow
          icon={ShoppingCart}
          title="Atualizar Preços da Wishlist"
          description="Atualiza preços desatualizados (> 3 dias) automaticamente."
        >
          <div className="space-y-2">
            <Button
              onClick={actions.autoRefreshWishlistPrices}
              variant="outline"
              className="w-full"
              disabled={loading.refreshingWishlistPrices}
            >
              {loading.refreshingWishlistPrices ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShoppingCart className="mr-2 h-4 w-4" />
              )}
              Verificar Ofertas
            </Button>
            {loading.refreshingWishlistPrices && progress && (
              <div className="text-muted-foreground animate-pulse text-center text-xs">
                Verificando: {progress.game} ({progress.current}/
                {progress.total})
              </div>
            )}
          </div>
        </SettingsRow>

        {/* Limpeza de Cache */}
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
              disabled={
                loading.cleaningCache || !cacheStats || cacheStats.expired === 0
              }
              title={
                cacheStats?.expired === 0
                  ? 'Nenhum dado expirado'
                  : `Remover ${cacheStats?.expired} entradas expiradas`
              }
            >
              {loading.cleaningCache ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              Expirados
              {cacheStats && cacheStats.expired > 0 && (
                <span className="ml-1 text-xs">({cacheStats.expired})</span>
              )}
            </Button>
            <Button
              onClick={actions.clearAllCache}
              variant="outline"
              className="flex-1 text-red-500 hover:bg-red-500/10"
              disabled={
                loading.clearingAllCache ||
                !cacheStats ||
                cacheStats.total === 0
              }
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
          icon={Database}
          title="Gerenciar Backup"
          description="Exporte ou restaure sua biblioteca completa (JSON)."
        >
          <div className="flex gap-2">
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
                  <Download className="mr-2 h-4 w-4" /> Importar
                </>
              )}
            </Button>
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
                  <Upload className="mr-2 h-4 w-4" /> Exportar
                </>
              )}
            </Button>
          </div>
        </SettingsRow>
      </section>
    </div>
  );
}
