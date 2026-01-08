# Arquitetura Técnica

Este documento descreve a engenharia por trás do **Playlite**. O projeto segue uma filosofia **Local-First**,
priorizando performance nativa, privacidade e funcionamento offline.

## Visão Geral

O sistema é um híbrido:

1. **Frontend (UI):** Uma SPA React leve, responsável pela apresentação e estado de visualização.
2. **Backend (Host):** Um binário Rust gerenciado pelo Tauri, responsável pela lógica de negócios, persistência e
   integrações.

```text
┌─────────────┐          ┌───────────────────┐
│  React UI   │          │    Rust Backend   │
│ (Frontend)  │          │      (Core)       │
└──────┬──────┘          └─────────┬─────────┘
       │                           │
       │ Invoke (IPC)              │
       ▼                           ▼
┌─────────────┐          ┌───────────────────┐
│ Command     │─────────▶│ Service Layer     │
│ Layer       │          │ (Regras/Lógica)   │
└──────┬──────┘          └─────────┬─────────┘
       │                           │
       └───────────┬───────────────┘
                   │
                   ▼
         ┌───────────────────┐
         │    Data Layer     │
         │ (SQLite / Models) │
         └─────────┬─────────┘
                   │
                   ▼
          ┌────────────────┐
          │   library.db   │
          └────────────────┘
```

## Padrões de Projeto (Backend)

O backend em Rust não é apenas uma "cola" para o banco de dados. Ele segue uma Arquitetura em Camadas (3-Tier) para
garantir manutenibilidade e testabilidade.

### 1. Command Layer (commands/)

É a porta de entrada. Expõe funções para o Frontend via macros `#[tauri::command]`.

**Responsabilidade:** Receber input da UI, validar dados e chamar os serviços.

**Exemplo:** O comando `get_user_profile` recebe a requisição, busca os dados brutos e passa para o motor de
recomendação.

### 2. Service Layer (services/)

Onde vive a lógica de negócio pura, agnóstica de interface.

**Responsabilidade:** Algoritmos complexos, cálculos de score, normalização de dados da Steam.

**Exemplo:** O módulo `recommendation::calculate_user_profile` recebe uma lista de jogos e devolve estatísticas
ponderadas, sem saber que existe um banco de dados ou uma UI.

### 3. Data Layer (database/ & models/)

Gerenciamento de estado e persistência.

**Tecnologia:** SQLite embarcado (via `rusqlite`) com modo WAL (Write-Ahead Logging) para performance.

**Segurança:** A conexão é protegida por `Mutex` dentro do `AppState` do Tauri, garantindo acesso seguro em ambiente
multithread.

## Estrutura de Dados

O coração do sistema é a struct `Game`, que espelha a tabela principal do banco de dados.

```rust
pub struct Game {
  pub id: String,          // AppID (Steam) ou UUID
  pub name: String,
  pub genre: String,
  pub platform: String,    // "Steam", "Epic", "GOG"
  pub playtime: i32,       // Minutos
  pub rating: i32,         // 0-5
  pub favorite: bool,
}
```

**Nota:** Os tipos são espelhados no Frontend (TypeScript) para garantir Type Safety ponta a ponta.

## Fluxos Críticos

### 1. Inicialização

Ao abrir o app:

1. O Rust inicializa o SQLite em `app_data_dir`.
2. Executa migrações (criação de tabelas) se necessário.
3. O Frontend monta e chama `invoke('get_games')`.

### 2. Sistema de Recomendação

O sistema usa Machine Learning clássico (filtragem baseada em conteúdo).

1. **Extração:** Busca jogos e suas features (gênero, tags).
2. **Vetorização:** Converte preferências do usuário em vetores matemáticos.
3. **Cálculo:** Aplica similaridade de cosseno ou heurísticas de peso (ex: Favorito = +50pts, Hora jogada = +2pts).

Detalhes completos em: [Sistema de Recomendação](./recommendation-system.md).

## Frontend (React)

O frontend utiliza Vite e Tailwind CSS v4.

**Estado:** Gerenciado localmente (React Context/State) para agilidade, com "Single Source of Truth" vindo do Backend.

**Integração:** Usa a bridge `window.__TAURI__.core` para comunicação.

## Decisões de Design

| Decisão          | Motivo                                                                                                       |
|------------------|--------------------------------------------------------------------------------------------------------------|
| SQLite Local     | Privacidade total e zero dependência de servidores.                                                          |
| Rust para Lógica | O JS é deixado apenas para renderização, garantindo que algoritmos pesados (recomendação) rodem nativamente. |
| Tauri v2         | Menor uso de RAM comparado ao Electron e melhor segurança.                                                   |
