/**
 * Hooks organizados por domínio/feature
 *
 * Estrutura:
 * - analysis/       - Análise e relatórios
 * - library/        - Gerenciamento de biblioteca
 * - tooltips/ - Sistema de recomendação
 * - trending/       - Jogos em alta e lançamentos
 * - wishlist/       - Lista de desejos
 * - ui/             - Componentes de interface
 * - user/           - Perfil e detalhes
 * - common/         - Utilitários genéricos
 */

// Library hooks
export * from './library';

// Recommendation hooks
export * from './recommendation';

// Trending hooks
export * from './trending';

// Wishlist hooks
export * from './wishlist';

// UI hooks
export * from './ui';

// User hooks
export * from './user';

// Common hooks
export * from './common';

// Special hooks (na raiz)
export * from './useAppUpdate';
export * from './useHome';
export * from './useSettings';
