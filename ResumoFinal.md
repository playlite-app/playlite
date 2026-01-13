# Resumo: Fontes de Dados para Apps de Gerenciamento de Jogos

Guia definitivo sobre quais dados usar de cada fonte (RAWG, Steam, ITAD) e por quê.

---

## Contexto

Este documento sintetiza as melhores práticas para construir um app de gerenciamento de biblioteca de jogos usando múltiplas fontes de dados de forma estratégica e sustentável.

---

## 🎮 STEAM - Dados que REALMENTE Agregam Valor

A Steam é **imbatível em dados sociais, comportamentais e comerciais**.

### ⭐ 1. Avaliações dos Usuários

**O que usar**:

- Texto resumido (`Very Positive`, `Mixed`, etc.)
- Número de reviews

**Por que é valioso**:

- ✅ **Altíssimo valor** para decisão do usuário
- ✅ Responde: "Vale a pena jogar isso agora?"
- ✅ Mais relevante que críticas profissionais

**Recomendação**: ✅ **Essencial** - você já está usando o melhor

---

### 🧠 2. Tags da Comunidade

Além de detectar conteúdo adulto, as tags trazem **contexto real de gameplay**.

**Exemplos úteis**:

- `Story Rich`
- `Choices Matter`
- `Open World`
- `Difficult`
- `Casual`
- `Singleplayer` / `Multiplayer`
- `Co-op` / `PvP`
- `Controller`

**Por que é valioso**:

- ✅ Melhor que gênero para entender o jogo
- ✅ Excelente para recomendações futuras
- ✅ Complementa perfeitamente a RAWG

**⚠️ Atenção**:

- Não use todas as tags
- Filtre apenas as mais frequentes/relevantes

**Recomendação**: ✅ **Altamente recomendado**

---

### ⏱️ 3. Tempo Médio de Jogo

A Steam não fornece "tempo para zerar", mas fornece:

- Média de horas jogadas por usuários
- Percentis (via SteamSpy)

**Por que é valioso**:

- ✅ Ótimo proxy quando HLTB falha
- ✅ Classificação simples: "Jogo curto / médio / longo"

**Classificação sugerida**:

```text
< 10h  → Curto
10-30h → Médio
> 30h  → Longo
```

**Recomendação**: ✅ **Recomendado** (especialmente via SteamSpy)

---

### 🧑‍🤝‍🧑 4. Modos de Jogo Reais

Dados disponíveis na Store:

- Singleplayer
- Multiplayer
- Online PvP
- Co-op local / online
- Shared/Split Screen

**Por que é valioso**:

- ✅ Ajuda usuário a escolher o que jogar agora
- ✅ Fundamental para quem joga com amigos
- ✅ Melhora experiência de filtragem

**Recomendação**: ✅ **Recomendado**

---

### 💰 5. Preço Atual e Wishlist

ITAD é o principal.

Steam:

- Importar wishlist do usuário (opcional nas configurações do Playlite)

**Por que é valioso**:

- ✅ Wishlists mais útil

**Recomendação**: ⚠️ **Opcional**

---

### 🔗 7. Link Direto para a Loja Steam

Simples, mas poderoso.

**Por que é valioso**:

- ✅ Melhora UX
- ✅ Aumenta confiança
- ✅ Atalho natural

**Recomendação**: ✅ **Essencial**

---

## 🎯 RAWG - Onde Ela Brilha de Verdade

RAWG é **excelente para metadados editoriais e descoberta**.

### 🧩 1. Gêneros e Subgêneros

Exemplos:

- RPG, Action, Adventure
- Indie
- Strategy
- Puzzle

**Por que é valioso**:

- ✅ Base de organização
- ✅ Filtros consistentes
- ✅ Melhor que Steam para categorização

**Recomendação**: ✅ **Essencial**

---

### 🏷️ 2. Tags Editoriais

Exemplos temáticos:

- Fantasy
- Cyberpunk
- Sci-Fi
- Post-Apocalyptic

**Por que é valioso**:

- ✅ Exploração temática
- ✅ Similaridade de jogos
- ✅ Complementa tags da Steam

**Recomendação**: ✅ **Recomendado** (com moderação)

---

### 🧑‍💻 3. Desenvolvedor / Publisher

**Por que é valioso**:

- ✅ Importante para fãs
- ✅ Descoberta de jogos semelhantes
- ✅ Confiança na qualidade

**Recomendação**: ✅ **Essencial**

---

### 🗓️ 4. Datas de Lançamento

Dados confiáveis sobre:

- Jogos lançados
- Early Access
- Futuros lançamentos

**Por que é valioso**:

- ✅ Jogos "para ficar de olho"
- ✅ Planejamento de backlog
- ✅ Organização temporal

**Recomendação**: ✅ **Essencial**

---

### 🖼️ 5. Imagens e Mídia

Dados visuais:

- Background images
- Banners

**Por que é valioso**:

- ✅ UX essencial
- ✅ Apelo visual
- ✅ Fundamental para app desktop

**Recomendação**: ✅ **Essencial**

---

### 🔗 6. Links Externos

RAWG fornece links para:

- Website oficial
- Reddit
- Metacritic
- Lojas (Steam, GOG, Epic)

**Por que é valioso**:

- ✅ Centralizador de informação
- ✅ Excelente para "hub de jogo"
- ✅ Economia de tempo do usuário

**Recomendação**: ✅ **Altamente recomendado**

---

### 🏆 7. Metacritic Score

**Status**: Como complemento

**Por que ainda vale**:

- ✅ Visão da crítica profissional
- ✅ Complementa Steam Reviews
- ❌ Não substitui avaliação de jogadores

**Recomendação**: ⚠️ **Opcional** (como complemento)

---

## 🚫 O Que NÃO Vale o Esforço

### ❌ RAWG Playtime

**Por que evitar**:

- Inconsistente entre jogos
- Sem metodologia clara
- Valores inflados e imprecisos

**Alternativa**: Use SteamSpy + heurística

---

### ❌ Achievements da Steam

**Por que evitar**:

- Complexo de implementar
- Pouco valor agregado no contexto de backlog
- Alto custo vs benefício

**Exceção**: Se construir sistema de gamificação

---

### ❌ Reviews Textuais Completas

**Por que evitar**:

- Muito ruído
- Problemas legais de uso
- UX confusa
- Volume massivo de dados

**Alternativa**: Use resumo agregado (já está usando)

---

## 🧠 Combinação IDEAL - Arquitetura Recomendada

| Fonte | Responsabilidade | Status |
|-------|------------------|--------|
| **RAWG** | Metadados, discovery, visual | ✅ Essencial |
| **Steam** | Reviews, tags sociais, adulto, modos | ✅ Essencial |
| **ITAD** | Preços | ✅ Essencial |
| **Inferência local** | Séries, coleções | ✅ Recomendado |

### 📌 Esta divisão é madura e sustentável.

---

## 🧩 Modelo Mental para o Banco de Dados

Pense nas fontes como respostas a perguntas diferentes:

| Fonte | Pergunta que responde |
|-------|----------------------|
| **RAWG** | "O que é esse jogo?" |
| **Steam** | "Como as pessoas realmente jogam e avaliam?" |
| **ITAD** | "Vale comprar agora?" |

---

## 🎯 Checklist de Implementação

### ✅ Dados Essenciais (MVP)

- [x] **RAWG**: Nome, gêneros, desenvolvedor, data de lançamento
- [x] **RAWG**: Imagens (background, cover)
- [ ] **RAWG**: Links externos (site, reddit, metacritic)
- [ ] **Steam**: Review summary (label + count)
- [ ] **Steam**: Link para loja
- [ ] **Steam**: Detecção de conteúdo adulto (tags)

### ⭐ Dados Recomendados (V2)

- [ ] **Steam**: Tags da comunidade (filtradas)
- [ ] **Steam**: Modos de jogo (singleplayer, co-op, etc.)
- [ ] **Steam**: Plataformas e Steam Deck
- [ ] **SteamSpy**: Tempo médio de jogo (mediana)
- [ ] **RAWG**: Tags editoriais temáticas

### 🚀 Dados Avançados (Futuro)

- [x] **ITAD**: Preços e histórico
- [x] **Inferência**: Detecção de séries/coleções
- [ ] **Steam**: Suporte a controle
- [ ] **Cache inteligente**: Atualização periódica de reviews

---

## 📊 Comparação Rápida: Steam vs RAWG

| Aspecto | Steam | RAWG |
|---------|-------|------|
| **Metadados básicos** | ⚠️ Ok | ✅ Excelente |
| **Reviews** | ✅ Excelente | ❌ Não tem |
| **Imagens** | ⚠️ Ok | ✅ Excelente |
| **Tags** | ✅ Sociais (reais) | ✅ Editoriais (curadas) |
| **Links externos** | ❌ Só Steam | ✅ Múltiplos |
| **Cobertura** | Apenas Steam | Multi-plataforma |
| **Preços** | ⚠️ Limitado | ❌ Não tem |
| **Duração estimada** | ⚠️ Via SteamSpy | ❌ Impreciso |

**Conclusão**: Você precisa de **ambas** - são complementares!

---

## 💡 Princípios de Design de Dados

### 1. ✅ Single Source of Truth

Cada tipo de dado tem uma fonte primária:

- Metadados → RAWG
- Reviews → Steam
- Preços → ITAD

### 2. ✅ Fallback Inteligente

Se a fonte primária falha:

- Steam AppID → construir URL manualmente
- RAWG sem imagem → usar placeholder
- SteamSpy sem dados → usar estimativa RAWG + heurística

### 3. ✅ Cache com Estratégia

Diferentes dados têm diferentes frequências:

- Metadados: cache permanente (não mudam)
- Reviews: cache de 15 dias (mudam gradualmente)
- Preços: sob demanda

---

## 🏁 Conclusão

### ✅ Você Não Precisa de Mais APIs

Você já escolheu as fontes certas:

- **RAWG** para metadados e descoberta
- **Steam** para dados sociais e comportamentais
- **(Opcional) ITAD** para preços

### ✅ Você Precisa Usar Bem as Que Já Escolheu

E você **está fazendo isso corretamente**! Sua arquitetura:

- ✅ É madura
- ✅ É sustentável
- ✅ É escalável
- ✅ Cobre todos os casos de uso principais

---

## 📚 Documentos Relacionados

Este resumo complementa os seguintes documentos detalhados:

1. **Estimativa de Duração de Jogos** - Estratégias com SteamSpy e RAWG
2. **Age Rating e Conteúdo Adulto** - Detecção via Steam tags
3. **Integração de Links Externos** - Modelagem e implementação
4. **Steam Reviews** - API oficial e estratégias de atualização

---

## 🎯 Mensagem Final

**Sua arquitetura multi-source está correta.**

Você não está fazendo workarounds - você está fazendo **design pragmático e eficaz**.

Cada fonte tem seu propósito claro, e juntas elas criam uma experiência completa para o usuário.

**Continue neste caminho.** 🚀
