# Alternativas para Age Rating e Filtragem de Conteúdo Adulto

Documentação de estratégias para classificação etária e detecção de conteúdo adulto em aplicativos de gerenciamento de biblioteca de jogos.

---

## Contexto

Este documento apresenta alternativas práticas para classificação etária e filtragem de conteúdo sensível, com foco na simplicidade e eficácia para aplicações como o Playlite/Game Manager (Tauri + Rust + React).

---

## Fontes de Dados Disponíveis

### RAWG API

#### ✅ O que fornece

- **ESRB Rating** oficial quando disponível
- Campo: `esrb_rating`

```json
"esrb_rating": {
  "id": 4,
  "name": "Mature",
  "slug": "mature"
}
```

#### Valores ESRB Comuns

| RAWG Slug | Significado |
|-----------|-------------|
| `everyone` | Livre |
| `everyone-10-plus` | +10 |
| `teen` | +13 |
| `mature` | +17 |
| `adults-only` | +18 |
| `rating-pending` | Ainda não classificado |

#### ❌ Limitações Críticas

- **Cobertura baixa**: Nem todos os jogos têm ESRB
- **Jogos sem rating**: Indies, jogos antigos, PC-only frequentemente vêm como `null`
- **Sem PEGI**: RAWG não converte PEGI automaticamente
- **Não é erro**: Se vier `null`, normalmente o jogo realmente não tem rating no banco

**Resumo**:
| Informação | RAWG fornece? | Observação |
|------------|---------------|------------|
| Faixa etária (ESRB) | ✅ Sim | `esrb_rating` |
| PEGI | ❌ Não | Somente ESRB |

---

### Steam Store API

#### ✅ O que fornece

A Steam é **muito superior** para detecção de conteúdo sensível:

- **Categories** (categorias do jogo)
- **Genres** (gêneros)
- **Tags** (user-generated e curadas)
- **Content flags** (flags de conteúdo sensível)

#### Tags/Categorias de Conteúdo Adulto

Tags relevantes encontradas na Steam:

- `Sexual Content`
- `Nudity`
- `Hentai`
- `Adult Only Sexual Content`
- `NSFW`
- `Violent Sexual Content`
- `Eroge`

**Importante**: 

- Não são ESRB/PEGI
- São **curados pela Valve**
- Usados pela própria Steam para filtros
- **Alta confiabilidade prática**

---

## Comparação: ESRB/PEGI vs Steam Tags

| Critério | ESRB / PEGI | Steam Tags |
|----------|-------------|------------|
| **Cobertura** | ❌ Baixa | ✅ Alta |
| **Atualização** | ❌ Lenta | ✅ Constante |
| **Complexidade** | ❌ Alta | ✅ Baixa |
| **UX** | ⚠️ Confusa | ✅ Clara |
| **Propósito (filtrar adulto)** | ⚠️ Indireto | ✅ Direto |

**Conclusão**: Para filtrar conteúdo adulto, Steam tags são superiores.

---

## Estratégia Recomendada

### Abordagem Simplificada (Melhor para UX)

Em vez de usar `age_rating` complexo, use:

```
is_adult_content: boolean
```

#### Vantagens

- ✅ Simplifica o domínio
- ✅ Melhora a experiência do usuário
- ✅ Evita dados inconsistentes
- ✅ Alinha com o uso real do app
- ✅ Resolve o problema prático

**Isso é boa arquitetura, não "workaround".**

---

## Modelagem de Banco de Dados

### Opção Mínima (Suficiente)

```sql
is_adult_content BOOLEAN NOT NULL DEFAULT false
adult_source ENUM('steam_tags', 'user_override')
```

### Opção Melhor (Future-proof)

```sql
adult_flags TEXT[]   -- ex: ['sexual_content', 'hentai']
adult_source ENUM('steam_store', 'user')
```

**Benefícios da segunda opção**:

- Permite refinar no futuro
- Explica ao usuário **por que** o jogo foi ocultado
- Mantém rastreabilidade

---

## Implementação em Rust

### Detecção de Conteúdo Adulto via Steam

```rust
fn is_adult_from_steam(tags: &[String]) -> bool {
    let adult_keywords = [
        "hentai",
        "sexual",
        "nudity",
        "adult",
        "nsfw",
        "eroge",
    ];

    let tags_lower: Vec<String> = tags
        .iter()
        .map(|t| t.to_lowercase())
        .collect();

    tags_lower.iter().any(|tag| {
        adult_keywords.iter().any(|keyword| tag.contains(keyword))
    })
}
```

### Estrutura de Dados Sugerida

```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct GameContentFlags {
    pub is_adult_content: bool,
    pub adult_flags: Vec<String>,
    pub adult_source: AdultContentSource,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum AdultContentSource {
    SteamTags,
    UserOverride,
    Unknown,
}

// Aplicação prática
impl GameContentFlags {
    pub fn from_steam_tags(tags: &[String]) -> Self {
        let adult_keywords = [
            "hentai", "sexual", "nudity", "adult", "nsfw", "eroge"
        ];
        
        let mut detected_flags = Vec::new();
        let tags_lower: Vec<String> = tags
            .iter()
            .map(|t| t.to_lowercase())
            .collect();

        for tag in &tags_lower {
            for keyword in &adult_keywords {
                if tag.contains(keyword) {
                    detected_flags.push(tag.clone());
                    break;
                }
            }
        }

        Self {
            is_adult_content: !detected_flags.is_empty(),
            adult_flags: detected_flags,
            adult_source: AdultContentSource::SteamTags,
        }
    }
}
```

---

## Heurística Completa de Detecção

### Tags para Considerar como Adulto

```rust
const ADULT_KEYWORDS: &[&str] = &[
    "hentai",
    "sexual content",
    "nudity",
    "adult only sexual content",
    "nsfw",
    "eroge",
    "sexual",
    "adult",
];
```

### Fluxo de Detecção

```text
1. Buscar tags da Steam Store API
2. Aplicar heurística de detecção (case-insensitive)
3. Se detectado → marcar is_adult_content = true
4. Armazenar flags específicas encontradas
5. Permitir override manual do usuário
```

---

## Limitações e Considerações

### ⚠️ O que NÃO é coberto

- ❌ Jogos violentos sem nudez
- ❌ Jogos adultos "camuflados" sem tags apropriadas
- ❌ Inconsistência em jogos muito antigos
- ❌ Dependência da Steam (jogos fora da loja não têm dados)

### ✅ Quando é Aceitável

Esta abordagem funciona muito bem para:

- Apps pessoais
- Backlog managers
- Apps focados em PC gaming
- Casos onde simplicidade > perfeição

---

## Recomendação Final

### Para o Playlite/Game Manager

**✅ Faça isso**:

1. Use a **Steam Store API** para detectar conteúdo adulto
2. Troque `age_rating` complexo por `is_adult_content` simples
3. Permita **override manual** do usuário
4. Armazene `adult_flags` para rastreabilidade
5. Documente como **decisão arquitetural**

**❌ Evite isso**:

- Não tente mapear ESRB/PEGI manualmente
- Não complique com múltiplos sistemas de rating
- Não dependa apenas da RAWG para este propósito

### Fluxo Completo Sugerido

```text
1. Ao adicionar jogo:
   ├─ Buscar dados da RAWG (metadados gerais)
   ├─ Buscar dados da Steam (se tiver Steam AppID)
   ├─ Aplicar detecção de conteúdo adulto
   └─ Salvar no banco com flags

2. Na interface:
   ├─ Mostrar toggle "Ocultar conteúdo adulto"
   ├─ Permitir usuário marcar/desmarcar manualmente
   └─ Explicar quais flags foram detectadas
```

---

## Exemplo de Interface

### Configurações do Usuário

```text
[ ] Ocultar jogos com conteúdo adulto
    ├─ Detectado automaticamente via Steam
    └─ Você pode ajustar manualmente para cada jogo
```

### Detalhes do Jogo

```text
⚠️ Conteúdo Adulto Detectado
   Tags: Sexual Content, Nudity
   Fonte: Steam Store
   
   [ Marcar como seguro ] [ Manter como adulto ]
```

---

## Conclusão

### Decisão Arquitetural

**Usar Steam tags para conteúdo adulto é a melhor escolha porque**:

- Resolve o problema real (filtrar conteúdo sensível)
- Tem maior cobertura que ESRB/PEGI
- É mais simples de implementar e manter
- Alinha com o ecossistema Steam (maioria dos jogos PC)
- Permite override do usuário quando necessário

**Esta não é uma solução "hacky" — é design pragmático e eficaz.** 🎯
