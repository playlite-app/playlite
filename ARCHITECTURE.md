# Project Architecture

This document is a living reference for the main layers of Playlite. It intentionally avoids a full file-by-file tree so it can stay useful as the project evolves.

## How to use this document

- Treat it as a high-level map of responsibilities, not as a source of truth for every file.
- Keep it updated when modules are added, renamed, or removed.
- Prefer describing stable boundaries and ownership instead of duplicating the repository tree.

## Overview

- **Frontend (`src/`)**: React UI, application state, hooks, pages, shared components, and local utilities.
- **Backend (`src-tauri/`)**: Tauri Rust backend, commands exposed to the UI, services, persistence, and platform integrations.
- **Docs (`docs/`)**: Guides, developer notes, and supporting documentation.
- **Project root**: Cross-cutting documents such as `README.md`, `ADR.md`, `ROADMAP.md`, and `CHANGELOG.md`.

## High-level flow

1. The UI triggers Rust commands through Tauri IPC.
2. Rust commands coordinate services, persistence, and integrations.
3. Results are cached or normalized when needed.
4. The UI renders the returned data and manages interactive state.

## Main areas and responsibilities

### Frontend (`src/`)

- `App.tsx`, `main.tsx`, and `index.css`: application bootstrap and global styling.
- `components/`: reusable UI building blocks shared across pages and dialogs.
- `contexts/`: application-wide state providers for the library and UI.
- `dialogs/`: modal flows for actions such as adding games, wishlist items, and profile settings.
- `hooks/`: reusable logic grouped by domain, including library, recommendation, trending, update, user, wishlist, and common utilities.
- `providers/`: top-level React providers for confirm dialogs and update handling.
- `services/`: client-side adapters that encapsulate calls to Tauri commands and external behavior.
- `types/`: shared TypeScript contracts used across the frontend.
- `ui/`: low-level design-system primitives.
- `utils/`: cross-cutting helpers for formatting, navigation, launching, and recommendation support.
- `views/`: route-level screens such as Home, Libraries, Wishlist, Trending, Settings, and Favorites.
- `windows/GameDetail/`: the game detail window and its local components.

### Backend (`src-tauri/`)

- `commands/`: Tauri command handlers grouped by domain, including games, settings, wishlist, metadata, recommendation, versioning, system, and achievements.
- `database/`: database initialization, core persistence logic, backups, configurations, and migrations.
- `services/`: backend service layer for cache management, image handling, integrations, playtime, recommendation, and tags.
- `sources/`: data sources and scanners used to discover library content.
- `utils/`: shared backend helpers such as HTTP, logging, OAuth, series detection, status logic, and tag utilities.
- `models.rs`, `errors.rs`, `constants.rs`, `security.rs`, and related files: backend domain types, error handling, configuration, and security support.
- `data/`: backend datasets used by recommendation and tagging workflows.

### Documentation and support files

- `README.md`: project overview and quick start.
- `ADR.md`: architectural decisions.
- `ROADMAP.md`: planned improvements.
- `CHANGELOG.md`: release notes and notable changes.
- `CONTRIBUTING.md`: contribution guidelines.

## Boundary notes

- The frontend should depend on backend commands through the Tauri interface, not on internal Rust implementation details.
- Domain-specific logic should live close to its layer: UI concerns in React, business rules in Rust services, and shared contracts in `types/` and Rust models.
- Large features should be documented here at the module level, while file-level detail can live in code comments, `README.md`, or deeper docs when needed.

## Maintenance guideline

When the architecture changes, update the relevant section instead of rewriting a full repository tree. This keeps the document readable, resilient to refactors, and useful as a living overview.
