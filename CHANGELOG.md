# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [3.1.0] - 2026-02-12

### Adicionado

- **Scanner de Diretórios Locais**: Nova funcionalidade que permite monitorar pastas do PC para adicionar jogos
  automaticamente à biblioteca Playlite.
- **Detecção de Instalação Steam**: O importador da Steam agora identifica quais jogos já estão instalados no sistema,
  marcando-os corretamente na interface.
- **Nova Estrutura de UI**: Refatoração completa de componentes de interface, incluindo um novo sistema de Dialogs (
  caixas de diálogo) e Tooltips mais leves e responsivos.

### Modificado

- **Refatoração do Backend (Rust)**: Reestruturação das integrações no core em Rust para maior estabilidade e
  performance na comunicação via IPC (Inter-Process Communication).
- **Otimização de Assets**: Melhoria no carregamento de capas vindas da API GamerPower, corrigindo falhas de exibição em
  conexões instáveis.
- **Fluxo de Importação**: O processo de sincronização com a Steam agora é mais resiliente, ignorando entradas
  corrompidas sem interromper toda a tarefa.

### Corrigido

- **Carregamento de Capas**: Corrigido o erro que impedia a exibição correta de imagens na aba de "Jogos Grátis" (
  GamerPower).
- **Posicionamento de Tooltips**: Ajuste fino no cálculo de coordenadas dos tooltips para evitar que saiam da tela em
  resoluções menores.
- **Estabilidade de Importação**: Resolvido um bug onde o scanner local poderia entrar em loop infinito em pastas com
  links simbólicos (symlinks).

## [3.0.0] - 2026-02-01

### Adicionado

- **Sistema de Recomendação Híbrido (v4.0)**: O algoritmo agora cruza seu perfil local (Content-Based) com dados obtidos
  de usuários na Steam (Collaborative Filtering) para sugerir jogos.
- **Transparência (XAI)**: Adicionados *Tooltips Inteligentes* nas recomendações que explicam o motivo da sugestão (
  ex: "Série Favorita", "Tendência na Comunidade", "Alta Afinidade de Tags").
- **Ciclo de Feedback**: Botão "Não Útil" (Dislike) nas recomendações, permitindo que o usuário treine o algoritmo
  ignorando jogos específicos.
- **Sistema de Atualização Automática**: Integração completa com Tauri Updater. O app agora verifica, baixa e instala
  atualizações, criando **Backups Automáticos** do banco de dados antes de mudanças críticas (Major Updates).
- **Modo Offline Resiliente**: As páginas "Em Alta", "Lançamentos" e "Jogos Grátis" agora funcionam sem internet,
  utilizando um cache inteligente ("Stale-while-revalidate") e exibindo um banner informativo.
- **Configurações de Algoritmo**: Nova seção em Configurações permitindo ajustar pesos (Perfil vs Comunidade),
  penalidade de tempo (Nostalgia) e priorização de séries.
- **Cache de Imagens Híbrido**: Opção para salvar capas localmente para visualização offline ou economizar espaço usando
  apenas URLs remotas.
- **Giveaways**: Integração com GamerPower para descoberta de jogos grátis.
- **Tradução Automática com IA**: Tradução da descrição dos jogos usando a API do Gemini.

### Modificado

- **Refatoração GameDetailModal**: Componente reestruturado em arquivos menores, com melhorias de performance e UX.
- **Refatoração de Hooks**: `useTrending`, `useUpcoming` e `useGiveaways` reescritos para suportar falhas de rede e
  servir dados do cache local (`api_cache`) transparentemente.
- **Refatoração de metadata.rs**: Separação do arquivo em módulos menores, com melhorias na manipulação de erros
  e logging detalhado.
- **Lista de Desejos Avançada**: A Wishlist agora tem opção de importar listas da Steam e IsThereAnyDeal, além de
  monitorar preços e cupons de desconto.
- **Arquitetura de Banco de Dados**: Introdução da tabela `app_config` para configurações genéricas de sistema (Data de
  instalação, Versão do Schema).
- **Interface de Configurações**: Substituição de checkboxes padrão pelo componente visual `ToggleSwitch` para melhor
  UX.
- **Tratamento de Cache**: Otimização do TTL (Time-To-Live) diferenciado para listas (24h) vs detalhes de jogos (30
  dias).

### Corrigido

- Correção na persistência de configurações onde certos pesos do algoritmo não eram salvos corretamente.
- Resolvido problema onde a página "Em Alta" mostrava tela de erro fatal ao perder conexão; agora degrada graciosamente
  para o cache.

## [2.0.0] - 2026-01-12

### Adicionado

- **Banco de Dados SQLite**: Migração completa do armazenamento para SQLite (`library.db` e `secrets.db`), permitindo
  relacionamentos complexos entre jogos e detalhes.
- **Sistema de Recomendação v2 (Rust)**: Novo algoritmo nativo no backend que calcula afinidade baseado em gênero, tags
  e séries, aplicando penalidade temporal (Age Decay) para jogos parados há muito tempo.
- **Integração IsThereAnyDeal**: A Wishlist agora busca preços em múltiplas lojas, histórico de menor preço e identifica
  **Cupons de Desconto** automaticamente.
- **Suporte Backend HLTB**: Implementação do serviço de busca para *HowLongToBeat* no backend (preparação para futura
  UI).
- **Coluna de Voucher**: Adicionado suporte visual para exibir códigos de cupom diretamente no card do jogo na Wishlist.

### Modificado

- **Arquitetura Agnóstica**: O sistema não depende mais exclusivamente da Steam para metadados, priorizando a API da
  RAWG para capas e descrições.
- **Refatoração de Hooks**: `useRecommendation` e `useHome` foram reescritos para consumir dados processados pelo Rust,
  removendo cálculos pesados do JavaScript.
- **Backup System**: Atualizado para incluir as novas tabelas `wishlist` e `game_details` na exportação/importação JSON.
- **Logs Detalhados**: Melhoria nos logs de rastreamento (tracing) para operações de banco de dados e requisições HTTP.

### Removido

- **Lógica Legada v1**: Removidas funções antigas de cálculo de afinidade no frontend.
- **Campos Obsoletos**: Limpeza de campos não utilizados nas interfaces de configuração.

## [1.2.0] - 2026-01-06

### Adicionado

- **ConfirmProvider**: Sistema global de diálogos de confirmação customizados (substituindo o `window.confirm` nativo).
- Documentação completa do Backend (Rust) gerável via `cargo doc`.
- Toasts de feedback visual para todas as operações de exclusão e edição.
- JSDocs nos principais Hooks e Componentes reutilizáveis.

### Modificado

- Refatoração completa da estrutura de pastas de tipos (`src/types/`), agora dividida por domínios.
- Modernização da estrutura de módulos do Rust (padrão Rust 2018+).
- Padronização visual dos botões de ação (Play, Favoritar, Menu) usando o novo componente `ActionButton`.
- Ajustes de responsividade no Modal de Detalhes para janelas com altura reduzida.

### Corrigido

- Bug de "Race Condition" na exclusão: Ação de deletar ocorria antes da confirmação do usuário. Corrigido com
  implementação adequada de `async/await` no fluxo de confirmação.

## [1.1.0] - 2026-01-02

### Adicionado

- Logging de erros para facilitar debug e melhorias futuras.
- Botão para adicionar manualmente um game para a lista de desejos.
- ChangeLog.md para documentação das mudanças do projeto.
- Componente ErrorBoundary para capturar erros em componentes React e exibir uma mensagem amigável ao usuário.

### Modificado

- Melhorias na UI da página Biblioteca, agora com estado vazio personalizado quando não há jogos importados.
- Melhprias na UI da página Em Alta, agora com estado vazio personalizado indicando o tipo de erro ocorrido (erro de
  conexão, erro de API, etc).
- Aprimoramento na performance da importação de metadados dos jogos na Steam, reduzindo o tempo de carregamento.

### Removido

- Integração com API CheapShark para preços de jogos, devido à instabilidade e preços apenas em dólar.

## [1.0.1] - 2026-01-02

### Adicionado

- Loading animado na Home com identidade visual do Playlite.

### Removido

- Splashscreen nativa para acelerar a percepção de carregamento.

## [1.0.0] - 2026-01-01

### Adicionado

- Versão inicial do Playlite (MVP Desktop).
- Integração com Steam para importação de biblioteca.
- Sistema de Recomendação baseado em conteúdo.
- Suporte a Backup e Restore do banco de dados (JSON).
- Criptografia local (AES-256) para credenciais.
