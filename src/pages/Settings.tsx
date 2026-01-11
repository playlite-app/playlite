import {
  AlertCircle,
  CheckCircle,
  CloudDownload,
  Database,
  Download,
  Gamepad2,
  KeyRound,
  Loader2,
  Save,
  Search,
  ShoppingBag,
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

// Subcomponente para criar o visual "Microsoft Store Settings"
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
  const { keys, setKeys, loading, status, progress, actions } =
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
          <p className="text-muted-foreground mt-2">
            Gerencie suas integrações, chaves de API e dados locais.
          </p>
        </div>

        {/* Feedback Flutuante ou Fixo no topo */}
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
            variant="secondary"
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

      {/* SEÇÃO 2: METADADOS (IGDB & RAWG) */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Metadados</h3>

        <SettingsRow
          icon={KeyRound}
          title="IGDB"
          description="Client ID e Secret para baixar capas oficiais e detalhes."
        >
          <div className="grid gap-3">
            <Input
              placeholder="Client ID"
              value={keys.igdbClientId}
              onChange={e => setKeys({ ...keys, igdbClientId: e.target.value })}
              className="bg-background/50"
            />
            <Input
              type="password"
              placeholder="Client Secret"
              value={keys.igdbClientSecret}
              onChange={e =>
                setKeys({ ...keys, igdbClientSecret: e.target.value })
              }
              className="bg-background/50"
            />
          </div>
        </SettingsRow>

        {/* RAWG (Legado/Alternativo) */}
        <SettingsRow
          icon={Search}
          title="RAWG.io"
          description="Usado como fonte de jogos em alta e lançamentos próximos."
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
              {/*  Atualiza detalhes e descrição */}
              <Button
                onClick={actions.enrichLibrary}
                variant="secondary"
                //className="w-full"
                className="flex-1"
                disabled={loading.enriching}
              >
                {loading.enriching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Atualizar Metadados'
                )}
              </Button>

              {/* Botão para baixar apenas capas faltantes */}
              <Button
                onClick={actions.fetchMissingCovers}
                variant="outline"
                className="flex-1"
                disabled={loading.enriching}
                title="Busca apenas capas para jogos que estão sem imagem"
              >
                {loading.enriching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Baixar Capas'
                )}
              </Button>
            </div>

            {/* Feedback de Progresso */}
            {loading.enriching && progress && (
              <div className="text-muted-foreground animate-pulse text-center text-xs">
                Processando: {progress.game} ({progress.current}/
                {progress.total})
              </div>
            )}
          </div>
        </SettingsRow>
      </section>

      {/* NOVO BLOCO: IsThereAnyDeal */}
      <SettingsRow
        icon={ShoppingBag}
        title="IsThereAnyDeal"
        description="Chave de API para buscar preços e ofertas (Waitlist)."
      >
        <div className="grid gap-2">
          <Input
            type="password"
            placeholder="Cole sua API Key v2 da ITAD"
            value={keys.itadApiKey}
            onChange={e => setKeys({ ...keys, itadApiKey: e.target.value })}
            className="bg-background/50"
          />
          <p className="text-muted-foreground text-[10px]">
            Crie um app e gere sua chave em:{' '}
            <a
              href="https://isthereanydeal.com/settings/developer"
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary underline"
            >
              Painel de Desenvolvedor
            </a>
          </p>
        </div>
      </SettingsRow>

      {/* SEÇÃO 3: SISTEMA E DADOS */}
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
              <Loader2 className="mr-2 animate-spin" />
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
                  <Download className="mr-2 h-4 w-4" /> Exportar
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
                  <Upload className="mr-2 h-4 w-4" /> Importar
                </>
              )}
            </Button>
          </div>
        </SettingsRow>
      </section>
    </div>
  );
}
