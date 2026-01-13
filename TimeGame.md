# Alternativas para Estimativa de Duração de Jogos

Documentação de estratégias para substituir HowLongToBeat (HLTB) e IGDB em aplicativos de gerenciamento de biblioteca de jogos.

---

## Contexto

Este documento apresenta alternativas práticas para estimar a duração de jogos sem depender do HowLongToBeat, voltado especialmente para aplicações construídas com **Tauri (Rust + React)** como o Playlite/Game Manager.

---

## Fontes de Dados Disponíveis

### RAWG API

- **Vantagem**: Já em uso no projeto, fornece metadados ricos
- **Limitação**: Playtime tende a ser inflado e impreciso
- **Melhor uso**: Como base para metadados (gêneros, tags, perspectiva)

### SteamSpy

- **Vantagem**: Estatísticas agregadas reais de jogadores
- **Dados fornecidos**:
  - Média de horas jogadas (`average_playtime`)
  - Mediana (`median_playtime`)
  - Distribuição de jogadores
- **Limitações**:
  - Não oficial da Valve
  - Estimativas estatísticas
  - Péssimo para multiplayer e live service
  - Dados imprecisos para jogos antigos com replay infinito
- **Melhor uso**: Mediana como base para single-player

---

## Interpretação de Playtime por Tipo de Jogo

| Tipo de jogo | O que o playtime representa |
|--------------|----------------------------|
| Single-player linear | Entre Main Story e Main + Extras |
| Open world | Valor bem inflado |
| Multiplayer / Live service | Quase inútil para duração |
| Roguelike / Sandbox | Extremamente variável |

### Exemplo Real: The Witcher 3

- **HLTB Main Story**: ~50h
- **HLTB Completionist**: ~170h
- **RAWG playtime**: 70–90h (inflado)

---

## Estratégias de Estimativa

### 1. Heurística com RAWG (Básica)

Aplicar fatores de correção baseados no tipo de jogo:

```text
RAWG playtime ≈ Main Story × 1.3 ~ 1.6
```

**Regra geral**:

- Jogos lineares → usar quase direto (× 0.8)
- Open world → aplicar redutor (× 0.6)
- Multiplayer → ignorar completamente

```rust
if is_open_world {
    estimated_main = rawg_playtime * 0.6;
} else {
    estimated_main = rawg_playtime * 0.8;
}
```

---

### 2. Heurística Inteligente com RAWG (Recomendada)

Usar metadados da RAWG para aplicar fatores mais precisos.

#### Tabela de Fatores de Correção

| Condição | Fator de Ajuste |
|----------|----------------|
| Single-player linear | × 0.75 |
| Open world | × 0.55 |
| RPG / JRPG | × 0.65 |
| Roguelike | × 0.40 |
| Multiplayer / Live service | ❌ Ignorar |
| Franquias longas (AC, TES, Witcher) | × 0.6 |

#### Implementação em Rust

```rust
fn estimate_main_story(rawg_playtime: f32, tags: &[Tag], genres: &[Genre]) -> Option<f32> {
    if tags.contains("Multiplayer") {
        return None;
    }

    let mut factor = 0.75;

    if genres.contains("RPG") {
        factor *= 0.85;
    }

    if tags.contains("Open World") {
        factor *= 0.7;
    }

    Some(rawg_playtime * factor)
}
```

**Precisão esperada**: ±15% do HLTB para jogos single-player.

---

### 3. Modelo Híbrido com SteamSpy (Melhor Alternativa)

Combinar dados do SteamSpy com heurística baseada em gêneros.

#### Fórmula

```text
Estimated Main Story = 
    SteamSpy median playtime
    × genre_factor
    × open_world_factor
```

#### Estratégia Completa

1. **Base de metadados**: RAWG (gênero, tags, open world)
2. **Duração estimada**: SteamSpy (mediana preferível à média)
3. **Ajuste por contexto**: Aplicar fatores de correção

**Vantagens**:

- Dados reais de jogadores
- Mais preciso que RAWG sozinho
- Não requer scraping

**Desvantagens**:

- Dependência de fonte não-oficial
- Cobertura limitada a jogos na Steam

---

## Recomendação Final para Playlite/Game Manager

**Modelo híbrido sem scraping**:

- Base: RAWG → metadados completos
- Duração: SteamSpy → mediana de playtime
- Ajuste: Fatores por gênero e características

---

## Conclusões

| Abordagem | Avaliação |
|-----------|-----------|
| Steam nativa | ❌ Não substitui HLTB |
| SteamSpy + heurística | ✅ Melhor alternativa prática hoje |
| RAWG sozinho | ⚠️ Não é suficiente |
| Crowd + heurística | 🧠 Caminho sustentável |

---

# Exemplo de uso em Rust da melhor alternativa

```rust
use serde::{Deserialize, Serialize};
use reqwest;
use std::time::Duration;
use tokio::time::sleep;

#[derive(Debug, Deserialize)]
struct SteamSpyApp {
    appid: u32,
    name: String,
    average_playtime: u32,      // em minutos!
    median_playtime: u32,        // em minutos!
    owners: String,
    #[serde(default)]
    genre: String,
    #[serde(default)]
    tags: std::collections::HashMap<String, u32>,
}

async fn get_game_playtime(appid: u32) -> Result<SteamSpyApp, Box<dyn std::error::Error>> {
    let url = format!(
        "https://steamspy.com/api.php?request=appdetails&appid={}",
        appid
    );
    
    // Respeitar rate limit de 1 req/segundo
    sleep(Duration::from_secs(1)).await;
    
    let response = reqwest::get(&url).await?;
    let data: SteamSpyApp = response.json().await?;
    
    Ok(data)
}

// Converter minutos para horas
fn minutes_to_hours(minutes: u32) -> f32 {
    minutes as f32 / 60.0
}
```

### ⚠️ Pontos de Atenção:

- Playtime em minutos: Os valores de playtime são retornados em minutos, não horas.
- Precisão: SteamSpy extrapola dados de perfis limitados e não é 100% correto, mas desenvolvedores reportaram que os algoritmos podem fornecer números precisos dentro de 10%.
- Free Weekends: Jogos com free weekend recente terão dados distorcidos
- Jogos novos: Dados podem ser imprecisos para lançamentos recentes

### 💡 Recomendação:

- Para o Playlite/Game Manager, sugiro:

  - Cache local: Guardar dados por 24h (já que atualizam diariamente)
  - Usar median_playtime: Mais confiável que average_playtime
  - Aplicar heurística: Combinar com tags/gêneros da RAWG
  - Fallback: Se SteamSpy não tiver dados, usar RAWG com heurística.

```rust
async fn estimate_duration(steam_appid: u32, rawg_data: &RawgGame) -> Option<f32> {
    // Tentar SteamSpy primeiro
    if let Ok(spy_data) = get_game_playtime(steam_appid).await {
        let hours = minutes_to_hours(spy_data.median_playtime);
        
        // Aplicar fatores de correção
        let adjusted = if rawg_data.tags.contains("Open World") {
            hours * 0.6
        } else if rawg_data.tags.contains("Multiplayer") {
            return None; // Ignorar multiplayer
        } else {
            hours * 0.75
        };
        
        return Some(adjusted);
    }
    
    // Fallback para RAWG com heurística
    rawg_fallback(rawg_data)
}
```

Ultima atualização: 13/01/2026
