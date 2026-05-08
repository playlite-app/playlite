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
Este projeto nasceu para resolver esse problema real, ao mesmo tempo, em que serve como um projeto completo de portfólio
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

## 🤖 Uso de Inteligência Artificial no Desenvolvimento

O Playlite foi desenvolvido com apoio extensivo de ferramentas de Inteligência Artificial como parte de um processo de
*AI-assisted development* (também conhecido como “vibe coding”).

As ferramentas de IA foram utilizadas principalmente para:

- geração inicial de código e protótipos
- sugestões de arquitetura e refatoração
- apoio à documentação e análise técnica

Todas as decisões finais de arquitetura, integração entre sistemas, testes, correções de bugs e validação do código
foram realizadas manualmente. O uso de IA neste projeto teve como objetivo acelerar o desenvolvimento, facilitar o
aprendizado de Rust e React, e reduzir esforço em tarefas repetitivas, mantendo total entendimento e responsabilidade
sobre o código final.

📄 Detalhes mais aprofundados sobre o uso de IA estão disponíveis na documentação do projeto.

## 🤖 Sistema de Recomendação

O Playlite utiliza um sistema híbrido de recomendação, combinando:

- Filtragem baseada em conteúdo (perfil do usuário)
- Filtragem colaborativa offline (padrões globais da Steam)

Todo o processamento acontece localmente, sem coleta de dados do usuário.

- ⭐ Avaliações e favoritos influenciam o peso das recomendações
- 👥 Padrões de outros jogadores são usados sem identificação pessoal
- 📦 Dados colaborativos são pré-processados e distribuídos com o app

## 🚀 Como rodar localmente

### Requisitos

- Node.js 18+
- Rust (rustup)
- npm ou pnpm

### Setup

```bash
# Clone o repositório
git clone <repo-url>
cd playlite

# Instale dependências
npm install
```

### Integração com o Desktop Linux (ícone na barra de tarefas)

Se você estiver rodando no Linux, execute o script de integração para instalar o ícone e o arquivo `.desktop`:

```bash
npm run install:linux
```

Isso instala o ícone e o arquivo `.desktop` no diretório do usuário (`~/.local/share/`), permitindo que o Wayland/X11
associe a janela do app ao ícone correto na barra de tarefas.

### Desenvolvimento

```bash
npm run tauri dev
```

### Build de Produção

```bash
npm run tauri build
```

## 📚 Documentação Adicional

- Decisões arquiteturais (ADR): [`ADR.md`](ADR.md)
- Arquitetura do projeto: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Documentação online (VitePress): https://playlite.vercel.app/
- Atualizações do projeto: [`CHANGELOG.md`](CHANGELOG.md)
- Diário de desenvolvimento: [`DEV_LOG.md`](DEV_LOG.md)
- Roadmap: [`ROADMAP.md`](ROADMAP.md)

## 🤝 Contribuição

Sugestões e contribuições são bem-vindas!
Veja o arquivo [`CONTRIBUTING.md`](CONTRIBUTING.md).

## 📄 Licença

Este projeto está sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.
