# 🛠️ Diário de Desenvolvimento - Game Manager

Este documento registra a jornada técnica, decisões de arquitetura e desafios superados durante o desenvolvimento do
Playlite.

## Visão Geral do Projeto

- **Versão Atual:** 1.2.0
- **Status:** Em Desenvolvimento
- **Início:** 24 de Dezembro de 2025

### Stack Tecnológica

- **Backend:** Tauri v2 + Rust + SQLite (rusqlite)
- **Frontend:** React 19 + TypeScript + Vite
- **Estilização:** Tailwind CSS v4 + Shadcn/UI
- **Ícones:** Lucide React

### Inspirações de Design

- Microsoft Store (Windows 11)
- Epic Games Launcher
- Hydra Launcher

## Fase 1: MVP (Desktop)

### 📅 24/12/2025 - Início do projeto

**Tempo Investido:** ~10h  
**Objetivo:** Configuração do ambiente, arquitetura híbrida (Rust + React) e persistência de dados local.

### 🚀 1. Setup e Escolhas Tecnológicas

Para garantir performance nativa com uma interface web moderna, a stack escolhida foi:

- **Core:** Tauri v2 (Rust) - *Pelo baixo consumo de RAM e binário pequeno.*
- **Frontend:** React + TypeScript (Vite) - *Pela robustez e tipagem segura.*
- **Estilização:** Tailwind CSS v4 + Shadcn/UI - *Para UI moderna e acessível.*
- **Banco de Dados:** SQLite (via `rusqlite`) - *Embarcado no executável, sem necessidade de instalação externa.*

### 🏗️ 2. Arquitetura do Backend (Rust)

Uma das primeiras decisões importantes foi estruturar o projeto pensando no futuro suporte Mobile.

- **Refatoração `main.rs` vs `lib.rs`:** Em vez de manter toda a lógica no `main.rs` (padrão desktop antigo), migrei a
  lógica de negócio e comandos para o `lib.rs` usando a macro `#[cfg_attr(mobile, tauri::mobile_entry_point)]`. Isso
  deixará o porte para Android/iOS muito mais simples na Fase 4.

- **Gerenciamento de Estado:** Implementei uma `struct AppState` protegida por um `Mutex` para garantir que a conexão
  com o SQLite seja thread-safe entre as chamadas do frontend.

- **Comandos Implementados:**
  - `init_db`: Criação idempotente da tabela `games`.
  - `get_games`: Leitura e mapeamento de SQL para Structs Rust.
  - `add_game`: Inserção de dados.
  - `toggle_favorite`: Toggle booleano direto via SQL para otimização.

### 🎨 3. Frontend e UI/UX

O objetivo era fugir do visual "página web" e criar uma experiência de aplicativo nativo (App-like).

- **Tailwind v4:** Configuração das variáveis CSS para suportar temas Claro/Escuro nativamente com cores `oklch`.

- **Layout Responsivo:** Criação de uma Sidebar fixa e Header flutuante inspirados na Microsoft Store.

- **Componentização:**
  - `Sidebar.tsx`: Navegação lateral com indicador de seção ativa e área de usuário.
  - `Header.tsx`: Barra de busca, botão de adicionar e toggle de tema dark/light.
  - `GameGrid.tsx`: Grid responsivo de cards com hover effects e badges.
  - `App.tsx`: Orquestrador principal que integra todos os componentes.

- **Integração:** Uso de `useEffect` para inicializar o banco de dados silenciosamente ao abrir o app.

### 🐛 4. Desafios e Soluções

#### Problema 1: Compatibilidade Tauri v1 → v2

- **Erro:** Importações antigas `@tauri-apps/api/tauri` não funcionavam
- **Solução:** Migrei para `@tauri-apps/api/core` conforme nova documentação

#### Problema 2: Tailwind CSS v4 - Comando init não existe

- **Erro:** `npx tailwindcss init -p` retornava "could not determine executable to run"
- **Causa:** Tailwind v4 mudou completamente o sistema de configuração
- **Solução:** Instalei `@tailwindcss/vite` e configurei via `@import "tailwindcss"` no CSS

#### Problema 3: Shadcn/UI - Import alias não encontrado

- **Erro:** "No import alias found in your tsconfig.json"
- **Solução:** Adicionei configuração de paths no `tsconfig.json` e alias no `vite.config.ts`

#### Problema 4: tsconfig.json referenciando arquivos inexistentes

- **Erro:** "ENOENT: tsconfig.app.json não encontrado"
- **Solução:** Simplifiquei o `tsconfig.json` removendo as referências a arquivos separados

### 💡 5. Lições Aprendidas

#### Arquitetura

- Separar lógica em `lib.rs` desde o início economiza refatoração futura
- `Mutex<Connection>` é essencial para thread-safety com SQLite
- Componentização React facilita manutenção e escalabilidade

#### Ferramentas

- Tailwind v4 é mais rápido mas tem documentação limitada (ainda novo)
- Shadcn/UI acelera desenvolvimento de UI mas requer configuração cuidadosa

#### Desenvolvimento

- Mock data é útil para testar UI antes do backend estar pronto
- Documentar problemas economiza tempo em problemas similares
- TypeScript evita muitos bugs em runtime

#### Performance

- SQLite embarcado elimina necessidade de servidor externo
- Tauri gera binários ~10x menores que Electron
- React 19 tem melhorias significativas de performance

### 🔜 Próximos Passos

1. Implementar carregamento real dos jogos do banco (substituir mock data)
2. Criar modal de cadastro com campos completos (cover_url, rating, etc.)
3. Adicionar funcionalidade de deletar jogos
4. Implementar edição de jogos existentes
5. Sistema de busca em tempo real
6. Filtros por gênero, plataforma e favoritos

---

### 📅 25/12/2025 - Implementação do CRUD Completo e Refinamento de UI

**Tempo investido:** ~4h  
**Objetivo:** Implementar funcionalidades de escrita no banco (Adicionar, Editar, Excluir), corrigir persistência de
imagens e polir a responsividade do Grid.

#### ✨ Implementações

- **CRUD Completo:**

  - Implementado comandos Rust `update_game` e `delete_game`.
  - Criado fluxo de exclusão com confirmação.
  - Implementado fluxo de edição reaproveitando o `AddGame` com preenchimento automático de dados.

- **Interface (UI):**

  - **Grid Responsivo:** Ajuste fino no CSS para variar de 1 coluna (Mobile) até 5 colunas (Full HD), melhorando a
    legibilidade.
  - **Menu de Contexto:** Adicionado componente `DropdownMenu` (Shadcn) no Card para ações de Editar/Excluir.
  - **Botão Header:** Correção de contraste (agora sempre azul) e responsividade (esconde texto em telas pequenas).

- **Backend:**
  - Ajuste na tabela SQLite para suportar coluna `cover_url`.

#### 🐛 Problemas Encontrados

1. Imagem não salvando no banco

- **Causa:** O Tauri converte variáveis automaticamente de `camelCase` (JS) para `snake_case` (Rust). Eu estava
  enviando `cover_url` no frontend, mas o binding esperava `coverUrl` para mapear corretamente para o argumento do
  Rust.
- **Solução:** Alterei a chamada do `invoke` para usar `coverUrl: ...`.
- **Aprendizado:** Atenção redobrada na nomenclatura de variáveis na fronteira entre JS e Rust (Serde).

2. App reiniciando ao salvar dados

- **Causa:** O comando `npm run tauri dev` observa mudanças em todos os arquivos. Como o SQLite (`library.db`) mudava
  ao salvar um jogo, o Tauri achava que era código e recarregava o app.
- **Solução:** Adicionei `library.db` na lista de `ignored` no `tauri.conf.json`.

3. Coluna inexistente no banco

- **Causa:** O arquivo `.db` foi criado nas primeiras execuções sem a coluna `cover_url`. O comando
  `CREATE TABLE IF NOT EXISTS` não atualiza tabelas antigas.
- **Solução:** Deletei o arquivo `.db` manualmente para forçar a recriação da tabela com o schema novo.

#### 💡 Decisões Técnicas

- **Reutilização de Modal:** Decidi usar o mesmo componente `AddGame` para criação e edição. Isso evitou duplicar
  código de formulário. O controle é feito passando a prop opcional `gameToEdit`.
- **Grid Manual vs Auto-fit:** Optei por definir colunas explicitamente (`grid-cols-1` até `grid-cols-5`) em vez de usar
  `minmax` automático do CSS, para ter controle total sobre quantos cards aparecem em cada resolução específica.

#### ⏭️ Próxima Sessão

- [x] Implementar funcionalidade da barra de Busca (Filtro em tempo real).
- [x] Adicionar inputs de "Avaliação" (Estrelas) e "Tempo de Jogo" no Modal.
- [x] Criar lógica da página "Favoritos" (Sidebar).

---

### 📅 26/12/2025 - Finalização da Fase 1 (Busca e Navegação)

**Tempo investido:** ~2h  
**Objetivo:** Implementar sistema de busca em tempo real e lógica de navegação entre Biblioteca e Favoritos.

#### ✨ Implementações

- **Busca Reativa:**

  - Transformado o input do Header em componente controlado.
  - Criada lógica centralizada `getDisplayedGames` que filtra por Nome, Gênero ou Plataforma instantaneamente.

- **Navegação (Sidebar):**

  - Implementada lógica para a aba "Favoritos", exibindo apenas jogos marcados.
  - A busca agora funciona globalmente (filtra dentro da biblioteca ou dentro dos favoritos).

- **Refatoração:**

  - Removido sistema de "Mock Data" (dados falsos). Agora o Grid lida com estados vazios ("Nenhum jogo encontrado").
  - Limpeza de código morto no `App.tsx`.

#### 🐛 Problemas Encontrados

1. Edição de Gênero não salvando

- **Causa:** O comando SQL `update_game` no Rust estava desatualizado, atualizando apenas `name` e `cover_url`,
  ignorando os novos campos.
- **Solução:** Atualizei a query SQL para incluir `genre`, `platform`, `rating` e `playtime`.

2.Busca exibindo dados falsos

- **Causa:** O componente `GameGrid` tinha uma regra antiga para mostrar dados de exemplo se a lista estivesse vazia. Ao
  buscar um termo sem resultados, a lista ficava vazia e os dados falsos apareciam.
- **Solução:** Removi a lógica de mock. Agora exibe um componente "Empty State" informativo.

#### 💡 Decisões Técnicas

- **Filtragem no Client-Side:** Como a biblioteca local dificilmente passará de alguns milhares de jogos, optei por
  filtrar os arrays no Javascript (`.filter`) em vez de fazer queries SQL complexas (`LIKE %...%`) a cada tecla
  digitada. Isso garante UI instantânea (Zero Latência).

#### ⏭️ Próxima Seção

- [x] Iniciar integração com Steam API (Backend Rust).
- [x] Criar sistema de importação automática de jogos.

---

## Fase 2: Integração com Steam e RAWG

### 📅 26/12/2025 - Integração Steam, Refatoração e Hardening de Segurança

**Tempo investido:** ~5h  
**Objetivo:** Conectar a aplicação à API da Steam para importação automática, refatorar a arquitetura do frontend para
suportar múltiplas páginas e corrigir vulnerabilidades de segurança.

#### ✨ Implementações

- **Integração com Steam API:**
  - Criado módulo Rust (`steam_service`) usando `reqwest` para buscar jogos do usuário.
  - Implementada lógica de "Upsert" (Inserir ou Ignorar) para não duplicar jogos existentes no banco.

- **Refatoração Arquitetural (Frontend):**

  - Quebra do `App.tsx` em rotas manuais e criação da estrutura de pastas `/pages` (`Home`, `Libraries`, `Favorites`,
    `Settings`).
  - Centralização das ações (`gameActions`) para limpar a passagem de props.

- **Segurança (Security Hardening):**
  - Substituição do `localStorage` pelo `tauri-plugin-store` para armazenamento seguro/criptografado da API Key e Steam
    ID.

- **Dashboard (Início):**
  - Criação da tela inicial com KPIs (Tempo Total, Total de Jogos), lista de "Mais Jogados" e componente de "Sugestão
    Aleatória".

- **Infraestrutura:**
  - Configuração do banco SQLite para ser criado no diretório `app_data_dir` (AppData/Libraries), corrigindo conflitos
    de watcher do Tauri.

#### 🐛 Problemas Encontrados

1. Loop de Reinício Infinito

- **Causa:** O arquivo `library.db` estava sendo criado dentro da pasta `src-tauri`. Como o Tauri monitora essa pasta
  para "Hot Reload", cada alteração no banco disparava uma recompilação, que alterava o banco novamente, criando um
  loop.
- **Solução:** Alteração no `lib.rs` para usar a API `app.path().app_data_dir()`, salvando o banco na pasta de dados
  do usuário do Sistema Operacional.

2. API Key Exposta

- **Causa:** Inicialmente salvamos a API Key da Steam no `localStorage` do navegador.
- **Solução:** Auditoria de código apontou risco de segurança. Migramos para o plugin nativo `tauri-plugin-store` que
  persiste dados no disco com maior segurança e isolamento da WebView.

3. Capas de Jogos Quebradas

- **Causa:** A API da Steam retorna URLs de imagem baseadas no ID, mas nem todos os jogos antigos possuem a imagem
  vertical no servidor da CDN.
- **Solução:** Adicionado tratamento de erro `onError` no componente `GameCard` para ativar o fallback visual (card
  cinza com nome) automaticamente.

4. Duplicação de Chamada na Importação

- **Causa:** Erro de "Copy & Paste" no `Settings.tsx` gerou dois blocos de código idênticos para importar jogos.
- **Solução:** Remoção do código duplicado na função `handleImport`.

#### 💡 Decisões Técnicas

- **Pages vs Components:** Decidi separar "Telas" (que têm acesso ao estado global e roteamento) de "Componentes" (que
  apenas recebem dados puros). Isso facilitou a leitura do `App.tsx`.

- **Persistência Local de Chaves:** Optei por salvar as credenciais da Steam apenas no dispositivo do usuário (
  client-side) em vez de criar um backend na nuvem, mantendo a filosofia "Local-First" e privacidade do projeto.

- **Pausa no Enriquecimento de Dados:** A API `GetOwnedGames` da Steam não retorna gêneros. Decidi manter os dados
  como "Desconhecido" temporariamente e focar na estrutura do App, deixando a implementação de um Crawler de metadados
  para uma sessão futura dedicada.

#### ⏭️ Próxima Sessão

- [x] Planejamento do "Crawler" para buscar Gêneros e Tags dos jogos.
- [x] Desenvolvimento da página "Em Alta" (Trending).

---

### 📅 27/12/2025 - Estabilização, Crawler de Gêneros e Página Em Alta

**Tempo investido:** ~5h  
**Objetivo:** Corrigir bugs críticos de persistência, implementar segurança de chaves, enriquecer dados com gêneros
reais (Crawler) e criar a página de tendências (Trending) com API externa.

#### ✨ Implementações

- **Estabilização e Segurança:**

  - **Refatoração de Segurança:** Migração do `localStorage` para `tauri-plugin-store` (armazenamento criptografado).
  - **Correção de Persistência:** Ajuste no ciclo de vida do SQLite (movendo `PRAGMA journal_mode` para o backend) para
    evitar erros silenciosos que impediam o carregamento da lista.

- **Enriquecimento de Dados (Crawler Steam):**

  - Implementado sistema que busca metadados detalhados (Gêneros, Datas) na **Steam Store API** para jogos listados
    como "Desconhecido".
  - Lógica de **Rate Limiting** (pausa de 1.5s entre requisições) para evitar bloqueios de IP pela Valve.

- **Página "Em Alta" (Integração RAWG):**

  - Integração com a **RAWG API** para buscar jogos populares e lançamentos.
  - **Filtro Inteligente:** A lista exclui automaticamente jogos que o usuário já possui na biblioteca local.
  - **Otimização (Cache):** Implementado padrão de *State Lifting* no `App.tsx` para cachear os resultados da RAWG,
    eliminando loadings desnecessários ao trocar de abas.

- **UX de Configurações:**
  - Unificação do salvamento de chaves em um único botão "Salvar Todas as Configurações".

#### 🐛 Problemas Encontrados

1. Falsa "Perda de Dados" ao Reiniciar

- **Causa:** O comando SQL `PRAGMA journal_mode=WAL` retornava dados inesperados para o frontend, quebrando a promessa
  de inicialização.
- **Solução:** Configuração movida para o `setup` do Rust (backend), onde o retorno é tratado corretamente.

2. Deadlock no Banco de Dados (Crawler)

- **Causa:** O Crawler travava a interface inteira pois mantinha o banco bloqueado (`mutex lock`) enquanto esperava o
  tempo do Rate Limit (`sleep`).
- **Solução:** Uso de escopo `{}` no Rust para liberar o Mutex imediatamente após a escrita, permitindo que a UI
  respire enquanto o Crawler "dorme".

3. Re-fetching Excessivo na Página Em Alta

- **Causa:** O componente `Trending` era desmontado ao trocar de aba, perdendo os dados e forçando nova chamada de
  API (lenta) ao voltar.
- **Solução:** Elevação do estado (`trendingCache`) para o `App.tsx`, persistindo os dados na memória durante a
  sessão.

#### 💡 Decisões Técnicas

- **Store API vs User API:** Optou-se por usar a API da Loja Steam (mais lenta e restrita) para o enriquecimento, pois a
  API de Usuário não fornece Gêneros/Tags, essenciais para o futuro sistema de recomendação.
- **Persistência em AppData:** Mantida a decisão de usar diretórios padrão do SO (`AppData`), sacrificando a
  portabilidade em pen-drives em favor de maior compatibilidade com permissões do Windows.

#### ⏭️ Próxima Sessão

- [x] **Lista de Desejos:** Criar tabela no banco e integrar com API de preços (CheapShark).
- [x] **Sistema de Recomendação V1:** Algoritmo *Content-Based* usando os gêneros capturados pelo Crawler.
- [x] **Playlists Inteligentes:** Sugestão de "Backlog" baseada no tempo de jogo e afinidade.

---

### 📅 28/12/2025 - Modularização, Lista de Desejos e Integração de Preços

**Tempo investido:** ~8h  
**Objetivo:** Refatorar o código backend para facilitar manutenção e implementar o sistema completo de Lista de Desejos
com monitoramento automático de preços via API.

#### ✨ Implementações

- **Refatoração do Backend (Rust):**

  - Divisão do arquivo monolítico `lib.rs` em módulos organizados: `database/`, `commands/`, `services/`, `models/` e
    `constants/`.

- **Feature: Lista de Desejos (Wishlist):**

  - Criação da tabela `wishlist` no SQLite.
  - Implementação de comandos CRUD (`add`, `remove`, `get`) no Rust.
  - Criação da página `Wishlist.tsx` no Frontend e atualização da Sidebar.
  - Integração visual: Botões de "Adicionar à Lista" na página "Em Alta" (Trending).

- **Integração de Preços (CheapShark API):**

  - Novo serviço Rust (`cheapshark.rs`) para buscar ofertas em diversas lojas.
  - Comando `refresh_prices` que atualiza valores e links de compra em lote.
  - Exibição de preços (USD) e indicação visual de "OFERTA!" quando há descontos.

- **UX/Navegação:**

  - Implementação de botões funcionais para abrir links externos ("Ver na Loja", "Ver Detalhes") usando o navegador
    padrão do sistema.

#### 🐛 Problemas Encontrados

1. Performance na Criptografia de Chaves

- **Problema:** A implementação de criptografia com algoritmo Argon2 aumentou o tempo de inicialização do app para ~3
  segundos.
- **Causa:** O custo computacional do Argon2 é intencionalmente alto para evitar força-bruta, o que impacta a UX em
  desktops.
- **Solução:** Revertido temporariamente para armazenamento simples (`.settings.dat`) via `tauri-plugin-store` para
  manter o app ágil durante o desenvolvimento, com planos de usar OS Keychain no futuro.

2. Erro de Decodificação JSON (CheapShark)**

- **Problema:** O comando de atualizar preços falhava com `error decoding response body`.
- **Causa:** A struct Rust esperava campos `price` e `retail_price`, mas a API retornava `salePrice` e `normalPrice`.
- **Solução:** Uso do atributo `#[serde(rename = "...")]` nas structs para mapear corretamente os campos JSON da API
  para os campos do Rust.

#### 💡 Decisões Técnicas

- **Separação de Módulos Rust:** Decidi quebrar o `lib.rs` pois o arquivo estava ficando muito extenso e difícil de
  navegar. A nova estrutura separa claramente *Comandos* (API p/ Frontend) de *Serviços* (Lógica de Negócios/HTTP) e
  *Database* (SQL).

#### ⏭️ Próxima Sessão

- [x] Implementar a primeira versão do algoritmo de recomendação (Pontuação baseada em Gêneros).
- [x] Criar Playlist Sugerida na Home baseada nesses scores.
- [x] Conversão de moedas (USD -> BRL) para exibição de preços.

---

### 📅 29/12/2025 - Motor de Recomendação V1 (Content-Based)

**Tempo investido:** ~2h  
**Objetivo:** Implementar a primeira versão do algoritmo de recomendação, capaz de aprender o perfil do utilizador (
afinidade por géneros) e personalizar a interface.

#### ✨ Implementações

- **Backend (Rust):**

  - Criação do serviço `recommendation.rs`: Lógica matemática que calcula pesos para cada género baseado no tempo de
    jogo e favoritos.
  - Novo comando `get_user_profile`: Expõe o perfil calculado para o frontend.
  - Desacoplamento total: O motor de recomendação não sabe onde os dados serão usados, apenas processa números.

- **Frontend (React):**

  - Hook `useRecommendation`: Encapsula a lógica de calcular a afinidade de um jogo específico com o perfil do usuário.
  - **Reordenação Inteligente:** A página "Em Alta" agora ordena as sugestões baseada na afinidade (Score do Utilizador)
    em vez da ordem padrão da API.
  - **Feedback Visual:** Adição da badge "TOP PICK" para jogos com alta compatibilidade.

#### 💡 Decisões Técnicas

- **Algoritmo Deterministico:** Optei por não usar ML complexo ou vetores multidimensionais agora. Um sistema de pesos
  simples (`Playtime * 1.0 + Favorites * 50.0`) é mais fácil de debugar, extremamente rápido e funciona offline.
- **Cálculo no Frontend:** O Backend entrega o perfil (`{"RPG": 1000, "FPS": 0}`), mas é o Frontend que calcula a nota
  de cada jogo da lista "Em Alta". Isso poupa o Backend de ter que processar listas que vêm de APIs externas (RAWG).

---

### Padronização de UI

**Tempo investido:** ~5h  
**Objetivo:** Otimizar o carregamento da Home e padronizar os cards de jogos em todas as telas.

#### ✨ Implementações

- **Recomendação:**

  - Integração: Badges "TOP PICK" e "PARA VOCÊ" visíveis na Home e Trending.

- **Home Dashboard 2.0:**

  - **State Lifting:** Cache de `trending` e `profile` movido para o `App.tsx`, eliminando carregamentos desnecessários
    ao navegar entre abas.
  - **Lógica de Backlog:** Seção "O Melhor do seu Backlog" sugerindo jogos não jogados com alta afinidade.

- **Nova Seção "Trending":**

  - Implementação de busca de lançamentos de novos jogos para a nova seção "Lançamentos Aguardados" (Upcoming).
  - Filtro automático de lançamentos baseado no gosto do usuário.

- **Refatoração de UI (DRY):**

  - Criação do componente `StandardGameCard.tsx`.
  - Migração das páginas **Home**, **Trending** e **Wishlist** para usar este componente único.

- **Feature Launcher:**

  - Utilitário centralizado `launcher.ts` para iniciar jogos via protocolo `steam://`.

#### 🐛 Problemas Encontrados

1. Reloading constante da Home

- **Problema:** Ao sair e voltar para a Home, a API da RAWG era chamada novamente.
- **Solução:** Implementação de cache no componente pai (`App.tsx`) injetando os dados e funções de *set* via props
  para a Home.

2. Redundância de Código nos Cards

- **Problema:** Cada página (Wishlist, Trending, Home) tinha sua própria implementação HTML/CSS dos cards.
- **Solução:** Abstração completa para `StandardGameCard`, recebendo ações (botões) via prop `ReactNode`.

#### ⏭️ Próxima Sessão

- [x] **Refatoração Final:** Aplicar `StandardGameCard` e o `launcher` nas páginas **Library** e **Favorites**.
- [x] **Nova Página "Playlist":** Criar uma lista de reprodução manual/sugerida onde o usuário pode reordenar a fila de
  próximos jogos ("Up Next").
- [x] **Polimento Visual:** Ajustes finos de espaçamento e consistência de design.

---

### 📅 30/12/2025 - Refatoração Visual e Playlist

**Tempo investido:** ~6h  
**Objetivo:** Implementar a funcionalidade de Playlist, unificar a identidade visual (Hero/Cards), resolver problemas de
layout/scroll e finalizar a estrutura base do aplicativo.

#### ✨ Implementações

- **Feature Playlist:**

  - Criação do hook `usePlaylist` com persistência local (`.settings.dat`).
  - Interface de "Fila" (Queue) com reordenação manual e sugestões laterais inteligentes baseadas no backlog.

- **Componentização (DRY):**

  - Criação do componente `Hero.tsx` reutilizável, limpando o código da `Home` e `Trending`.
  - Refatoração final do `StandardGameCard` para suportar ações customizadas e botão "Play" contextual.

- **UX & UI:**

  - Implementação de **Scrollbar Customizada** via CSS puro (tema dark).
  - Substituição de `alert()` por notificações elegantes usando **Sonner** (Toasts).
  - Responsividade aprimorada no Modal de Detalhes e na página de Playlist (Full width).

- **Branding:**

  - Renomeação do projeto na interface para **Playlite**.

#### 🐛 Problemas Encontrados

**Problema 1:** Layout da Playlist vazio em telas grandes (1080p+)

- **Causa:** O container da lista estava limitado a `max-w-3xl`, deixando muito espaço em branco.
- **Solução:** Removi a limitação de largura da coluna principal e ajustei a sidebar de sugestões para ter tamanho fixo,
  ocupando 100% da tela disponível.
- **Aprendizado:** Em aplicações desktop (ao contrário da web), devemos aproveitar melhor a largura total da janela ("
  screen real estate").

**Problema 2:** Erro de Tipagem `isLocalGame` na Home

- **Causa:** Ao misturar jogos locais (`Game`) e da nuvem (`RawgGame`) no Hero, o TypeScript perdeu a referência de
  quais propriedades existiam.
- **Solução:** Criação de Type Guards e funções helpers explícitas para normalizar os dados antes de passar para o
  componente.

#### 💡 Decisões Técnicas

- **Decisão:** Uso do padrão de **Composição** nos Cards e Hero.
  - **Justificativa:** Em vez de passar dezenas de props booleanas (`showHeart`, `showPlay`), passamos os próprios
    componentes (`actions={<Button>...}`) para dentro do container. Isso desacoplou a lógica visual da lógica de negócio
    de cada página.

- **Decisão:** Manter a ordenação da Playlist sem bibliotecas de Drag-and-Drop (por enquanto).
  - **Justificativa:** Botões de "Subir/Descer" são mais fáceis de implementar de forma robusta e acessível nesta fase
    inicial, evitando peso extra no bundle.

---

# 📅 01/01/2026 - Segurança, Performance e Resiliência

**Tempo investido:** ~6h  
**Objetivo:** Elevar o nível técnico do projeto (de "MVP funcional" para "Aplicação Robusta") focando em segurança de
dados, otimização de performance e experiência do usuário (UX).

## ✨ Implementações

### Segurança (Criptografia Local)

- Implementação de criptografia AES-256-GCM para proteger as API Keys armazenadas em disco (`secrets.dat`).
- Criação de um módulo Rust dedicado (`security.rs`) para isolar a lógica criptográfica.
- Abordagem de "Ofuscação" com chave fixa no binário para contornar limitações de assinatura de código no Windows (
  evitando falhas de Keyring).

### Performance (Banco de Dados)

- Uso de `Prepared Statements` nas rotinas de backup para máxima velocidade de inserção.

### Resiliência (Backup & Restore)

- Implementação completa de sistema de exportação e importação do banco de dados em formato JSON.
- Uso de `BEGIN IMMEDIATE TRANSACTION` no restore para garantir integridade e evitar bloqueios (`database is locked`).

### UX (Polimento)

- **Splashscreen Nativa:** Implementação de uma janela de carregamento leve em HTML/Rust para eliminar a "tela branca"
  inicial e mascarar o tempo de boot do app.
- **Responsividade:** Ajustes finos na Sidebar e Header para telas menores (ocultação de textos, ícone de menu).
- **Feedback de Erros:** Criação de um sistema centralizado de mensagens de erro (`AppError` no Rust +
  `errorMessages.ts` no React) para diagnósticos amigáveis.

## 🐛 Problemas Encontrados

### 1. Erro de Dependência Desatualizada (Rust)

- **Problema:** Conflitos de versão ao adicionar `serde` e `aes-gcm`.
- **Solução:** Limpeza total do cache de build (`cargo clean`) e atualização do `Cargo.toml`.
- **Aprendizado:** Em Rust, quando erros de compilação parecerem sem sentido, limpar o cache costuma ser a primeira
  solução.

### 2. Aviso de Bundle Size no Frontend

- **Problema:** Vite alertando sobre chunks > 500kB.
- **Decisão:** Ignorado conscientemente. Para um app desktop rodando localmente (SSD), 500kB é carregado
  instantaneamente. Implementar Lazy Loading seria complexidade desnecessária (Overengineering).

## 💡 Decisões Técnicas

- Decisão: Não implementar cache manual de imagens de capa

  - **Justificativa:** O WebView do Tauri (baseado em Chromium) já gerencia cache HTTP de forma eficiente. Implementar
    um sistema de arquivos manual traria alta complexidade para pouco ganho perceptível. Adicionado apenas um fallback
    visual (`onError`) para links quebrados.

- Decisão: Manter constantes de erro no Frontend (`errorMessages.ts`)

  - **Justificativa:** Facilita a manutenção e tradução futura, além de manter o código dos componentes limpo de "magic
    strings".

## ⏭️ Próxima Sessão

- [x] Gerar build final de Release (`.msi` / `.exe`)
- [x] Publicar release v1.0.0 no GitHub

---

### 📅 02/01/2026 - 03/01/2026 - Pós-Lançamento: Infraestrutura, UX e Refatoração

**Tempo investido:** ~10h  
**Objetivo:** Polimento da versão v1.0.0 (MVP), implementação de infraestrutura de diagnóstico (logs), melhoria robusta
de tratamento de erros e refatoração de componentes repetitivos de UI.

#### ✨ Implementações

- **Infraestrutura de Logs (`logger.rs`):**

  - Configuração da crate `tracing` com `tracing-appender`.
  - Logs rotativos diários salvos em arquivo local para debug em produção.
  - Filtros configurados para silenciar bibliotecas externas e focar no `game_manager_lib`.

- **UX & Feedback:**

  - **Tratamento de Erros (Trending):** Implementação de lógica robusta para diferenciar erros de Conexão (Offline),
    Configuração (Sem API Key) e Servidor (API Error).
  - **Loading Animado:** Remoção da Splashscreen nativa (que causava flash branco em SSDs rápidos) e substituição por um
    *Loading State* elegante no React.
  - **Empty States:** Telas amigáveis quando a busca ou listas (Wishlist/Trending) estão vazias.

- **Features:**

  - **Wishlist Manual:** Modal para buscar e adicionar jogos na Lista de Desejos pelo nome (usando busca da Steam)
    quando o jogo não aparece em "Em Alta".

- **Documentação:**

  - Criação do `CHANGELOG.md` seguindo o padrão "Keep a Changelog".

- **Refatoração (Clean Code):**

  - Criação do componente `ActionButton.tsx`.
  - Padronização de todos os botões redondos (Home, Biblioteca, Favoritos, Wishlist) para usar esse componente único,
    reduzindo drásticamente a duplicação de classes Tailwind.

#### 🐛 Problemas Encontrados

Problema 1: Crash na página "Em Alta" (Rendered fewer hooks)

- **Causa:** O `useEffect` de busca estava posicionado *após* um retorno condicional (`if (!isOnline) return...`). O
  React exige que hooks sejam chamados na mesma ordem sempre.
- **Solução:** Movido todos os hooks para o topo do componente, antes de qualquer `return`.
- **Aprendizado:** Regra de ouro do React: Hooks sempre no topo, nunca dentro de condicionais.

Problema 2: Erro SQL na Wishlist ("no such column")

- **Causa:** A tabela `wishlist` foi atualizada no código Rust (novos campos `steam_app_id`), mas o SQLite local manteve
  a estrutura antiga do MVP. O comando `CREATE TABLE IF NOT EXISTS` não atualiza esquemas existentes.
- **Solução:** Implementado um reset manual (apagar `library.db`) para desenvolvimento. Para produção futura, será
  necessário um sistema de Migrations.

Problema 3: Botão de Menu (Dropdown) não abria com Componente Customizado

- **Causa:** O componente `ActionButton` não repassava a referência (`ref`) do DOM, impedindo o `DropdownMenuTrigger` do
  Shadcn de se ancorar.
- **Solução:** Uso de `forwardRef` no componente `ActionButton`.

#### 💡 Decisões Técnicas

- **Decisão:** Remoção da Splashscreen Nativa do Tauri.
  - **Justificativa:** O app carrega rápido demais (~2s). A splashscreen nativa criava uma "corrida visual" com a janela
    principal. O loading via React oferece uma transição mais suave e controlada.

- **Decisão:** Logs apenas em arquivo na Release.
  - **Justificativa:** Usar `#[cfg(debug_assertions)]` para imprimir no terminal apenas em DEV. Em produção, logs vão
    apenas para arquivo para não impactar performance ou expor dados se o terminal for aberto.

- **Decisão:** Manter busca da Steam para Wishlist Manual.
  - **Justificativa:** Garante que temos o `steam_app_id` correto para monitoramento de preços, evitando erros de
    digitação do usuário.

---

### 📅 06/01/2026 - Finalização da v1.2.0: Refatoração e Documentação

**Tempo investido:** ~12h  
**Objetivo:** Elevar o nível de qualidade do código (Clean Code), documentar o sistema para facilitar a manutenção
futura e corrigir falhas de UX nas interações de exclusão.

#### ✨ Implementações

- **ConfirmProvider (Context API):**

  - Criação de um contexto React para gerenciar modais de confirmação.
  - Substituição de todos os `window.confirm` (que bloqueavam a thread principal e destoavam do tema) por modais
    assíncronos integrados ao Shadcn UI.

- **Refatoração de Tipos:**

  - O arquivo `types.ts` estava monolítico. Foi quebrado em `types/games.ts`, `types/user.ts`, `types/system.ts`,
    facilitando a importação.

- **Documentação Rust:**

  - Adoção de Doc Comments (`///`) em todos os módulos do backend (`models`, `storage`, `security`).
  - Verificação de geração de HTML com `cargo doc`.

- **Correção de Fluxo Assíncrono:**

  - Ajuste nas funções de `handleDelete` para aguardar (`await`) a resolução da Promise do diálogo de confirmação antes
    de chamar o backend.

#### 🐛 Problemas Encontrados

**Problema: Exclusão ignorava o Cancelar**

- **Causa:** O código antigo disparava a função `onDelete` logo após abrir o modal, sem esperar a resposta do usuário,
  pois o estado do modal não era "bloqueante" como o `alert` nativo.
- **Solução:** Implementação de um padrão baseada em Promises dentro do `ConfirmProvider`. A função `confirm()` agora
  retorna uma `Promise<boolean>`, permitindo o uso de `if (await confirm(...))`.

#### 💡 Decisões Técnicas

- **Decisão:** Modernizar módulos Rust (Remover `mod.rs`).
  - **Justificativa:** O padrão antigo obrigava ter pastas com `mod.rs`. O padrão 2018+ permite `nome_do_modulo.rs` no
    mesmo nível da pasta, simplificando a árvore de arquivos e a navegação na IDE.

- **Decisão:** Tipagem Estrita no Frontend.
  - **Justificativa:** Adoção de ESLint rígido com verificação de imports. Isso forçou a limpeza de código morto e
    dependências circulares durante a separação dos tipos.

---

### 🏁 Encerramento do Dev Log

Com o lançamento da **v1.2.0**, o Playlite atingiu maturidade arquitetural e funcional.
A partir de agora, o desenvolvimento seguirá um fluxo orientado a Features e Releases maiores.

- **Histórico de mudanças:** Ver [CHANGELOG.md](./CHANGELOG.md)
- **Planejamento futuro:** Ver [ROADMAP.md](./ROADMAP.md)
- **Decisões Arquiteturais:** Ver [ADR.md](./ADR.md)

---

*Autor: Alan de Oliveira Gonçalves*  
*Última atualização: 06/01/2026*
