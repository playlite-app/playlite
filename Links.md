# Integração de Links Externos em Apps de Gerenciamento de Jogos

Documentação sobre quais links integrar e como estruturá-los para aplicativos como Playlite/Game Manager.

---

## Contexto

Este documento apresenta estratégias para integração de links externos usando a RAWG API, focando em agregar valor real sem sobrecarregar a interface ou depender de scraping.

---

## Links Oficiais Retornados pela RAWG

A RAWG API retorna vários links úteis diretamente no endpoint `/games/{id}`.

### 1. Site Oficial (`website`)

```json
"website": "https://www.cyberpunk.net"
```

**Características**:
- Site oficial do jogo
- Ótimo para botão "Site oficial"
- Nem todos os jogos têm

**Recomendação**: ✅ **Vale integrar**

---

### 2. Reddit (`reddit_url`)

```json
"reddit_url": "https://www.reddit.com/r/cyberpunkgame/"
```

**Características**:
- Link direto para o subreddit do jogo
- Excelente para encontrar comunidade
- Muito bom diferencial de UX

**Recomendação**: ✅ **Vale integrar**

---

### 3. Metacritic (`metacritic_url`)

```json
"metacritic_url": "https://www.metacritic.com/game/pc/cyberpunk-2077"
```

**Características**:
- Link direto para reviews no Metacritic
- Mais confiável que só mostrar o score
- Permite usuário ver reviews completas

**Recomendação**: ✅ **Vale integrar**

---

### 4. Lojas (`stores`)

```json
"stores": [
  {
    "store": { "id": 1, "name": "Steam" },
    "url": "https://store.steampowered.com/app/1091500/"
  }
]
```

**Características**:
- Links diretos para lojas: Steam, GOG, Epic, PlayStation Store, Xbox Store
- Muito útil para compra/acesso rápido

**Limitações**:
- ⚠️ URLs às vezes quebram
- ⚠️ Cobertura varia entre jogos

**Recomendação**: ✅ **Vale integrar** (com fallback)

---

## Links Construídos (Não Fornecidos Diretamente)

### 1. Página do Jogo na RAWG ✅

Construir manualmente:

```rust
let rawg_url = format!("https://rawg.io/games/{}", game_id);
```

**Uso**:
- Link público da RAWG com screenshots, reviews e infos extras
- Ótimo para botão "Ver mais detalhes"

**Recomendação**: ✅ **Integrar** (você já está fazendo isso corretamente)

---

### 2. Steam (Fallback) ✅

Se você tem o `steam_appid`:

```rust
let steam_url = format!("https://store.steampowered.com/app/{}", steam_appid);
```

**Uso**:
- Útil quando RAWG não traz `stores.url`
- Link direto confiável

**Recomendação**: ✅ **Integrar como fallback**

---

### 3. YouTube / Twitch (Opcional)

**Status**: ❌ RAWG não fornece links oficiais de vídeo

**Alternativas**:
- Usar trailers da Steam API
- YouTube search (opcional, mas adiciona complexidade)

**Recomendação**: ⚠️ **Opcional** - só se agregar valor real

---

## Links de Mídia (Imagens)

### 1. Background Image ✅

```json
"background_image": "https://media.rawg.io/media/games/..."
```

**Uso**:
- Capa
- Background
- Banner

**Recomendação**: ✅ **Já está usando corretamente**

---

### 2. Background Image Additional ⚠️

```json
"background_image_additional": "https://..."
```

**Uso**:
- Imagem alternativa (nem sempre vem)

**Recomendação**: ⚠️ **Opcional**

---

## Links que NÃO Vale Integrar

### ❌ Redes Sociais (Facebook / Twitter / Instagram)

**Por quê**:
- RAWG não fornece links oficiais confiáveis
- Dados desatualizados ou inexistentes
- Baixo valor agregado

**Recomendação**: ❌ **Não integrar**

---

### ❌ Wikipedia

**Por quê**:
- Não vem na API
- Melhor deixar para o usuário buscar se quiser

**Recomendação**: ❌ **Não integrar**

---

## Resumo: O Que Integrar

| Link | Fonte | Integrar? | Prioridade |
|------|-------|-----------|------------|
| Site oficial | `website` | ✅ Sim | Alta |
| Página RAWG | Construído | ✅ Sim | Alta |
| Reddit | `reddit_url` | ✅ Sim | Média |
| Metacritic | `metacritic_url` | ✅ Sim | Alta |
| Steam / Lojas | `stores.url` | ✅ Sim | Alta |
| Imagens | `background_image` | ✅ Sim | Alta |
| Redes sociais | ❌ N/A | ❌ Não | - |
| Wikipedia | ❌ N/A | ❌ Não | - |

---

## Recomendação para UI

### Botões Sugeridos na Interface do Jogo

Para o Playlite/Game Manager, integre **exatamente estes botões**:

1. 🌐 **Site Oficial** (`website`)
2. ⭐ **Metacritic** (`metacritic_url`)
3. 💬 **Reddit** (`reddit_url`)
4. 🛒 **Loja** (Steam / GOG / Epic) (`stores.url`)
5. 📖 **RAWG** (construído)

### Benefícios desta Seleção

✅ Não sobrecarrega a UI  
✅ Agrega valor real  
✅ Mantém fontes confiáveis  
✅ Evita scraping  
✅ Cobre os casos de uso principais

---

## Modelagem de Banco de Dados

### ❌ Não Faça Isso (Antipadrão)

```sql
CREATE TABLE games (
    website TEXT,
    reddit_url TEXT,
    metacritic_url TEXT,
    steam_url TEXT,
    gog_url TEXT,
    epic_url TEXT
    -- Vai precisar de migration toda vez que adicionar novo link
);
```

**Problemas**:
- Colunas demais
- Migrations frequentes
- Não escala

---

### ✅ Faça Isso (Padrão Recomendado)

```sql
CREATE TABLE games (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    external_links JSON,
    -- outros campos...
);
```

**Exemplo de estrutura JSON**:

```json
{
  "rawg": "https://rawg.io/games/1234",
  "website": "https://www.cyberpunk.net",
  "reddit": "https://www.reddit.com/r/cyberpunkgame/",
  "metacritic": "https://www.metacritic.com/game/pc/cyberpunk-2077",
  "steam": "https://store.steampowered.com/app/1091500/",
  "gog": "https://www.gog.com/game/...",
  "epic": "https://www.epicgames.com/store/..."
}
```

### Vantagens desta Abordagem

✅ Evita migrations  
✅ Facilita renderização na UI  
✅ Escala melhor  
✅ Flexível para novos links no futuro  

---

## Implementação em Rust

### Estrutura de Dados

```rust
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExternalLinks {
    #[serde(flatten)]
    links: HashMap<String, String>,
}

impl ExternalLinks {
    pub fn new() -> Self {
        Self {
            links: HashMap::new(),
        }
    }

    pub fn add_link(&mut self, key: &str, url: String) {
        if !url.is_empty() {
            self.links.insert(key.to_string(), url);
        }
    }

    pub fn get_link(&self, key: &str) -> Option<&String> {
        self.links.get(key)
    }

    pub fn from_rawg_response(game: &RawgGame, steam_appid: Option<u32>) -> Self {
        let mut links = Self::new();

        // Links diretos da RAWG
        if let Some(website) = &game.website {
            links.add_link("website", website.clone());
        }

        if let Some(reddit) = &game.reddit_url {
            links.add_link("reddit", reddit.clone());
        }

        if let Some(metacritic) = &game.metacritic_url {
            links.add_link("metacritic", metacritic.clone());
        }

        // Construir link RAWG
        links.add_link("rawg", format!("https://rawg.io/games/{}", game.slug));

        // Links de lojas
        if let Some(stores) = &game.stores {
            for store in stores {
                let store_name = store.store.name.to_lowercase();
                if let Some(url) = &store.url {
                    links.add_link(&store_name, url.clone());
                }
            }
        }

        // Fallback para Steam
        if let Some(appid) = steam_appid {
            if !links.links.contains_key("steam") {
                links.add_link(
                    "steam",
                    format!("https://store.steampowered.com/app/{}", appid)
                );
            }
        }

        links
    }
}
```

### Uso Prático

```rust
// Ao salvar no banco
let external_links = ExternalLinks::from_rawg_response(&rawg_game, Some(1091500));
let links_json = serde_json::to_string(&external_links)?;

// Inserir no banco
sqlx::query("INSERT INTO games (name, external_links) VALUES (?, ?)")
    .bind(&game_name)
    .bind(&links_json)
    .execute(&pool)
    .await?;

// Ao ler do banco
let row: (String,) = sqlx::query_as("SELECT external_links FROM games WHERE id = ?")
    .bind(game_id)
    .fetch_one(&pool)
    .await?;

let links: ExternalLinks = serde_json::from_str(&row.0)?;

// Usar na UI
if let Some(website) = links.get_link("website") {
    println!("Site oficial: {}", website);
}
```

---

## Renderização na Interface (React)

### Componente de Links

```typescript
interface ExternalLinks {
  website?: string;
  reddit?: string;
  metacritic?: string;
  steam?: string;
  gog?: string;
  epic?: string;
  rawg?: string;
}

interface GameLinksProps {
  links: ExternalLinks;
}

const GameLinks: React.FC<GameLinksProps> = ({ links }) => {
  const linkConfig = [
    { key: 'website', label: 'Site Oficial', icon: '🌐' },
    { key: 'metacritic', label: 'Metacritic', icon: '⭐' },
    { key: 'reddit', label: 'Reddit', icon: '💬' },
    { key: 'steam', label: 'Steam', icon: '🛒' },
    { key: 'gog', label: 'GOG', icon: '🛒' },
    { key: 'epic', label: 'Epic', icon: '🛒' },
    { key: 'rawg', label: 'RAWG', icon: '📖' },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {linkConfig.map(({ key, label, icon }) => {
        const url = links[key as keyof ExternalLinks];
        if (!url) return null;

        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-2 transition"
          >
            <span>{icon}</span>
            <span>{label}</span>
          </a>
        );
      })}
    </div>
  );
};
```

---

## Tratamento de Links Quebrados

### Validação Básica

```rust
fn is_valid_url(url: &str) -> bool {
    url.starts_with("http://") || url.starts_with("https://")
}

// Ao processar links da RAWG
if let Some(website) = &game.website {
    if is_valid_url(website) {
        links.add_link("website", website.clone());
    }
}
```

### Fallback para Steam

```rust
// Se RAWG não retornou link da Steam, construir manualmente
if let Some(steam_appid) = game.steam_appid {
    if !links.links.contains_key("steam") {
        links.add_link(
            "steam",
            format!("https://store.steampowered.com/app/{}", steam_appid)
        );
    }
}
```

---

## Boas Práticas

### 1. ✅ Priorize Links Oficiais
- Use sempre que disponíveis na RAWG
- Construa fallbacks apenas quando necessário

### 2. ✅ Valide URLs
- Verifique formato antes de salvar
- Implemente tratamento de erro na UI

### 3. ✅ Use JSON para Flexibilidade
- Evita migrations frequentes
- Facilita adição de novos links

### 4. ✅ Não Sobrecarregue a UI
- Mostre apenas links relevantes
- Use design clean e organizado

### 5. ✅ Indique Links Externos
- Use `target="_blank"`
- Adicione `rel="noopener noreferrer"` para segurança

---

## Conclusão

### O Que Você Deve Fazer

✅ Integrar links oficiais da RAWG: `website`, `reddit_url`, `metacritic_url`, `stores`  
✅ Construir link RAWG manualmente  
✅ Usar Steam AppID como fallback  
✅ Armazenar tudo em JSON (`external_links`)  
✅ Renderizar apenas links disponíveis na UI  

### O Que Você Deve Evitar

❌ Criar colunas separadas para cada link  
❌ Integrar redes sociais (dados não confiáveis)  
❌ Scraping de sites externos  
❌ Sobrecarregar a UI com muitos botões  

---

### Resultado Final

Com esta abordagem você terá:
- ✅ UI limpa e funcional
- ✅ Fonte de dados confiável (RAWG)
- ✅ Código fácil de manter
- ✅ Experiência do usuário excelente
- ✅ Escalabilidade para novos links no futuro

**A RAWG fornece links oficiais suficientes para um app completo, e você já está usando corretamente parte deles. Integrar os demais melhorará significativamente a UX!** 🚀
