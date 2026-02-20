import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { check, Update } from '@tauri-apps/plugin-updater';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useUI } from '@/contexts';
import { getAppVersionInfo } from '@/services/updaterService';

interface VersionInfo {
  currentVersion: string;
  previousVersion: string;
}

/**
 * Hook responsável por gerenciar verificação e instalação de atualizações.
 *
 * - Verifica atualizações automaticamente (8s após mount + a cada 1h)
 * - Escuta eventos de backup do backend
 * - Gerencia instalação de updates
 * - Carrega informações de versão
 *
 * @returns {VersionInfo} Informações de versão atual e anterior
 */
export function useUpdateChecker(): VersionInfo {
  const { enableUpdaterChecks } = useUI();

  const [isChecking, setIsChecking] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('');
  const [previousVersion, setPreviousVersion] = useState('');
  const [updaterEnabled, setUpdaterEnabled] = useState(false);

  useEffect(() => {
    invoke<boolean>('is_updater_enabled')
      .then(setUpdaterEnabled)
      .catch(() => setUpdaterEnabled(false));
  }, []);

  // Carrega informações de versão ao montar
  useEffect(() => {
    loadVersionInfo();
  }, []);

  // Escuta eventos de backup do Tauri
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;
    let isMounted = true;

    listen('backup-created', event => {
      const backupPath = event.payload as string;
      toast.success(`Backup criado com sucesso!`, {
        description: `Localizado em: ${backupPath}`,
        duration: 5000,
      });
    }).then(fn => {
      if (isMounted) {
        unlistenFn = fn;
      } else {
        // Se desmontou antes de resolver, cleanup imediato
        fn();
      }
    });

    return () => {
      isMounted = false;

      if (unlistenFn) {
        unlistenFn();
      }
    };
  }, []);

  // Verifica updates automaticamente
  useEffect(() => {
    if (!enableUpdaterChecks || !updaterEnabled) return;

    // Aguarda 8s antes da primeira verificação (não bloqueia startup)
    const timeoutId = setTimeout(() => {
      checkForUpdates();
    }, 8000);

    // Verifica periodicamente a cada 1 hora
    const intervalId = setInterval(checkForUpdates, 1000 * 60 * 60);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [enableUpdaterChecks, updaterEnabled]);
  const loadVersionInfo = async () => {
    try {
      const versionInfo = await getAppVersionInfo();
      setCurrentVersion(versionInfo.currentVersion);
      setPreviousVersion(versionInfo.previousVersion || '0.0.0');
    } catch (error) {
      console.error('Erro ao carregar informações de versão:', error);
    }
  };

  const checkForUpdates = async () => {
    if (!updaterEnabled) return;

    // Previne múltiplas verificações simultâneas
    if (isChecking) return;

    try {
      setIsChecking(true);
      const update = await check();

      if (update?.available) {
        toast.info(`Nova versão disponível: ${update.version}`, {
          action: {
            label: 'Atualizar',
            onClick: () => installUpdate(update),
          },
          duration: 10000,
        });
      }
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      // Não mostra toast de erro para não incomodar o usuário
    } finally {
      setIsChecking(false);
    }
  };

  const installUpdate = async (update: Update) => {
    try {
      const toastId = toast.loading('Baixando atualização...', {
        duration: Infinity,
      });

      await update.downloadAndInstall(progress => {
        if (progress.event === 'Started') {
          // Download iniciado
        } else if (progress.event === 'Progress') {
          toast.loading('Baixando atualização...', {
            id: toastId,
            duration: Infinity,
          });
        } else if (progress.event === 'Finished') {
          // Download concluído
        }
      });

      toast.success('Atualização instalada! Reiniciando...', {
        id: toastId,
        duration: 2000,
      });
    } catch (error) {
      console.error('Erro ao instalar atualização:', error);
      toast.error('Falha ao instalar atualização. Tente novamente mais tarde.');
    }
  };

  return {
    currentVersion,
    previousVersion,
  };
}
