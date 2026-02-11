import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';

interface AnalysisResult {
  success: boolean;
  json_path?: string;
  csv_path?: string;
  message: string;
}

interface UseRecommendationAnalysisReturn {
  isGeneratingAnalysis: boolean;
  analysisStatus: string | null;
  generateRecommendationAnalysis: () => Promise<void>;
}

/**
 * Hook customizado para gerenciar a geração de análises de recomendação
 *
 * Responsabilidades:
 * - Gerar análise completa de recomendações
 * - Exportar perfil do usuário
 * - Abrir pasta com relatórios
 * - Gerenciar estados de carregamento e status
 *
 * @returns Objeto com estado e função para gerar análise
 */
export function useRecommendationAnalysis(): UseRecommendationAnalysisReturn {
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);

  const generateRecommendationAnalysis = async () => {
    setIsGeneratingAnalysis(true);
    setAnalysisStatus('Gerando análise...');

    try {
      // 1. Gerar análise completa
      const analysisResult = await invoke<AnalysisResult>(
        'generate_recommendation_analysis',
        {
          limit: 100,
        }
      );

      console.log('Análise gerada:', analysisResult);
      setAnalysisStatus('Análise gerada com sucesso!');

      // 2. Abrir a pasta com os arquivos
      await openAnalysisFolder(analysisResult);

      // 3. Exportar perfil do usuário (opcional)
      await exportUserProfile();

      // Limpar status após 3 segundos
      setTimeout(() => {
        setAnalysisStatus(null);
      }, 3000);
    } catch (error) {
      console.error('Erro ao gerar análise:', error);
      setAnalysisStatus(`Erro: ${error}`);
      setTimeout(() => {
        setAnalysisStatus(null);
      }, 3000);
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  return {
    isGeneratingAnalysis,
    analysisStatus,
    generateRecommendationAnalysis,
  };
}

// === FUNÇÕES AUXILIARES ===

/**
 * Abre a pasta contendo os arquivos de análise
 */
async function openAnalysisFolder(
  analysisResult: AnalysisResult
): Promise<void> {
  if (!analysisResult.json_path) {
    return;
  }

  // Funciona tanto para Windows (\) quanto Unix (/)
  const separator = analysisResult.json_path.includes('\\') ? '\\' : '/';
  const dir = analysisResult.json_path.substring(
    0,
    analysisResult.json_path.lastIndexOf(separator)
  );

  try {
    // Usar o novo comando do backend
    await invoke('open_folder', { path: dir });
    console.log('Pasta aberta:', dir);
  } catch (e) {
    console.warn('Não foi possível abrir a pasta:', e);
  }
}

/**
 * Exporta o perfil do usuário
 */
async function exportUserProfile(): Promise<void> {
  try {
    const profileResult = await invoke<{
      success: boolean;
      json_path?: string;
      message: string;
    }>('export_user_profile');
    console.log('Perfil exportado:', profileResult);
  } catch (profileError) {
    console.warn('Erro ao exportar perfil:', profileError);
  }
}
