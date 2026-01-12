# 🎮 Game Manager

<div align="center">

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/Alan-oliveir/game_manager?label=version&color=blue)](https://github.com/Alan-oliveir/game_manager/releases/latest)
![License](https://img.shields.io/badge/license-MIT-green)
<br/>
![Rust](https://img.shields.io/badge/Rust-000000?logo=rust&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-24C8DB?logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)

</div>

Gerenciador de biblioteca de jogos desktop (local-first) com sistema inteligente de recomendação baseado em Machine
Learning clássico.

![Demo do Playlite](https://github.com/Alan-oliveir/game_manager/blob/main/docs/assets/demo.gif?raw=true)

## 💡 Motivação

Tenho uma biblioteca grande de jogos e frequentemente fico em dúvida sobre qual jogar depois.
Este projeto nasceu para resolver esse problema real, ao mesmo tempo em que serve como um projeto completo de portfólio
para explorar Rust, Tauri, React e sistemas de recomendação.

## ✨ Funcionalidades

- Gerenciamento completo de biblioteca de jogos (CRUD)
- Persistência local com SQLite (offline-first)
- Interface desktop inspirada na Microsoft Store
- Sistema de favoritos, avaliações e tempo de jogo
- Base para sistema de recomendação inteligente
- Backup e Restauração de dados (JSON)

## 🛠️ Stack

- **Desktop:** Tauri v2 + Rust
- **Frontend:** React + TypeScript + Vite
- **UI:** Tailwind CSS v4 + Shadcn/UI
- **Database:** SQLite (local)

## 🧱 Arquitetura (High-level)

- Aplicação desktop local-first
- Core de negócio em Rust
- UI desacoplada em React
- Comunicação via Tauri Commands
- Banco SQLite embarcado

## 📚 Documentação Adicional

- Decisões arquiteturais (ADR): [`ADR.md`](ADR.md)
- Atualizações do projeto: [`CHANGELOG.md`](CHANGELOG.md)
- Diário de desenvolvimento: [`DEV_LOG.md`](DEV_LOG.md)
- Guia de contribuição: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Roadmap: [`ROADMAP.md`](ROADMAP.md)

## 🤖 Sistema de Recomendação

O sistema de recomendação é baseado em **Machine Learning clássico**, priorizando performance, privacidade e
funcionamento offline.

- Content-based filtering
- Similaridade entre jogos
- Regras de negócio
- LLM opcional apenas para explicação das sugestões

## 🚀 Como rodar localmente

### Requisitos

- Node.js 18+
- Rust (rustup)
- npm ou pnpm

### Setup

```bash
# Clone o repositório
git clone <repo-url>
cd game_manager

# Volte para a raiz e instale dependências
cd ..
npm install
```

### Desenvolvimento

```bash
npm run tauri dev
```

### Build de Produção

```bash
npm run tauri build
```

## 🤝 Contribuição

Sugestões e contribuições são bem-vindas!
Veja o arquivo [`CONTRIBUTING.md`](CONTRIBUTING.md).

## 📄 Licença

Este projeto está sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.
