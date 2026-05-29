import { invoke } from '@tauri-apps/api/core';
import {
  ChevronDown,
  ExternalLink,
  Gamepad2,
  Loader2,
  Save,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useNetworkStatus } from '@/hooks/common/useNetworkStatus';
import { ServiceId, SUBSCRIPTION_SERVICES } from '@/types';
import { Button } from '@/ui/button';
import { Switch } from '@/ui/toggle-switch';
import { openExternalLink } from '@/utils/openLink';
import { toast } from '@/utils/toast';

// Componente principal de configuração das assinaturas
interface SubscriptionsConfigProps {
  className?: string;
}

export function SubscriptionsConfig({
  className = '',
}: Readonly<SubscriptionsConfigProps>) {
  const { t } = useTranslation('subscription');
  const isOnline = useNetworkStatus();
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
      toast.success(t('config_save_success_toast'));
    } catch {
      toast.error(t('config_save_error_toast'));
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
              {t('config_title')}
            </h3>
            <p className="text-muted-foreground mt-1.5 text-sm">
              {loading ? (
                t('config_loading_text')
              ) : activeNames.length > 0 ? (
                <>
                  {t('config_active_prefix')}{' '}
                  <span className="text-foreground font-medium">
                    {activeNames.join(', ')}
                  </span>
                </>
              ) : (
                t('config_no_services_selected')
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
                  className="bg-secondary-foreground/5 text-secondary-foreground rounded-full border px-2 py-0.5 text-xs"
                >
                  {name}
                </span>
              ))}
              {activeNames.length > 3 && (
                <span className="text-secondary-foreground text-xs">
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
                              {t(`service_${service.id}_description`)}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          {/* Link externo do serviço */}
                          <a
                            href={service.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={e => {
                              // Prevent the parent button click and default navigation
                              e.stopPropagation();
                              e.preventDefault();
                              openExternalLink(service.url);
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title={t('config_open_service_title', {
                              service: service.name,
                            })}
                          >
                            <ExternalLink size={13} />
                          </a>
                          <Switch
                            checked={isEnabled}
                            onChange={() => toggleService(service.id)}
                            labelOff={t('config_no_label')}
                            labelOn={t('config_yes_label')}
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
                      {t('config_ea_play_warning', {
                        ea_play: 'EA Play',
                        game_pass_pc: 'Game Pass PC',
                      })}
                    </p>
                  </div>
                )}

                {/* Aviso de seções indisponíveis offline */}
                {!isOnline && (
                  <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3">
                    <p className="text-xs text-yellow-400">
                      {t('config_offline_unavailable_warning', {
                        defaultValue:
                          'As seções de assinaturas estão indisponíveis offline',
                      })}
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
                    {t('config_save_button')}
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
