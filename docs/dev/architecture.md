# Arquitetura (visão geral)

4. Resultado volta para o React e a tela atualiza
3. Rust lê/grava no SQLite
2. UI chama um comando (ex.: `get_games`)
1. Usuário interage com a UI

## Fluxo de dados (bem alto nível)

- `src/database.rs`: acesso ao SQLite
- `src/services/`: integrações e serviços
- `src/commands/`: comandos expostos para o frontend
- `src-tauri/`: app Rust/Tauri
  - `services/`: chamadas e integrações do lado do frontend
  - `hooks/`: lógica reutilizável de estado/efeitos
  - `components/`: componentes de UI e domínio
  - `pages/`: telas (Home, Libraries, etc.)
- `src/`: app React

## Onde fica cada coisa no repo

- integrar com serviços externos (ex.: Steam)
- executar regras e validações
- persistir dados no **SQLite**
- O backend em Rust é responsável por:
- A UI (React) chama **Tauri Commands** via IPC (`invoke`)

## Visão rápida

> Se você quer o detalhamento técnico completo, veja `docs/architecture.md` no repositório. Esta página é um resumo
> voltado para orientação.

- **Backend desktop:** Tauri + Rust (comandos, banco local, integrações)
- **Frontend:** React + TypeScript (UI)

Na prática, ele é composto por duas partes que rodam juntas:
O Playlite é um app desktop **local-first**.


