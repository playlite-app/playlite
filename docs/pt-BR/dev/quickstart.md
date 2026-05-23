# Quickstart (Desenvolvimento)

Este guia é para quem quer rodar o Playlite localmente e contribuir.

## Pré-requisitos

- Node.js 18+
- Rust (via rustup)
- npm (ou pnpm)

## Rodando em modo dev

1. Instale dependências:

```bash
npm install
```

2. Inicie o app:

```bash
npm run tauri dev
```

Isso sobe o Vite (frontend) e o host do Tauri (backend Rust) ao mesmo tempo.

## Scripts úteis

- `npm run dev`: roda só o frontend (Vite)
- `npm run tauri dev`: roda o app desktop completo
- `npm run docs:dev`: roda a documentação (VitePress)

## Onde mexer

- Frontend (React): `src/`
- Backend (Tauri/Rust): `src-tauri/src/`
- Docs (VitePress): `docs/`

## Problemas comuns

- **Rust não instalado**: instale via https://rustup.rs
- **Build do Tauri falha no Windows**: verifique toolchain do MSVC e WebView2

