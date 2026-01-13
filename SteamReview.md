# Integração de Steam Reviews para Complementar Metacritic

Documentação sobre como usar Steam Reviews de forma oficial e eficiente em aplicativos de gerenciamento de jogos.

---

## Contexto

Este documento apresenta estratégias para integrar avaliações da Steam sem scraping ou login, complementando (ou substituindo) o Metacritic com dados mais úteis e atualizados.

---

## O Que a Steam Permite Obter Oficialmente

### ✅ Steam Store API - Review Summary

A Steam expõe **resumos agregados** de reviews de forma totalmente pública e oficial.

#### Categorias de Review

A Steam usa exatamente estes formatos textuais:

- **Overwhelmingly Positive** (Extremamente positivas)
- **Very Positive** (Muito positivas)
- **Positive** (Positivas)
- **Mostly Positive** (Majoritariamente positivas)
- **Mixed** (Neutras)
- **Mostly Negative** (Majoritariamente negativas)
- **Negative** (Negativas)
- **Very Negative** (Muito negativas)
- **Overwhelmingly Negative** (Extremamente negativas)

**Isso é exatamente o que você quer mostrar na UI!** 🎯

---

## API Endpoint

### URL Principal

```
https://store.steampowered.com/appreviews/{APPID}?json=1
```

#### Exemplo Real

```
https://store.steampowered.com/appreviews/1091500?json=1
```

### Resposta da API

```json
{
  "success": 1,
  "query_summary": {
    "num_reviews": 731245,
    "review_score": 8,
    "review_score_desc": "Very Positive",
    "total_positive": 595123,
    "total_negative": 136122
  }
}
```

### Campos Relevantes

| Campo | Uso |
|-------|-----|
| `review_score_desc` | ⭐ Texto pronto para UI |
| `num_reviews` | Credibilidade |
| `total_positive` | Estatística |
| `total_negative` | Estatística |

### ✅ Importante

- **Você NÃO precisa dos reviews individuais**
- **Esse resumo é suficiente e oficial**
- Não requer autenticação ou scraping

---

## O Que NÃO é Viável / Não Recomendado

### ❌ Reviews Individuais (Texto do Usuário)

**Por quê evitar**:
- Volume enorme de dados
- Questões legais de uso
- Alto custo de processamento
- Pouco valor real para o usuário médio

**Conclusão**: Resumo agregado > Texto individual

---

## Comparação: Steam Reviews vs Metacritic

| Critério | Steam | Metacritic |
|----------|-------|------------|
| **Base** | Jogadores reais | Críticos profissionais |
| **Volume** | Muito alto | Baixo |
| **Atualização** | Contínua | Lenta |
| **Linguagem** | Simples | Técnica |
| **Confiança do usuário** | Alta | Média |

### 💡 Conclusão Prática

**Steam Reviews são mais úteis para decidir jogar**. Representam melhor a experiência real dos jogadores.

---

## Integração com RAWG (Arquitetura Ideal)

### Divisão de Responsabilidades

**RAWG não fornece reviews de usuários**, então a estratégia correta é:

| Fonte | Responsabilidade |
|-------|------------------|
| **RAWG** | Metadados (gêneros, tags, descrição) |
| **Steam** | Reviews + conteúdo adulto + loja |
| **ITAD** | Preços (opcional) |

**Você já está naturalmente indo para uma arquitetura multi-source correta!** ✅

---

## Modelagem de Banco de Dados

### Opção Recomendada (Estruturada)

```sql
ALTER TABLE game_details 
ADD COLUMN steam_review_label TEXT,
ADD COLUMN steam_review_count INTEGER,
ADD COLUMN steam_review_updated_at TEXT;
```

**Por que `updated_at` é importante**:
- Permite throttle de atualizações
- Evita requisições desnecessárias
- Facilita cache inteligente

### Exemplo de Dados Salvos

```json
{
  "steam_review_label": "Very Positive",
  "steam_review_count": 731245,
  "steam_review_updated_at": "2026-01-13T10:30:00Z"
}
```

### ❌ Alternativa Não Recomendada

```sql
-- Não faça isso
steam_review_summary TEXT -- "Muito positivas (1.024 avaliações)"
```

**Por quê não**:
- Dificulta ordenação
- Impede filtros por contagem
- Limita análises futuras

---

## Estratégia de Atualização

### Princípio Chave

**Reviews mudam, metadados não**

| Tipo | Frequência de Atualização |
|------|--------------------------|
| Metadados RAWG | Uma vez (na adição) |
| Steam Reviews | Periódica / sob demanda |

### ❌ O Que NÃO Fazer

- Reprocessar RAWG toda vez só por causa de reviews
- Amarrar reviews ao mesmo fluxo de `enrich_library`

### ✅ O Que Fazer

Separar conceitualmente os fluxos de atualização.

---

## Opções de Atualização

### Opção A - Atualiza Sempre no Enrich (Simples)

```rust
async fn enrich_game(game_id: i64, steam_appid: Option<u32>) -> Result<()> {
    // 1. Buscar dados RAWG
    let rawg_data = fetch_rawg_data(game_id).await?;
    
    // 2. Buscar Steam reviews
    if let Some(appid) = steam_appid {
        let reviews = fetch_steam_reviews(appid).await?;
        save_reviews(&conn, game_id, reviews).await?;
    }
    
    Ok(())
}
```

**Prós**:
- ✅ Simples de implementar
- ✅ Usuário já está esperando

**Contras**:
- ⚠️ Pode desperdiçar chamadas para jogos que não mudaram

**Recomendação**: ✅ **Boa escolha para MVP**

---

### Opção B - Atualiza se Estiver "Velho" (Recomendada)

```rust
async fn update_reviews_if_needed(
    conn: &SqliteConnection,
    game_id: i64,
    steam_appid: u32
) -> Result<()> {
    let last_update = get_last_review_update(conn, game_id).await?;
    
    // Atualizar se passou mais de 15 dias
    if last_update.is_none() || is_older_than_days(last_update, 15) {
        let reviews = fetch_steam_reviews(steam_appid).await?;
        save_reviews(conn, game_id, reviews).await?;
    }
    
    Ok(())
}
```

**Prós**:
- ✅ Barato (poucas requisições)
- ✅ Escalável
- ✅ Muito comum em apps reais

**Contras**:
- ⚠️ Reviews podem estar levemente desatualizados

**Recomendação**: ⭐ **Melhor custo-benefício**

---

### Opção C - Atualização Sob Demanda (Avançado)

Atualiza quando:
- Usuário abre página de detalhes do jogo
- E última atualização > 15 dias

```rust
async fn on_game_details_open(game_id: i64) -> Result<GameDetails> {
    let game = fetch_game(game_id).await?;
    
    // Atualizar reviews em background se necessário
    if let Some(appid) = game.steam_appid {
        tokio::spawn(async move {
            let _ = update_reviews_if_needed(&conn, game_id, appid).await;
        });
    }
    
    Ok(game)
}
```

**Prós**:
- ✅ UX excepcional
- ✅ Sempre relevante
- ✅ Não bloqueia interface

**Contras**:
- ⚠️ Mais código
- ⚠️ Complexidade adicional

**Recomendação**: 🚀 **Para versão futura**

---

## Implementação em Rust

### Estrutura de Dados

```rust
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize)]
pub struct SteamReviewSummary {
    pub label: String,
    pub count: u32,
    pub total_positive: u32,
    pub total_negative: u32,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
struct SteamReviewResponse {
    success: u8,
    query_summary: QuerySummary,
}

#[derive(Debug, Deserialize)]
struct QuerySummary {
    num_reviews: u32,
    review_score_desc: String,
    total_positive: u32,
    total_negative: u32,
}
```

### Cliente Steam Reviews

```rust
use reqwest;

async fn fetch_steam_reviews(appid: u32) -> Result<SteamReviewSummary, Box<dyn std::error::Error>> {
    let url = format!(
        "https://store.steampowered.com/appreviews/{}?json=1&num_per_page=0",
        appid
    );
    
    let response = reqwest::get(&url).await?;
    let data: SteamReviewResponse = response.json().await?;
    
    if data.success != 1 {
        return Err("Steam API returned error".into());
    }
    
    Ok(SteamReviewSummary {
        label: data.query_summary.review_score_desc,
        count: data.query_summary.num_reviews,
        total_positive: data.query_summary.total_positive,
        total_negative: data.query_summary.total_negative,
        updated_at: Utc::now(),
    })
}
```

### Salvar no Banco

```rust
use sqlx::SqliteConnection;

async fn save_reviews(
    conn: &mut SqliteConnection,
    game_id: i64,
    reviews: SteamReviewSummary
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE game_details 
         SET steam_review_label = ?, 
             steam_review_count = ?,
             steam_review_updated_at = ?
         WHERE game_id = ?"
    )
    .bind(&reviews.label)
    .bind(reviews.count as i64)
    .bind(reviews.updated_at.to_rfc3339())
    .bind(game_id)
    .execute(conn)
    .await?;
    
    Ok(())
}
```

### Verificar Se Precisa Atualizar

```rust
use chrono::Duration;

async fn needs_update(
    conn: &SqliteConnection,
    game_id: i64
) -> Result<bool, sqlx::Error> {
    let result: Option<String> = sqlx::query_scalar(
        "SELECT steam_review_updated_at FROM game_details WHERE game_id = ?"
    )
    .bind(game_id)
    .fetch_optional(conn)
    .await?;
    
    match result {
        None => Ok(true), // Nunca atualizou
        Some(timestamp) => {
            let last_update = DateTime::parse_from_rfc3339(&timestamp)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now());
            
            let age = Utc::now() - last_update;
            Ok(age > Duration::days(15))
        }
    }
}
```

---

## Integração SEM Quebrar Código Atual

### Comando Separado

```rust
// Criar função independente
async fn update_steam_reviews(game_id: i64) -> Result<()> {
    let game = fetch_game(game_id).await?;
    
    if let Some(appid) = game.steam_appid {
        if needs_update(&conn, game_id).await? {
            let reviews = fetch_steam_reviews(appid).await?;
            save_reviews(&conn, game_id, reviews).await?;
        }
    }
    
    Ok(())
}
```

### Integração no Enrich Existente

```rust
async fn enrich_library(games: Vec<Game>) -> Result<()> {
    for game in games {
        // 1. Enrich normal (RAWG)
        enrich_from_rawg(&game).await?;
        
        // 2. Atualizar reviews (opcional, não bloqueia)
        if let Some(appid) = game.steam_appid {
            let _ = update_steam_reviews_if_needed(game.id, appid).await;
        }
    }
    
    Ok(())
}
```

**Nenhuma dependência com RAWG** ✅

---

## UX Recomendada

### Exemplo na Interface

```
Steam Reviews:
🟢 Very Positive (731k avaliações)
```

### Com Badge Colorido

```rust
fn get_review_badge(label: &str) -> (&str, &str) {
    match label {
        "Overwhelmingly Positive" | "Very Positive" | "Positive" => 
            ("🟢", "text-green-500"),
        "Mostly Positive" => 
            ("🟢", "text-green-400"),
        "Mixed" => 
            ("🟡", "text-yellow-500"),
        "Mostly Negative" | "Negative" | "Very Negative" | "Overwhelmingly Negative" => 
            ("🔴", "text-red-500"),
        _ => 
            ("⚪", "text-gray-500"),
    }
}
```

### Componente React

```typescript
interface SteamReview {
  label: string;
  count: number;
}

const SteamReviewBadge: React.FC<{ review: SteamReview }> = ({ review }) => {
  const getBadgeColor = (label: string) => {
    if (label.includes('Positive')) return 'bg-green-500';
    if (label.includes('Negative')) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`px-3 py-1 rounded-full text-white text-sm ${getBadgeColor(review.label)}`}>
        {review.label}
      </span>
      <span className="text-gray-400 text-sm">
        ({review.count.toLocaleString()} avaliações)
      </span>
    </div>
  );
};
```

---

## Casos de Borda

### Tratamento de Erros

| Caso | Comportamento |
|------|---------------|
| Jogo sem Steam AppID | Campo `NULL`, não exibir badge |
| Jogo removido da Steam | Manter último valor salvo |
| Jogo adulto | Reviews ainda funcionam normalmente |
| Reviews ocultos | Steam retorna `success = 1` mas sem `review_score_desc` |

### Implementação de Fallback

```rust
async fn get_review_display(game_id: i64) -> Option<String> {
    let review = get_steam_review(game_id).await;
    
    match review {
        Some(r) if !r.label.is_empty() => Some(format!("{} ({})", r.label, r.count)),
        _ => None, // Não exibir nada se não houver dados
    }
}
```

---

## Vantagens desta Abordagem

### ✅ Comparado ao Metacritic

| Aspecto | Steam Reviews | Metacritic |
|---------|---------------|------------|
| **Cobertura** | Alta (todos jogos Steam) | Baixa (só AAA) |
| **Atualização** | Tempo real | Lenta |
| **Relevância** | Jogadores reais | Críticos |
| **Gratuito** | Sim | Sim (mas limitado) |
| **API oficial** | Sim | Sim |

### 🎯 Benefícios para o App

- ✅ Dados sempre atualizados
- ✅ Maior cobertura de jogos
- ✅ Mais relevante para usuários
- ✅ Complementa perfeitamente o Metacritic
- ✅ Não requer scraping ou autenticação

---

## Conclusão

### ✅ Decisões Corretas

1. **Guardar apenas texto + número** é a melhor escolha
2. **Reviews devem ser atualizados separadamente** dos metadados
3. **Steam Reviews agregam mais valor** que Metacritic
4. **Sua ideia não quebra a arquitetura atual**
5. **Isso posiciona seu app num nível bem acima de MVP comum**

### 🚀 Próximos Passos

1. Implementar cliente Steam Reviews (simples)
2. Adicionar colunas no banco de dados
3. Integrar no fluxo de enrich (Opção A ou B)
4. Criar componente de UI para exibir reviews
5. (Futuro) Implementar atualização sob demanda (Opção C)

### 💡 Recomendação Final

**Use Steam Reviews como fonte primária de avaliação** e mantenha Metacritic como complemento (especialmente útil para link externo). Esta combinação oferece:

- Perspectiva de jogadores (Steam)
- Perspectiva de críticos (Metacritic)
- Cobertura máxima de jogos
- Dados sempre atualizados

**Isso não é apenas viável - é a melhor solução!** 🎯
