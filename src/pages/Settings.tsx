import {
  AlertCircle,
  CheckCircle,
  CloudDownload,
  Download,
  Loader2,
  Save,
  Shield,
  Sparkles,
  Upload,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useSettings } from '../hooks/useSettings';

interface SettingsProps {
  onLibraryUpdate: () => void;
}

export default function Settings({ onLibraryUpdate }: SettingsProps) {
  const { keys, setKeys, loading, status, actions } =
    useSettings(onLibraryUpdate);

  if (loading.initial) {
    return (
      <div className="flex-1 p-8">
        <h2 className="mb-6 text-3xl font-bold">Configurações</h2>
        <div className="text-muted-foreground flex items-center gap-2">
          <Loader2 className="animate-spin" /> Carregando chaves...
        </div>
      </div>
    );
  }

  return (
    <div className="custom-scrollbar flex-1 overflow-y-auto p-8 pb-20">
      <h2 className="mb-6 text-3xl font-bold">Configurações</h2>

      {/* Feedback Visual */}
      {status.type && (
        <div
          className={`mb-6 flex items-center gap-3 rounded-lg p-4 ${
            status.type === 'success'
              ? 'border border-green-500/20 bg-green-500/10 text-green-500'
              : 'border border-red-500/20 bg-red-500/10 text-red-500'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span className="font-medium">{status.message}</span>
        </div>
      )}

      {/* Formulário de Chaves */}
      <div className="space-y-6">
        <div className="border-border bg-card grid gap-6 rounded-xl border p-6">
          <div className="flex items-center gap-2">
            <Shield className="text-green-500" size={20} />
            <h3 className="text-lg font-semibold">Credenciais de API</h3>
          </div>
          {/* Steam ID */}
          <div className="grid gap-2">
            <Label>Steam ID</Label>
            <Input
              value={keys.steamId}
              onChange={e => setKeys({ ...keys, steamId: e.target.value })}
              placeholder="765..."
            />
          </div>
          {/* Steam API Key */}
          <div className="grid gap-2">
            <Label>Steam API Key</Label>
            <Input
              type="password"
              value={keys.steamApiKey}
              onChange={e => setKeys({ ...keys, steamApiKey: e.target.value })}
              placeholder="••••••••••••••••"
            />
          </div>
          {/* RAWG API Key */}
          <div className="grid gap-2">
            <Label>RAWG API Key</Label>
            <Input
              type="password"
              value={keys.rawgApiKey}
              onChange={e => setKeys({ ...keys, rawgApiKey: e.target.value })}
              placeholder="••••••••••••••••"
            />
          </div>
          {/* Botão Salvar */}
          <Button
            onClick={actions.saveKeys}
            className="mt-2 w-full"
            disabled={loading.saving}
          >
            {loading.saving ? (
              <Loader2 className="mr-2 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Todas as Configurações
          </Button>
        </div>

        {/* Ações de Biblioteca */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="border-border bg-card rounded-xl border p-6">
            <div className="mb-4 flex items-center gap-2 text-blue-500">
              <CloudDownload />
              <h3 className="text-foreground font-semibold">
                Sincronizar Steam
              </h3>
            </div>
            <p className="text-muted-foreground mb-4 text-sm">
              Importa os jogos da sua conta.
            </p>
            <Button
              onClick={actions.importLibrary}
              variant="outline"
              className="w-full"
              disabled={loading.importing}
            >
              {loading.importing ? (
                <Loader2 className="mr-2 animate-spin" />
              ) : (
                'Iniciar Importação'
              )}
            </Button>
          </div>
          <div className="border-border bg-card rounded-xl border p-6">
            <div className="mb-4 flex items-center gap-2 text-purple-500">
              <Sparkles />
              <h3 className="text-foreground font-semibold">Buscar Dados</h3>
            </div>
            <p className="text-muted-foreground mb-4 text-sm">
              Busca gêneros e tags detalhados.
            </p>
            <Button
              onClick={actions.enrichLibrary}
              variant="outline"
              className="w-full"
              disabled={loading.enriching}
            >
              {loading.enriching ? 'Processando...' : 'Buscar Metadados'}
            </Button>
          </div>
        </div>

        {/* Ações de Backup */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="border-border bg-card rounded-xl border p-6">
            <div className="mb-4 flex items-center gap-2 text-orange-500">
              <Download />
              <h3 className="text-foreground font-semibold">Exportar Backup</h3>
            </div>
            <p className="text-muted-foreground mb-4 text-sm">
              Salva todos os seus dados em arquivo JSON.
            </p>
            <Button
              onClick={actions.exportDatabase}
              variant="outline"
              className="w-full"
              disabled={loading.exporting}
            >
              {loading.exporting ? (
                <Loader2 className="mr-2 animate-spin" />
              ) : (
                'Exportar Database'
              )}
            </Button>
          </div>
          <div className="border-border bg-card rounded-xl border p-6">
            <div className="mb-4 flex items-center gap-2 text-cyan-500">
              <Upload />
              <h3 className="text-foreground font-semibold">Importar Backup</h3>
            </div>
            <p className="text-muted-foreground mb-4 text-sm">
              Restaura seus dados de um arquivo JSON.
            </p>
            <Button
              onClick={actions.importDatabase}
              variant="outline"
              className="w-full"
              disabled={loading.importingBackup}
            >
              {loading.importingBackup ? (
                <Loader2 className="mr-2 animate-spin" />
              ) : (
                'Importar Database'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
