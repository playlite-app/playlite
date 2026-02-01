import { listen } from '@tauri-apps/api/event';
import { check, Update } from '@tauri-apps/plugin-updater';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { MajorUpdateModal } from '@/components/modals/MajorUpdateModal';
import { useUI } from '@/contexts';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { getAppVersionInfo } from '@/services/updaterService';

/**
 * Componente responsável por gerenciar atualizações automáticas
 * Verifica updates disponíveis e coordena o processo de instalação
 */
export function UpdateManager() {
  const { isMajorOpen, closeMajorModal } = useAppUpdate();
  const { enableUpdaterChecks } = useUI();

  const [isChecking, setIsChecking] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('');
  const [previousVersion, setPreviousVersion] = useState('');

  // Carrega informações de versão
  useEffect(() => {
    loadVersionInfo();

    // Escuta eventos de backup criado
    const unlisten = listen('backup-created', event => {
      const backupPath = event.payload as string;
      toast.success(`Backup criado com sucesso!`, {
        description: `Localizado em: ${backupPath}`,
        duration: 5000,
      });
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  const loadVersionInfo = async () => {
    try {
      const versionInfo = await getAppVersionInfo();
      setCurrentVersion(versionInfo.currentVersion);
      setPreviousVersion(versionInfo.previousVersion || '0.0.0');
    } catch (error) {
      console.error('Erro ao carregar informações de versão:', error);
    }
  };

  // Verifica updates ao montar o componente
  useEffect(() => {
    if (!enableUpdaterChecks) return;

    const timeoutId = setTimeout(() => {
      checkForUpdates();
    }, 8000);

    // Verifica periodicamente (a cada 1 hora)
    const interval = setInterval(checkForUpdates, 1000 * 60 * 60);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [enableUpdaterChecks]);

  const checkForUpdates = async () => {
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
      // Não mostra toast para não incomodar o usuário
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

  return (
    <MajorUpdateModal
      open={isMajorOpen}
      onClose={closeMajorModal}
      currentVersion={currentVersion}
      previousVersion={previousVersion}
    />
  );
}
