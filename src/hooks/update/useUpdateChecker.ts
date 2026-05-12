import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { check, Update } from '@tauri-apps/plugin-updater';
import { useEffect, useRef, useState } from 'react';
import { toast } from '@/utils/toast';

import { useUI } from '@/contexts';
import { getAppVersionInfo } from '@/services/updaterService';

interface VersionInfo {
  currentVersion: string;
  previousVersion: string;
  checkForUpdates: () => Promise<void>;
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

  // useRef do hook para evitar verificações concorrentes de updates
  const isCheckingRef = useRef(false);

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
      toast.success('Backup criado com sucesso!', {
        description: `Localizado em: ${backupPath}`,
        duration: 5000,
      });
    }).then(fn => {
      if (isMounted) {
        unlistenFn = fn;
      } else {
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
      void checkForUpdates();
    }, 8000);

    // Verifica periodicamente a cada 1 hora
    const intervalId = setInterval(
      () => void checkForUpdates(),
      1000 * 60 * 60
    );

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

  const installUpdate = async (update: Update) => {
    try {
      const toastId = toast.loading('Baixando atualização...', {
        duration: Infinity,
      });

      await update.downloadAndInstall(progress => {
        if (progress.event === 'Progress') {
          toast.loading('Baixando atualização...', {
            id: toastId,
            duration: Infinity,
          });
        } else if (progress.event === 'Finished') {
          // Download concluído — toast de sucesso logo abaixo
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

  const checkForUpdates = async () => {
    if (!updaterEnabled || isCheckingRef.current) return;

    try {
      isCheckingRef.current = true;
      const update = await check();

      if (update) {
        toast.info(`Nova versão disponível: ${update.version}`, {
          action: {
            label: 'Atualizar',
            onClick: () => {
              void installUpdate(update);
            },
          },
          duration: 10000,
        });
      }
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      // Não mostra toast de erro para não incomodar o usuário
    } finally {
      isCheckingRef.current = false;
    }
  };

  return {
    currentVersion,
    previousVersion,
    checkForUpdates,
  };
}

