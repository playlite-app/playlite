import { listen } from '@tauri-apps/api/event';
import { relaunch } from '@tauri-apps/plugin-process';
import { check, Update } from '@tauri-apps/plugin-updater';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { MajorUpdateModal } from '@/components/modals/MajorUpdateModal';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { getAppVersionInfo } from '@/services/updaterService';

/**
 * Componente responsável por gerenciar atualizações automáticas
 * Verifica updates disponíveis e coordena o processo de instalação
 */
export function UpdateManager() {
  const { isMajorOpen, closeMajorModal } = useAppUpdate();

  const [isChecking, setIsChecking] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [updateAvailable, setUpdateAvailable] = useState<Update | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [downloadProgress, setDownloadProgress] = useState(0);
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
    checkForUpdates();

    // Verifica periodicamente (a cada 1 hora)
    const interval = setInterval(checkForUpdates, 1000 * 60 * 60);

    return () => clearInterval(interval);
  }, []);

  const checkForUpdates = async () => {
    if (isChecking) return;

    try {
      setIsChecking(true);
      const update = await check();

      if (update?.available) {
        setUpdateAvailable(update);
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

      // Monitora progresso do download
      await update.downloadAndInstall(progress => {
        if (progress.event === 'Started') {
          setDownloadProgress(0);
        } else if (progress.event === 'Progress') {
          // O progresso é reportado como chunkLength, precisamos acumular
          const chunkLength = progress.data.chunkLength;
          setDownloadProgress(prev => prev + chunkLength);

          // Para mostrar porcentagem aproximada, podemos usar uma abordagem simples
          toast.loading('Baixando atualização...', {
            id: toastId,
            duration: Infinity,
          });
        } else if (progress.event === 'Finished') {
          setDownloadProgress(100);
        }
      });

      toast.success('Atualização instalada! Reiniciando...', {
        id: toastId,
        duration: 2000,
      });

      // Aguarda 2 segundos antes de reiniciar
      setTimeout(async () => {
        await relaunch();
      }, 2000);
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
