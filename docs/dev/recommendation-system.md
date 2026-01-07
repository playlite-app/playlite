# Sistema de Recomendação

O diferencial do **Playlite** é oferecer descoberta de jogos inteligente sem enviar seus dados para a nuvem. Todo o
processamento de Machine Learning acontece localmente no seu dispositivo.

## Filosofia Local-First

Diferente de sistemas comerciais (Steam, Netflix) que processam dados em servidores massivos usando Filtragem
Colaborativa (comparando você com outros usuários), o Playlite usa **Filtragem Baseada em Conteúdo** (Content-Based
Filtering).

- **Privacidade:** Seu histórico de jogos nunca sai do seu computador.
- **Performance:** Cálculos otimizados em Rust para rodar em milissegundos.
- **Independência:** Funciona sem internet.

## Arquitetura do Pipeline

O sistema segue um fluxo linear de processamento de dados:

```text
[Dados Brutos] -> [Vetorização] -> [Cálculo de Perfil] -> [Scoring & Ranking] -> [Recomendação]
      ^                 ^                   ^                     ^                     ^
      |                 |                   |                     |                     |
 (SQLite/API)    (Features/Tags)    (Pesos: 50pts Fav)    (Similaridade)        (Top N Jogos)
```

## 1. Construção do Perfil de Usuário

Antes de recomendar, o sistema precisa entender o que você gosta. Para isso, ele analisa sua biblioteca atual e gera um
**Perfil de Preferências**.

A função `calculate_user_profile` (no backend) atribui pesos aos jogos que você já tem para determinar seus gêneros
favoritos.

### Algoritmo de Pontuação (Scoring)

Para cada jogo na sua biblioteca, calculamos um score de relevância baseado na seguinte heurística:

```rust
// Fonte: services/recommendation.rs

let score = (horas_jogadas * 2)      // Engajamento: 2 pontos por hora
+ (is_favorito * 50)       // Preferência explícita: 50 pontos
+ (rating_estrelas * 10);  // Qualidade percebida: 10 pontos por estrela
```

**Exemplo:** Um jogo que você jogou por 10 horas, marcou como Favorito e deu 5 estrelas terá:

```
(10 * 2) + 50 + (5 * 10) = 120 pontos
```

Esses pontos são então distribuídos para os gêneros daquele jogo, criando um vetor de "Gêneros Predominantes" do
usuário.

## 2. Motor de Similaridade (Machine Learning)

Com o perfil do usuário em mãos, o sistema compara esse vetor contra o banco de dados de jogos possíveis (sugestões).

### Content-Based Filtering

Utilizamos algoritmos de similaridade vetorial para encontrar jogos geometricamente próximos aos seus gostos.

**Similaridade de Cosseno:** Calcula o ângulo entre o "Vetor do Usuário" e o "Vetor do Jogo".

## 3. Motor de Regras (Rules Engine)

Após o cálculo matemático, aplicamos regras de negócio para garantir que a recomendação seja útil na prática.

| Regra                | Descrição                                                          |
|----------------------|--------------------------------------------------------------------|
| Penalização Temporal | Reduz levemente o score de jogos sugeridos repetidamente.          |
| Diversidade          | Tenta garantir que a lista final não tenha apenas um único gênero. |

## 4. Camada de Explicação (LLM Opcional) - em Desenvolvimento

O Playlite suportará futuramente o uso de Large Language Models (LLMs) locais (como Llama 3 ou Mistral via Ollama) ou
opcionalmente consumindo APIs para explicar a recomendação em linguagem natural.

::: warning Nota
O LLM não escolhe o jogo. Ele apenas recebe os dados do motor de recomendação e gera um texto explicativo.
:::

**Exemplo de Prompt Interno:**

```
Contexto: O usuário gosta de RPGs e tem 100h em 'The Witcher 3'.
Recomendação do Sistema: 'Cyberpunk 2077'.
Tarefa: Explique em uma frase por que 'Cyberpunk 2077' é uma boa escolha.
```

## Evolução Futura

**Short-term:** Refinar os pesos da heurística com base no feedback do usuário (botões "Não tenho interesse").

**Mid-term:** Suporte a tags customizadas para refinar a vetorização.
