---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Playlite"
  text: "Game Manager local-first"
  tagline: "Organize sua biblioteca, acompanhe seu progresso e descubra o que jogar depois."
  actions:
    - theme: brand
      text: Instalar
      link: /guide/installation
    - theme: alt
      text: Primeiros passos
      link: /guide/getting-started
    - theme: alt
      text: Quickstart (Dev)
      link: /dev/quickstart

features:
  - title: Local-first e offline-first
    details: Seus dados ficam no seu computador, com persistência local (SQLite) e foco em privacidade.
  - title: Biblioteca, favoritos e tracking
    details: CRUD de jogos, favoritos, nota e tempo jogado — sem depender de serviços externos.
  - title: Integrações opcionais
    details: Importação da Steam e base para recomendações, sem comprometer a experiência offline.
---

## O que é o Playlite?

O **Playlite** é um app desktop para gerenciar sua biblioteca de jogos de um jeito simples.
Ele nasceu pra resolver um problema comum: ter muitos jogos e não saber o que jogar em seguida.

### Para quem é

- **Usuários** que querem organizar jogos (Steam e outros) num lugar só
- **Entusiastas** que gostam de acompanhar favoritos, notas e tempo jogado
- **Devs/contribuidores** que querem um projeto real com React + Rust + Tauri

## Como esta documentação está organizada

- **Guia (Usuário):** foco em como usar o app
  - Comece em: **Primeiros passos** → `/guide/getting-started`
- **Dev:** foco em rodar localmente, entender a estrutura e contribuir
  - Comece em: **Quickstart (Dev)** → `/dev/quickstart`

## Links úteis

- Repositório e contexto do projeto: `README.md`
- Como contribuir: `CONTRIBUTING.md`
- Roadmap: `ROADMAP.md`
- Arquitetura (técnico): `/dev/architecture`
