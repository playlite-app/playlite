# Quickstart (Development)

This guide is for anyone who wants to run Playlite locally and contribute.

## Prerequisites

- Node.js 18+
- Rust (via rustup)
- npm (or pnpm)

## Running in dev mode

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run tauri dev
```

This starts Vite (frontend) and the Tauri host (Rust backend) at the same time.

## Useful scripts

- `npm run dev`: runs only the frontend (Vite)
- `npm run tauri dev`: runs the full desktop app
- `npm run docs:dev`: runs the documentation (VitePress)

## Where to edit

- Frontend (React): `src/`
- Backend (Tauri/Rust): `src-tauri/src/`
- Docs (VitePress): `docs/`

## Common issues

- **Rust is not installed:** install it via https://rustup.rs
- **Tauri build fails on Windows:** check the MSVC toolchain and WebView2

