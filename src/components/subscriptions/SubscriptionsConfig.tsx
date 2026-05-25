import { invoke } from '@tauri-apps/api/core';
import {
  ChevronDown,
  ExternalLink,
  Gamepad2,
  Loader2,
  Save,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { ServiceId, SUBSCRIPTION_SERVICES } from '@/types';
import { Button } from '@/ui/button';
import { Switch } from '@/ui/toggle-switch';
import { toast } from '@/utils/toast';

// Componente principal de configuração das assinaturas
interface SubscriptionsConfigProps {
  className?: string;
}

export function SubscriptionsConfig({
  className = '',
}: Readonly<SubscriptionsConfigProps>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [enabledServices, setEnabledServices] = useState<ServiceId[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Aviso EA Play + Game Pass marcados ao mesmo tempo
  const showEaWarning =
    enabledServices.includes('game_pass_pc') &&
    enabledServices.includes('ea_play');

  // Resumo dos serviços ativos para exibir no header colapsado
  const activeNames = SUBSCRIPTION_SERVICES.filter(s =>
    enabledServices.includes(s.id)
  ).map(s => s.name);

  useEffect(() => {
    invoke<string[]>('get_subscription_settings')
      .then(data => setEnabledServices(data as ServiceId[]))
      .catch(() => setEnabledServices([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleService = (id: ServiceId) => {
    setEnabledServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      await invoke('save_subscription_settings', {
        services: enabledServices,
      });
      toast.success('Assinaturas salvas com sucesso');
    } catch {
      toast.error('Erro ao salvar assinaturas');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`bg-card overflow-hidden rounded-xl border transition-all ${className}`}
    >
      {/* Header — sempre visível, clicável */}
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className="hover:bg-accent/5 flex w-full items-center justify-between p-6 text-left transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="text-primary mt-1 rounded-lg bg-blue-500/10 p-2">
            <Gamepad2 size={24} />
          </div>
          <div>
            <h3 className="text-lg leading-none font-semibold tracking-tight">
              Serviços
            </h3>
            <p className="text-muted-foreground mt-1.5 text-sm">
              {loading ? (
                'Carregando...'
              ) : activeNames.length > 0 ? (
                <>
                  Ativos:{' '}
                  <span className="text-foreground font-medium">
                    {activeNames.join(', ')}
                  </span>
                </>
              ) : (
                'Nenhum serviço selecionado'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Badges compactos dos ativos */}
          {!loading && activeNames.length > 0 && (
            <div className="hidden items-center gap-1.5 sm:flex">
              {activeNames.slice(0, 3).map(name => (
                <span
                  key={name}
                  className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/50"
                >
                  {name}
                </span>
              ))}
              {activeNames.length > 3 && (
                <span className="text-muted-foreground text-xs">
                  +{activeNames.length - 3}
                </span>
              )}
            </div>
          )}
          <ChevronDown
            size={20}
            className={`text-muted-foreground transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Conteúdo expansível */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 px-6 pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={20} className="animate-spin text-orange-400" />
              </div>
            ) : (
              <>
                {/* Lista de serviços */}
                <div className="space-y-2">
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
                            : 'border-border bg-background/30 hover:bg-accent/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <p
                              className={`text-sm font-medium ${
                                isEnabled ? service.color : 'text-foreground'
                              }`}
                            >
                              {service.name}
                            </p>
                            <p className="text-muted-foreground mt-0.5 text-xs">
                              {service.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          {/* Link externo do serviço */}
                          <a
                            href={service.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title={`Abrir ${service.name}`}
                          >
                            <ExternalLink size={13} />
                          </a>
                          <Switch
                            checked={isEnabled}
                            onChange={() => toggleService(service.id)}
                            labelOff="Não"
                            labelOn="Sim"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Aviso EA Play + Game Pass */}
                {showEaWarning && (
                  <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3">
                    <p className="text-xs text-yellow-400">
                      ⚠️ O <strong>EA Play</strong> já está incluído no{' '}
                      <strong>Game Pass PC</strong>. Os jogos aparecerão apenas
                      uma vez na Home.
                    </p>
                  </div>
                )}

                {/* Botão salvar */}
                <div className="flex justify-end border-t border-white/5 pt-3">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-75 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Salvar Assinaturas
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
