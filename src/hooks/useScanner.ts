import { open } from '@tauri-apps/plugin-dialog';
import { useState } from 'react';

import { scanGamesFolder } from '@/services/scannerService';
import { ScanResult } from '@/types/scanner';

/** Hook para gerenciar o estado e lógica de escaneamento de pasta de jogos.
 *
 * @returns Estado e funções para escanear a pasta de jogos
 */
export function useScanner() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('');

  const handleSelectFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Selecione a pasta de jogos',
    });

    if (selected) {
      setSelectedFolder(selected);
    }
  };

  const handleScan = async () => {
    if (!selectedFolder) return;

    setScanning(true);

    try {
      const scanResult = await scanGamesFolder(selectedFolder);
      setResult(scanResult);
    } catch (error) {
      console.error('Erro ao escanear:', error);
    } finally {
      setScanning(false);
    }
  };

  return {
    scanning,
    result,
    selectedFolder,
    handleSelectFolder,
    handleScan,
  };
}
