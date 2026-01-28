import { SEARCHABLE_SECTIONS } from '@/config/navigation';

/**
 * Hook para gerenciar o estado do Header baseado na seção ativa.
 *
 * Responsabilidades:
 * - Determina se a seção atual suporta busca
 * - Fornece mensagens apropriadas de placeholder
 * - Centraliza lógica de estado do header
 *
 * @param activeSection - ID da seção atualmente ativa
 * @returns Estado e configurações do header
 */
export function useHeaderState(activeSection: string) {
  /**
   * Verifica se a seção atual suporta busca
   */
  const isSearchable = SEARCHABLE_SECTIONS.includes(activeSection);

  /**
   * Placeholder apropriado baseado no estado
   */
  const searchPlaceholder = isSearchable
    ? 'Buscar jogos por nome, gênero ou plataforma...'
    : 'Busca indisponível nesta página';

  /**
   * Label de acessibilidade para o input
   */
  const searchAriaLabel = isSearchable
    ? 'Campo de busca de jogos'
    : 'Busca não disponível nesta seção';

  return {
    isSearchable,
    searchPlaceholder,
    searchAriaLabel,
  };
}
