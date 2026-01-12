# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

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
