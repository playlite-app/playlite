/**
 * Components organized by domain/feature
 *
 * Structure:
 * - layout/         - Header, Sidebar, Navigation
 * - cards/          - Game cards, stat cards
 * - modals/         - Dialogs and forms
 * - common/         - Reusable utilities
 * - tooltips/ - Recommendation related
 * - ui/             - Base UI components (shadcn/ui)
 * - wrappers/       - HOCs and wrappers
 * - GameWindow/   - Game details components
 * - profile/        - Profile components
 */

// Layout
export * from './layout';

// Cards
export * from './cards';

// Modals
export * from './modals';

// Common
export * from './common';

// Recommendation
export * from './tooltips';

// Special folders (keep existing structure)
// - ui/            (shadcn/ui components)
// - wrappers/      (ErrorBoundary, etc)
// - GameWindow/  (GameDetails subcomponents)
// - profile/       (Profile subcomponents)
