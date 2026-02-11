# Architecture Decision Record (ADR)

Este documento registra as principais decisões arquiteturais do projeto **Game Manager**, explicando o contexto e os
motivos por trás das escolhas técnicas.

---

## 1. Objetivo do Projeto

Criar uma aplicação desktop para gerenciamento de biblioteca de jogos, com foco em:

- uso pessoal real
- aprendizado de tecnologias modernas
- demonstração de habilidades full-stack num projeto de portfólio

---

## 2. Plataforma e Arquitetura Geral

**Decisão:** Aplicação desktop multiplataforma usando Tauri.

**Motivação:**

- Melhor desempenho e menor consumo de memória comparado a Electron
- Uso de Rust no backend para aprendizado e segurança
- Integração natural com frontend web moderno

**Consequências:**

- Curva de aprendizado maior com Rust
- Build mais complexo, porém mais eficiente

---

## 3. Frontend

**Decisão:** React com TypeScript.

**Motivação:**

- Stack já conhecida
- Ecossistema maduro
- Facilidade de manutenção e escalabilidade

---

### 3.1 Organização do Frontend para Aplicação Desktop

**Decisão:** Adotar uma estrutura híbrida no frontend, com organização por camadas técnicas (components, hooks,
services, types) e agrupamento por domínio.

**Contexto:** Embora o frontend utilize React, o projeto é um app desktop via Tauri. O uso excessivo de padrões
típicos de aplicações web (ex.: muitos modais genéricos) começou a gerar complexidade conforme o projeto cresceu.

**Motivação:**

- Alinhar a estrutura do frontend ao modelo mental de aplicações desktop
- Facilitar a navegação e manutenção do código
- Reduzir complexidade desnecessária

---

## 4. Backend Local

**Decisão:** Backend local em Rust (Tauri commands).

**Motivação:**

- Processamento local de dados
- Evitar dependência de serviços externos
- Melhor privacidade do usuário

---

## 5. Persistência de Dados

**Decisão:** Banco de dados local (ex: SQLite).

**Motivação:**

- Simplicidade
- Portabilidade
- Adequado para aplicação desktop

---

## 6. Segurança de Credenciais e Dados Sensíveis

**Decisão:** Armazenar credenciais de APIs em banco de dados SQLite criptografado com AES-256, mas sem derivação de
chave lenta (Argon2), optando por uma abordagem menos segura, porém mais rápida e prática para o contexto do projeto.

**Contexto:**
O projeto precisa persistir credenciais de acesso a APIs externas para funcionar corretamente.

**Alternativas avaliadas:**

1. **Criptografia simétrica (AES-256) com derivação de chave (Argon2)**

- Implementada experimentalmente.
- Utilizou derivação deliberadamente lenta para mitigar força bruta.

2. **Keyring/credential store do sistema operacional**

- Avaliado como solução mais adequada para aplicações desktop comerciais.
- Falhou por falta de assinatura de código e/ou reputação do app, e o sistema a recusou o armazenamento.

---

## 7. Estratégia de Recomendação de Jogos

### 7.1 Content-Based Filtering

**Decisão:** Regras simples e filtros baseados em metadados.

Sinais considerados:

- Gêneros mais jogados
- Tags favoritas
- Tempo de jogo
- Avaliações do usuário

**Motivação:**

- Baixo custo computacional
- Resultados rápidos e explicáveis
- Sem necessidade de datasets externos

---

### 7.2 Collaborative Filtering Offline

**Decisão:** Filtragem Colaborativa Baseada em Itens usando feedback implícito (avaliações positivas), pré-computada
offline com Python. Utiliza datasets públicos, com distribuição de artefatos estáticos junto ao aplicativo.

Algoritmo escolhido:

- Similaridade por cosseno

**Motivação:**

- Custo computacional moderado
- Resultados potencialmente mais precisos

**Consequências:**

- Requer engenharia de features
- Necessita volume mínimo de dados

---

### 7.3 Explicação das Recomendações

**Decisão:** A explicação das recomendações é gerada de forma determinística, sem uso de LLMs.

**Motivação:**

- As razões da recomendação são diretamente derivadas de dados estruturados (gêneros, tags, séries).
- Evita dependência de APIs externas ou modelos locais.
- Garante explicações rápidas, previsíveis e offline.

**Consequências:**

- Menor complexidade
- Maior transparência
- Melhor alinhamento com a filosofia local-first

---

## 8. Infraestrutura e DevOps

**Decisão:** Projeto local, sem dependência obrigatória de cloud.

**Motivação:**

- Aplicação desktop
- Reduz custos
- Simplicidade

**Observação:** Experimentos futuros podem incluir serviços em cloud para:

- sincronização

---

## 9. Tradução automática com IA

**Decisão:** Utilizar Gemini para traduzir a descrição do jogo.

**Motivação:** melhorar a experiência do usuário no uso da aplicação bem como explorar a integração de LLMs em
funcionalidades relevantes do aplicativo.

**Alternativas avaliadas:**

1. Não utilizar tradução automática

- Simplicidade
- Menor custo
- Experiência do usuário inferior

2. Utilizar serviços de tradução tradicionais (ex.: Google Translate API, DeepL)

- Custo mais elevado
- Limitações de uso para bibliotecas grandes
- Necessidade de cadastro de cartão de crédito e complexidade adicional

**Consequências:**

- Custo controlado com uso moderado
- Melhoria significativa na experiência do usuário final

---

## 10. Documentação e Open Source

**Decisão:** Documentação enxuta no GitHub (README, CONTRIBUTING, ADR).

**Motivação:**

- Foco em clareza
- Evitar sobrecarga de manutenção
- Demonstrar boas práticas de projetos open source

---

## 11. Status

Este ADR representa o estado atual das decisões arquiteturais e pode evoluir conforme o projeto crescer.
