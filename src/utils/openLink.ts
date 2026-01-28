import { open } from '@tauri-apps/plugin-shell';
import { toast } from 'sonner';

export const openExternalLink = async (url: string): Promise<void> => {
  try {
    await open(url);
  } catch (error) {
    console.error('Erro ao abrir link:', error);
    toast.error('Não foi possível abrir o link no navegador.');
  }
};
