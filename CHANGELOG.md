# Changelog

All notable changes to this project will be documented in this file.

## [3.2.9] - 2026-05-11

### Added

- Automated CI/CD release pipeline with GitHub Actions
- Automatic updater artifact generation
- Cryptographic signing for updater packages
- Automated latest.json generation
- Improved release distribution workflow

### Improved

- Release engineering and deployment process
- Cross-platform packaging pipeline
- Update reliability and integrity verification

## [3.1.0] - 2026-02-12

### Added

- **Local Directory Scanner**: New feature that allows monitoring PC folders to automatically add games
  to the Playlite library.
- **Steam Installation Detection**: The Steam importer now identifies which games are already installed on the system,
  marking them correctly in the interface.
- **New UI Structure**: Complete refactoring of interface components, including a new Dialog system and
  lighter, more responsive Tooltips.

### Changed

- **Backend Refactoring (Rust)**: Restructuring of integrations in the Rust core for greater stability and
  performance in IPC (Inter-Process Communication).
- **Asset Optimization**: Improved loading of cover art from the GamerPower API, fixing display failures on
  unstable connections.
- **Import Flow**: The Steam sync process is now more resilient, skipping corrupted entries without
  interrupting the entire task.

### Fixed

- **Cover Art Loading**: Fixed the error that prevented images from displaying correctly in the "Free Games"
  (GamerPower) tab.
- **Tooltip Positioning**: Fine-tuned tooltip coordinate calculation to prevent them from going off-screen
  on smaller resolutions.
- **Import Stability**: Resolved a bug where the local scanner could enter an infinite loop in folders
  containing symbolic links (symlinks).

## [3.0.0] - 2026-02-01

### Added

- **Hybrid Recommendation System (v4.0)**: The algorithm now cross-references your local profile (Content-Based)
  with data obtained from Steam users (Collaborative Filtering) to suggest games.
- **Transparency (XAI)**: Added *Smart Tooltips* on recommendations that explain the reason for the suggestion
  (e.g. "Favorite Series", "Community Trend", "High Tag Affinity").
- **Feedback Loop**: "Not Useful" (Dislike) button on recommendations, allowing the user to train the algorithm
  by ignoring specific games.
- **Automatic Update System**: Full integration with Tauri Updater. The app now checks, downloads and installs
  updates, creating **Automatic Backups** of the database before critical changes (Major Updates).
- **Resilient Offline Mode**: The "Trending", "Upcoming" and "Free Games" pages now work without internet,
  using a smart cache ("Stale-while-revalidate") and displaying an informational banner.
- **Algorithm Settings**: New section in Settings allowing adjustment of weights (Profile vs Community),
  time penalty (Nostalgia) and series prioritization.
- **Hybrid Image Cache**: Option to save cover art locally for offline viewing or save space by using
  only remote URLs.
- **Giveaways**: GamerPower integration for discovering free games.
- **AI Auto-Translation**: Game description translation using the Gemini API.

### Changed

- **GameDetailModal Refactoring**: Component restructured into smaller files, with performance and UX improvements.
- **Hooks Refactoring**: `useTrending`, `useUpcoming` and `useGiveaways` rewritten to handle network failures and
  transparently serve data from the local cache (`api_cache`).
- **metadata.rs Refactoring**: File split into smaller modules, with improvements in error handling
  and detailed logging.
- **Advanced Wishlist**: The Wishlist now has the option to import lists from Steam and IsThereAnyDeal, in addition
  to monitoring prices and discount coupons.
- **Database Architecture**: Introduction of the `app_config` table for generic system settings (Installation Date,
  Schema Version).
- **Settings Interface**: Replaced standard checkboxes with the visual `ToggleSwitch` component for better UX.
- **Cache Handling**: Optimized differentiated TTL (Time-To-Live) for lists (24h) vs game details (30 days).

### Fixed

- Fixed persistence of settings where certain algorithm weights were not being saved correctly.
- Resolved issue where the "Trending" page showed a fatal error screen upon losing connection; it now degrades
  gracefully to the cache.

## [2.0.0] - 2026-01-12

### Added

- **SQLite Database**: Complete migration of storage to SQLite (`library.db` and `secrets.db`), enabling
  complex relationships between games and details.
- **Recommendation System v2 (Rust)**: New native backend algorithm that calculates affinity based on genre, tags
  and series, applying a time penalty (Age Decay) for games that haven't been played in a long time.
- **IsThereAnyDeal Integration**: The Wishlist now fetches prices from multiple stores, historical lowest price,
  and automatically identifies **Discount Coupons**.
- **HLTB Backend Support**: Implementation of the search service for *HowLongToBeat* in the backend
  (preparation for future UI).
- **Voucher Column**: Added visual support to display coupon codes directly on game cards in the Wishlist.

### Changed

- **Agnostic Architecture**: The system no longer relies exclusively on Steam for metadata, prioritizing the
  RAWG API for cover art and descriptions.
- **Hooks Refactoring**: `useRecommendation` and `useHome` rewritten to consume data processed by Rust,
  removing heavy calculations from JavaScript.
- **Backup System**: Updated to include the new `wishlist` and `game_details` tables in JSON export/import.
- **Detailed Logs**: Improved tracing logs for database operations and HTTP requests.

### Removed

- **Legacy v1 Logic**: Removed old affinity calculation functions from the frontend.
- **Deprecated Fields**: Cleanup of unused fields in configuration interfaces.

## [1.2.0] - 2026-01-06

### Added

- **ConfirmProvider**: Global system of custom confirmation dialogs (replacing the native `window.confirm`).
- Complete Backend (Rust) documentation, generatable via `cargo doc`.
- Visual feedback toasts for all delete and edit operations.
- JSDocs on the main reusable Hooks and Components.

### Changed

- Complete refactoring of the types folder structure (`src/types/`), now split by domain.
- Modernization of the Rust module structure (Rust 2018+ standard).
- Visual standardization of action buttons (Play, Favorite, Menu) using the new `ActionButton` component.
- Responsiveness adjustments in the Details Modal for windows with reduced height.

### Fixed

- "Race Condition" bug on deletion: The delete action was occurring before the user's confirmation. Fixed with
  proper implementation of `async/await` in the confirmation flow.

## [1.1.0] - 2026-01-02

### Added

- Error logging to facilitate debugging and future improvements.
- Button to manually add a game to the wishlist.
- ChangeLog.md for documenting project changes.
- ErrorBoundary component to catch errors in React components and display a friendly message to the user.

### Changed

- UI improvements on the Library page, now with a custom empty state when no games have been imported.
- UI improvements on the Trending page, now with a custom empty state indicating the type of error that occurred
  (connection error, API error, etc.).
- Performance improvements for Steam game metadata import, reducing load time.

### Removed

- CheapShark API integration for game prices, due to instability and prices in USD only.

## [1.0.1] - 2026-01-02

### Added

- Animated loading screen on the Home page with Playlite's visual identity.

### Removed

- Native splashscreen to improve perceived loading speed.

## [1.0.0] - 2026-01-01

### Added

- Initial release of Playlite (Desktop MVP).
- Steam integration for library import.
- Content-based Recommendation System.
- Database Backup and Restore support (JSON).
- Local encryption (AES-256) for credentials.
