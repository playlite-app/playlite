# 🎮 Game Manager

<div align="center">

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/Alan-oliveir/game_manager?label=version&color=blue)](https://github.com/Alan-oliveir/game_manager/releases/latest)
![License](https://img.shields.io/badge/license-MIT-green)

![Rust](https://img.shields.io/badge/Rust-000000?logo=rust&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-24C8DB?logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)

</div>

A local-first desktop game library manager with an intelligent recommendation system based on classical Machine
Learning.

![Playlite Demo](https://github.com/Alan-oliveir/game_manager/blob/main/docs/assets/demo.gif?raw=true)

## 💡 Motivation

I have a large game library and often struggle to decide what to play next.
This project was born to solve that real problem, while also serving as a complete portfolio project to explore Rust,
Tauri, React, and recommendation systems.

## ✨ Features

- Full game library management (CRUD)
- Local persistence with SQLite (offline-first)
- Desktop UI inspired by the Microsoft Store
- Favorites system, ratings, and playtime tracking
- Foundation for an intelligent recommendation system
- Data backup and restore (JSON)

## 🛠️ Stack

- **Desktop:** Tauri v2 + Rust
- **Frontend:** React + TypeScript + Vite
- **UI:** Tailwind CSS v4 + Shadcn/UI
- **Database:** SQLite (local)

## 🧱 Architecture (High-level)

- Local-first desktop application
- Business core in Rust
- Decoupled UI in React
- Communication via Tauri Commands
- Embedded SQLite database

## 🤖 Use of Artificial Intelligence in Development

Playlite was developed with extensive support from Artificial Intelligence tools as part of an *AI-assisted development*
process (also known as "vibe coding").

AI tools were primarily used for:

- Initial code generation and prototyping
- Architecture suggestions and refactoring
- Documentation support and technical analysis

All final architecture decisions, system integration, testing, bug fixes, and code validation were performed manually.
The use of AI in this project aimed to accelerate development, facilitate learning of Rust and React, and reduce effort
on repetitive tasks, while maintaining full understanding and ownership of the final code.

📄 More in-depth details about AI usage are available in the project documentation.

## 🤖 Recommendation System

Playlite uses a hybrid recommendation system, combining:

- Content-based filtering (user profile)
- Offline collaborative filtering (global Steam patterns)

All processing happens locally, with no user data collection.

- ⭐ Ratings and favorites influence recommendation weights
- 👥 Patterns from other players are used without personal identification
- 📦 Collaborative data is pre-processed and distributed with the app

## 🚀 Running Locally

### Requirements

- Node.js 18+
- Rust (rustup)
- npm or pnpm

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd playlite

# Install dependencies
npm install
```

### Linux Desktop Integration (taskbar icon)

If you are running on Linux, execute the integration script to install the icon and `.desktop` file:

```bash
npm run install:linux
```

This installs the icon and `.desktop` file in the user directory (`~/.local/share/`), allowing Wayland/X11 to associate
the app window with the correct taskbar icon.

### Development

```bash
npm run tauri dev
```

### Production Build

```bash
npm run tauri build
```

## 📚 Additional Documentation

- Architectural decisions (ADR): [`ADR.md`](ADR.md)
- Project architecture: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Online documentation (VitePress): [https://playlite.vercel.app/](https://playlite.vercel.app/)
- Project updates: [`CHANGELOG.md`](CHANGELOG.md)
- Roadmap: [`ROADMAP.md`](ROADMAP.md)

## 🤝 Contributing

Suggestions and contributions are welcome!
See the [`CONTRIBUTING.md`](CONTRIBUTING.md) file.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
