# 📋 Relatório: Integração Multi-Plataforma - Playlite

## 🎯 Resumo Executivo

Este relatório documenta o planejamento para expansão do Playlite além do Steam, integrando múltiplas plataformas de jogos (Epic, GOG, EA, Ubisoft, Battle.net, Microsoft Store). O objetivo é criar uma biblioteca unificada sem duplicatas, com tratamento inteligente de DLCs, demos e versões especiais.

## 🎮 Análise de Plataformas

### Tier 1: Acesso por Arquivos Locais (Mais Fácil)

| Plataforma | Método | Localização | Dados Disponíveis |
|------------|--------|-------------|-------------------|
| Epic Games | Arquivos JSON | %ProgramData%\Epic\EpicGamesLauncher\Data\Manifests\ | ❌ Apenas instalados |
| GOG Galaxy | SQLite Database | %ProgramData%\GOG.com\Galaxy\storage\galaxy-2.0.db | ✅ Biblioteca completa |
| EA App | XML/JSON | %ProgramData%\Origin\ ou %AppData%\Origin\ | ❌ Apenas instalados |

### Tier 2: Acesso Parcial (Médio)

| Plataforma | Método | Limitações |
|------------|--------|------------|
| Ubisoft Connect | Registro + Arquivos | Estrutura menos documentada, apenas instalados |
| Battle.net | Arquivos config | Principalmente instalados, poucos jogos no catálogo |

### Tier 3: Requer OAuth/API (Avançado)

| Plataforma | API Necessária | Observações |
|------------|----------------|-------------|
| Microsoft Store/Xbox | Xbox Live API | ✅ Funciona para PC (não precisa ter console)<br>✅ Biblioteca completa<br>✅ Pode filtrar apenas jogos de PC<br>✅ Pode filtrar apenas jogos (excluir apps) |

## 🗄️ Arquitetura do Banco de Dados

Nova Estrutura Proposta:

```sql
-- ============================================
-- TABELA PRINCIPAL: GAMES
-- ============================================
CREATE TABLE games (
  id TEXT PRIMARY KEY,              -- Hash normalizado (ex: "witcher3_2015")
  title TEXT NOT NULL,              -- Nome original
  normalized_title TEXT NOT NULL,   -- Nome normalizado para matching
  year INTEGER,                     -- Ano de lançamento
  
  -- PLATAFORMAS (Arrays JSON)
  platforms TEXT NOT NULL,          -- ["steam", "gog", "epic"]
  platform_ids TEXT NOT NULL,       -- {"steam": "292030", "gog": "1207664663"}
  
  -- ESTATÍSTICAS AGREGADAS
  total_playtime INTEGER DEFAULT 0, -- Soma de todas plataformas
  last_played_platform TEXT,        -- Última plataforma usada
  installed_on TEXT,                -- ["steam", "gog"] - onde está instalado
  
  -- CLASSIFICAÇÃO
  is_demo BOOLEAN DEFAULT 0,
  is_dlc BOOLEAN DEFAULT 0,
  is_remaster BOOLEAN DEFAULT 0,
  is_remake BOOLEAN DEFAULT 0,
  parent_game_id TEXT,              -- FK para jogo base (DLCs/remasters)
  
  -- CONTROLES DE EXIBIÇÃO
  show_in_library BOOLEAN DEFAULT 1, -- Importado mas oculto (demos)
  
  -- METADADOS
  cover_image TEXT,
  description TEXT,
  genres TEXT,                       -- JSON array
  developer TEXT,
  publisher TEXT,
  
  -- TIMESTAMPS
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (parent_game_id) REFERENCES games(id)
);

-- Índices para performance
CREATE INDEX idx_games_normalized ON games(normalized_title);
CREATE INDEX idx_games_platform ON games(platforms);
CREATE INDEX idx_games_parent ON games(parent_game_id);
CREATE INDEX idx_games_show ON games(show_in_library);

-- ============================================
-- DADOS ESPECÍFICOS POR PLATAFORMA
-- ============================================
CREATE TABLE game_platform_data (
  game_id TEXT NOT NULL,
  platform TEXT NOT NULL,           -- 'steam', 'gog', 'epic', etc.
  platform_game_id TEXT NOT NULL,   -- ID original na plataforma
  
  -- STATUS
  installed BOOLEAN DEFAULT 0,
  install_path TEXT,
  install_size INTEGER,             -- Bytes
  
  -- ESTATÍSTICAS
  playtime INTEGER DEFAULT 0,       -- Minutos
  last_played DATETIME,
  achievements_unlocked INTEGER DEFAULT 0,
  achievements_total INTEGER DEFAULT 0,
  
  -- DADOS ORIGINAIS
  raw_data TEXT,                    -- JSON com dados brutos da plataforma
  
  -- TIMESTAMPS
  synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (game_id, platform),
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE INDEX idx_platform_data_platform ON game_platform_data(platform);
CREATE INDEX idx_platform_data_installed ON game_platform_data(installed);

-- ============================================
-- DLCs E CONTEÚDO ADICIONAL
-- ============================================
CREATE TABLE dlcs (
  id TEXT PRIMARY KEY,
  parent_game_id TEXT NOT NULL,
  title TEXT NOT NULL,
  normalized_title TEXT,
  
  -- TIPO DE CONTEÚDO
  dlc_type TEXT NOT NULL,           -- 'expansion', 'cosmetic', 'soundtrack', 'artbook'
  is_standalone BOOLEAN DEFAULT 0,  -- Pode ser jogado sem jogo base?
  is_playable BOOLEAN DEFAULT 1,    -- É conteúdo jogável?
  
  -- OWNERSHIP
  owned_on TEXT,                    -- JSON: ["steam", "gog"]
  platform_ids TEXT,                -- JSON: {"steam": "12345"}
  
  -- METADADOS
  release_date DATE,
  description TEXT,
  
  -- CONTROLE
  show_in_details BOOLEAN DEFAULT 1, -- Mostrar na página do jogo?
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (parent_game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE INDEX idx_dlcs_parent ON dlcs(parent_game_id);
CREATE INDEX idx_dlcs_type ON dlcs(dlc_type);
CREATE INDEX idx_dlcs_playable ON dlcs(is_playable);

-- ============================================
-- RELACIONAMENTOS ENTRE JOGOS
-- ============================================
CREATE TABLE game_relationships (
  game_id TEXT NOT NULL,
  related_game_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL,   -- 'remake', 'remaster', 'sequel', 'prequel', 'spinoff'
  
  PRIMARY KEY (game_id, related_game_id),
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (related_game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- ============================================
-- PREFERÊNCIAS DO USUÁRIO
-- ============================================
CREATE TABLE user_preferences (
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  
  PRIMARY KEY (user_id, key)
);

-- Preferências padrão recomendadas:
INSERT INTO user_preferences (user_id, key, value) VALUES
  ('default', 'show_demos', 'false'),
  ('default', 'show_dlc_separate', 'false'),
  ('default', 'show_soundtracks', 'false'),
  ('default', 'show_artbooks', 'false'),
  ('default', 'import_gog_integrations', 'false'),
  ('default', 'deduplication_mode', 'automatic');

-- ============================================
-- HISTÓRICO DE SINCRONIZAÇÃO
-- ============================================
CREATE TABLE sync_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  sync_type TEXT NOT NULL,          -- 'full', 'incremental'
  status TEXT NOT NULL,             -- 'success', 'error', 'partial'
  games_added INTEGER DEFAULT 0,
  games_updated INTEGER DEFAULT 0,
  games_removed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at DATETIME NOT NULL,
  completed_at DATETIME,
  
  duration_seconds INTEGER
);

CREATE INDEX idx_sync_platform ON sync_history(platform);
CREATE INDEX idx_sync_date ON sync_history(started_at);
```

## 🔄 Sistema de Deduplicação

Estratégia de Matching Inteligente:

```javascript
class GameMatcher {
  
  // ============================================
  // NORMALIZAÇÃO DE TÍTULOS
  // ============================================
  normalizeTitle(title) {
    return title
      .toLowerCase()
      .trim()
      // Remover caracteres especiais (mantém números)
      .replace(/[™®©:]/g, '')
      .replace(/\s+/g, ' ')
      // Remover sufixos de edição (exceto remake/remaster)
      .replace(/\s*-?\s*(goty|game of the year|complete|definitive|enhanced)$/i, '')
      .replace(/\s*-?\s*(digital deluxe|deluxe|standard|premium|gold|ultimate)$/i, '')
      .replace(/\s*edition$/i, '');
  }
  
  // ============================================
  // GERAÇÃO DE ID ÚNICO
  // ============================================
  generateGameId(title, year = null) {
    const normalized = this.normalizeTitle(title);
    const slug = this.slugify(normalized);
    
    // Incluir ano para diferenciar remakes
    const yearSuffix = year ? `_${year}` : '';
    
    return `${slug}${yearSuffix}`;
  }
  
  slugify(text) {
    return text
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  // ============================================
  // EXTRAÇÃO DE NÚMEROS (previne Witcher 2 + 3)
  // ============================================
  extractNumbers(text) {
    const arabic = text.match(/\d+/g) || [];
    const roman = text.match(/\b(I{1,3}|IV|V|VI{0,3}|IX|X|XI{0,3})\b/gi) || [];
    
    const romanValues = roman.map(r => this.romanToArabic(r));
    return [...arabic.map(Number), ...romanValues];
  }
  
  romanToArabic(roman) {
    const values = { I: 1, V: 5, X: 10, L: 50, C: 100 };
    let result = 0;
    for (let i = 0; i < roman.length; i++) {
      const current = values[roman[i].toUpperCase()];
      const next = values[roman[i + 1]?.toUpperCase()] || 0;
      result += current < next ? -current : current;
    }
    return result;
  }
  
  // ============================================
  // VERIFICAÇÃO DE MESMO JOGO
  // ============================================
  isSameGame(game1, game2) {
    const title1 = this.normalizeTitle(game1.title);
    const title2 = this.normalizeTitle(game2.title);
    
    // 1. Match exato (após normalização)
    if (title1 === title2) {
      return this.verifyNumbersMatch(title1, title2);
    }
    
    // 2. Similaridade alta (Levenshtein > 90%)
    const similarity = this.calculateSimilarity(title1, title2);
    if (similarity > 0.90) {
      return this.verifyNumbersMatch(game1.title, game2.title);
    }
    
    // 3. Aliases conhecidos
    if (this.checkKnownAliases(title1, title2)) {
      return true;
    }
    
    return false;
  }
  
  verifyNumbersMatch(title1, title2) {
    const nums1 = this.extractNumbers(title1);
    const nums2 = this.extractNumbers(title2);
    
    // Se ambos têm números, devem ser iguais
    if (nums1.length > 0 && nums2.length > 0) {
      return nums1[0] === nums2[0];
    }
    
    // Se só um tem número, não é match
    if (nums1.length !== nums2.length) {
      return false;
    }
    
    return true;
  }
  
  calculateSimilarity(str1, str2) {
    // Levenshtein distance
    const track = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) track[0][i] = i;
    for (let j = 0; j <= str2.length; j++) track[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1,
          track[j - 1][i] + 1,
          track[j - 1][i - 1] + indicator
        );
      }
    }
    
    const distance = track[str2.length][str1.length];
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - (distance / maxLength);
  }
  
  checkKnownAliases(title1, title2) {
    const aliases = {
      'pubg': 'playerunknowns battlegrounds',
      'csgo': 'counter strike global offensive',
      'cs2': 'counter strike 2',
      'mwii': 'call of duty modern warfare ii',
      'gta': 'grand theft auto'
    };
    
    for (const [alias, full] of Object.entries(aliases)) {
      if ((title1.includes(alias) && title2.includes(full)) ||
          (title2.includes(alias) && title1.includes(full))) {
        return true;
      }
    }
    
    return false;
  }
}
```

Regras de Deduplicação:

| Cenário | Ação | Exemplo |
|---------|------|---------|
| Mesmo jogo, edições diferentes | ✅ Unificar | Witcher 3 + Witcher 3 GOTY → Um registro |
| Números diferentes | ❌ Manter separado | Witcher 2 vs Witcher 3 |
| Remake/Remaster | ❌ Manter separado + relacionar | RE4 vs RE4 Remake |
| Standalone DLC | ❌ Manter separado | Far Cry 3 vs Blood Dragon |
| Demo vs Full | ❌ Manter separado | Demo oculta por padrão |

## 🎯 Tratamento de Conteúdo Especial

1. Demos

```javascript
// ESTRATÉGIA: Importar mas não exibir por padrão

function identifyDemo(game) {
  const title = game.title.toLowerCase();
  
  return (
    title.includes('demo') ||
    title.includes('trial') ||
    title.includes('beta') && !title.includes('multiplayer') ||
    game.isDemoFlag === true  // Flag da plataforma
  );
}

// No banco:
{
  is_demo: true,
  show_in_library: false  // Controlado por preferência do usuário
}

// Query frontend:
SELECT * FROM games 
WHERE show_in_library = 1 
  OR (is_demo = 1 AND user_pref_show_demos = 1)
```

2. DLCs

```javascript
const DLC_CLASSIFICATION = {
  // ✅ MOSTRAR na página do jogo:
  EXPANSION: {
    keywords: ['expansion', 'dlc', 'episode', 'chapter'],
    examples: ['Phantom Liberty', 'Blood & Wine'],
    is_playable: true,
    show_in_details: true
  },
  
  STANDALONE: {
    keywords: ['standalone'],
    examples: ['Far Cry 3: Blood Dragon', 'Dishonored: Death of the Outsider'],
    is_playable: true,
    show_in_details: false,  // Aparece como jogo separado
    is_standalone: true
  },
  
  // ❌ OCULTAR (não-jogável):
  SOUNDTRACK: {
    keywords: ['soundtrack', 'ost', 'music', 'audio'],
    is_playable: false,
    show_in_details: false
  },
  
  ARTBOOK: {
    keywords: ['artbook', 'art book', 'digital art', 'concept art'],
    is_playable: false,
    show_in_details: false
  },
  
  COSMETIC: {
    keywords: ['skin', 'cosmetic', 'outfit', 'costume', 'weapon pack'],
    note: 'Apenas se for PURAMENTE cosmético',
    is_playable: false,  // Discutível
    show_in_details: true  // Pode ser relevante para alguns jogadores
  }
};

function classifyDLC(dlcName) {
  const name = dlcName.toLowerCase();
  
  // Priority check (mais específico primeiro)
  if (name.match(/soundtrack|ost|music/)) return 'SOUNDTRACK';
  if (name.match(/artbook|art book/)) return 'ARTBOOK';
  if (name.match(/standalone/)) return 'STANDALONE';
  
  // Default: expansão jogável
  return 'EXPANSION';
}
```

3. Remasters e Remakes

```javascript
const EDITION_RULES = {
  // Mesma entrada (agregar):
  AGGREGATE: [
    /goty/i,
    /game of the year/i,
    /complete edition/i,
    /definitive edition/i,
    /gold edition/i,
    /premium edition/i,
    /ultimate edition/i,
    /enhanced edition/i  // Witcher 3 Next-Gen
  ],
  
  // Entrada separada (compra independente):
  SEPARATE: [
    /remake/i,
    /remaster/i,
    /special edition/i,      // Skyrim SE
    /anniversary edition/i,  // Skyrim AE
    /royal/i,                // Persona 5 Royal
    /scholar of the first sin/i  // Dark Souls 2
  ]
};

function shouldBeSeparateGame(newGame, existingGame) {
  const newTitle = newGame.title.toLowerCase();
  const existingTitle = existingGame.title.toLowerCase();
  
  // 1. Remake é SEMPRE separado
  if (newTitle.includes('remake') && !existingTitle.includes('remake')) {
    return {
      separate: true,
      relationship: 'remake'
    };
  }
  
  // 2. Remaster verificar se pode ser comprado separadamente
  for (const pattern of EDITION_RULES.SEPARATE) {
    if (pattern.test(newTitle) && !pattern.test(existingTitle)) {
      return {
        separate: true,
        relationship: 'remaster'
      };
    }
  }
  
  // 3. Edições especiais (GOTY, Complete) = mesmo jogo
  for (const pattern of EDITION_RULES.AGGREGATE) {
    if (pattern.test(newTitle) || pattern.test(existingTitle)) {
      return {
        separate: false,
        action: 'merge'
      };
    }
  }
  
  return { separate: false };
}

// Exemplos:
// Skyrim + Skyrim SE → Separados, relacionados
// Witcher 3 + Witcher 3 GOTY → Mesmo jogo
// RE4 + RE4 Remake → Separados, relacionados
```

## 🔄 Fluxo de Importação

Pseudocódigo Completo:

```javascript
async function importGamesFromPlatform(platform, userPreferences) {
  const startTime = Date.now();
  let stats = { added: 0, updated: 0, errors: 0 };
  
  try {
    // 1. BUSCAR JOGOS DA PLATAFORMA
    console.log(`[${platform.name}] Iniciando importação...`);
    const rawGames = await platform.fetchGames();
    
    // 2. FILTROS ESPECÍFICOS DA PLATAFORMA
    let filteredGames = rawGames;
    
    if (platform.name === 'gog' && !userPreferences.import_gog_integrations) {
      // GOG: filtrar apenas jogos nativos
      filteredGames = rawGames.filter(g => g.platform === 'gog');
    }
    
    if (platform.name === 'xbox') {
      // Xbox: filtrar apenas jogos de PC
      filteredGames = rawGames.filter(g => 
        g.devices?.includes('PC') || g.platforms?.includes('Windows')
      );
      
      // Xbox: filtrar apenas jogos (excluir apps)
      filteredGames = filteredGames.filter(g => 
        g.contentType === 'Game' || g.mediaItemType === 'Game'
      );
    }
    
    // 3. PROCESSAR CADA JOGO
    for (const rawGame of filteredGames) {
      try {
        // 3.1 Classificar tipo
        const classification = classifyGame(rawGame);
        
        // 3.2 Pular demos se configurado
        if (classification.isDemo && !userPreferences.import_demos) {
          continue;
        }
        
        // 3.3 Processar DLCs separadamente
        if (classification.isDLC) {
          await processDLC(rawGame, platform.name);
          continue;
        }
        
        // 3.4 Normalizar e gerar ID
        const matcher = new GameMatcher();
        const normalizedTitle = matcher.normalizeTitle(rawGame.title);
        const gameId = matcher.generateGameId(normalizedTitle, rawGame.year);
        
        // 3.5 Verificar se jogo já existe
        let existingGame = await db.games.findOne({ id: gameId });
        
        if (existingGame) {
          // JOGO EXISTENTE - verificar se é realmente o mesmo
          const isSame = matcher.isSameGame(rawGame, existingGame);
          
          if (isSame) {
            // É o mesmo jogo - adicionar plataforma
            await addPlatformToExistingGame(existingGame, platform.name, rawGame);
            stats.updated++;
          } else {
            // Falso positivo - verificar se é remaster/remake
            const relationship = shouldBeSeparateGame(rawGame, existingGame);
            
            if (relationship.separate) {
              // Criar como jogo novo e relacionar
              const newGame = await createGame(rawGame, platform.name, classification);
              await createRelationship(newGame.id, existingGame.id, relationship.relationship);
              stats.added++;
            } else {
              // Merge
              await addPlatformToExistingGame(existingGame, platform.name, rawGame);
              stats.updated++;
            }
          }
        } else {
          // JOGO NOVO - criar registro
          await createGame(rawGame, platform.name, classification);
          stats.added++;
        }
        
        // 3.6 Salvar dados específicos da plataforma
        await saveplatformData(gameId, platform.name, rawGame);
        
      } catch (error) {
        console.error(`Erro ao processar ${rawGame.title}:`, error);
        stats.errors++;
      }
    }
    
    // 4. REGISTRAR SINCRONIZAÇÃO
    const duration = Math.floor((Date.now() - startTime) / 1000);
    await db.sync_history.insert({
      platform: platform.name,
      sync_type: 'full',
      status: stats.errors > 0 ? 'partial' : 'success',
      games_added: stats.added,
      games_updated: stats.updated,
      started_at: new Date(startTime),
      completed_at: new Date(),
      duration_seconds: duration
    });
    
    console.log(`[${platform.name}] Importação concluída:`, stats);
    return stats;
    
  } catch (error) {
    console.error(`[${platform.name}] Erro fatal:`, error);
    
    await db.sync_history.insert({
      platform: platform.name,
      sync_type: 'full',
      status: 'error',
      error_message: error.message,
      started_at: new Date(startTime),
      completed_at: new Date()
    });
    
    throw error;
  }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function createGame(rawGame, platformName, classification) {
  const matcher = new GameMatcher();
  const gameId = matcher.generateGameId(
    matcher.normalizeTitle(rawGame.title),
    rawGame.year
  );
  
  return await db.games.insert({
    id: gameId,
    title: rawGame.title,
    normalized_title: matcher.normalizeTitle(rawGame.title),
    year: rawGame.year,
    platforms: JSON.stringify([platformName]),
    platform_ids: JSON.stringify({ [platformName]: rawGame.id }),
    is_demo: classification.isDemo,
    is_dlc: classification.isDLC,
    is_remaster: classification.isRemaster,
    show_in_library: classification.isDemo ? 
      userPreferences.show_demos : true,
    cover_image: rawGame.coverImage,
    genres: JSON.stringify(rawGame.genres || []),
    developer: rawGame.developer,
    publisher: rawGame.publisher
  });
}

async function addPlatformToExistingGame(existingGame, platformName, rawGame) {
  // Atualizar arrays de plataformas
  const platforms = JSON.parse(existingGame.platforms);
  const platformIds = JSON.parse(existingGame.platform_ids);
  
  if (!platforms.includes(platformName)) {
    platforms.push(platformName);
    platformIds[platformName] = rawGame.id;
    
    await db.games.update(existingGame.id, {
      platforms: JSON.stringify(platforms),
      platform_ids: JSON.stringify(platformIds),
      updated_at: new Date()
    });
  }
  
  // Atualizar dados da plataforma
  await savePlatformData(existingGame.id, platformName, rawGame);
}

async function savePlatformData(gameId, platformName, rawGame) {
  return await db.game_platform_data.upsert({
    game_id: gameId,
    platform: platformName,
    platform_game_id: rawGame.id,
    installed: rawGame.installed || false,
    install_path: rawGame.installPath,
    install_size: rawGame.installSize,
    playtime: rawGame.playtime || 0,
    last_played: rawGame.lastPlayed,
    achievements_unlocked: rawGame.achievementsUnlocked || 0,
    achievements_total: rawGame.achievementsTotal || 0,
    raw_data: JSON.stringify(rawGame),
    synced_at: new Date()
  });
}

async function processDLC(rawDLC, platformName) {
  const classification = classifyDLC(rawDLC.title);
  
  // Encontrar jogo pai
  const parentGame = await findParentGame(rawDLC);
  if (!parentGame) {
    console.warn(`DLC órfã: ${rawDLC.title}`);
    return;
  }
  
  // Verificar se deve ser mostrada
  const showInDetails = 
    classification.is_playable && 
    !classification.is_standalone;
  
  return await db.dlcs.insert({
    id: generateDLCId(rawDLC),
    parent_game_id: parentGame.id,
    title: rawDLC.title,
    normalized_title: normalizeTitle(rawDLC.title),
    dlc_type: classification.type,
    is_standalone: classification.is_standalone,
    is_playable: classification.is_playable,
    owned_on: JSON.stringify([platformName]),
    platform_ids: JSON.stringify({ [platformName]: rawDLC.id }),
    show_in_details: showInDetails
  });
}

function classifyGame(rawGame) {
  const title = rawGame.title.toLowerCase();
  
  return {
    isDemo: title.includes('demo') || title.includes('trial'),
    isDLC: rawGame.isDLC || rawGame.type === 'DLC',
    isRemaster: /remaster|special edition|anniversary/i.test(title),
    isRemake: /remake/i.test(title)
  };
}
```

---

## 📊 Visualização no Frontend

Card de Jogo na Biblioteca:

```jsx
<GameCard>
  <CoverImage src={game.cover_image} />
  
  <GameInfo>
    <Title>{game.title}</Title>
    
    {/* Badges de plataforma */}
    <PlatformBadges>
      {game.platforms.map(platform => (
        <PlatformBadge 
          key={platform}
          platform={platform}
          installed={game.installedOn?.includes(platform)}
          lastPlayed={game.lastPlayedPlatform === platform}
        />
      ))}
    </PlatformBadges>
    
    {/* Estatísticas agregadas */}
    <Stats>
      <Playtime>{formatPlaytime(game.totalPlaytime)}</Playtime>
      {game.lastPlayedPlatform && (
        <LastPlayed>
          Último acesso: {game.lastPlayedPlatform}
        </LastPlayed>
      )}
    </Stats>
    
    {/* Badges especiais */}
    {game.isDemo && <Badge>DEMO</Badge>}
    {game.isRemaster && <Badge>REMASTER</Badge>}
  </GameInfo>
</GameCard>
```

Página de Detalhes:

```jsx
<GameDetailsPage>
  <Header>
    <Cover src={game.cover_image} />
    <Info>
      <Title>{game.title}</Title>
      <Meta>
        {game.developer} • {game.publisher} • {game.year}
      </Meta>
      
      {/* Plataformas com ações */}
      <PlatformSection>
        {game.platforms.map(platform => {
          const platformData = game.platformData[platform];
          return (
            <PlatformCard key={platform}>
              <Icon platform={platform} />
              <Name>{platform}</Name>
              {platformData.installed && (
                <Actions>
                  <Button>Jogar</Button>
                  <Button>Desinstalar</Button>
                </Actions>
              )}
              <Stats>
                {formatPlaytime(platformData.playtime)} jogado
                {platformData.achievements && (
                  <> • {platformData.achievementsUnlocked}/{platformData.achievementsTotal} conquistas</>
                )}
              </Stats>
            </PlatformCard>
          );
        })}
      </PlatformSection>
    </Info>
  </Header>
  
  {/* DLCs (apenas jogáveis) */}
  {game.dlcs?.filter(d => d.isPlayable).length > 0 && (
    <DLCSection>
      <SectionTitle>Conteúdo Adicional</SectionTitle>
      
      <OwnedDLCs>
        {game.dlcs.filter(d => d.owned).map(dlc => (
          <DLCCard key={dlc.id} owned>
            ✓ {dlc.title}
            <PlatformBadges platforms={dlc.ownedOn} />
          </DLCCard>
        ))}
      </OwnedDLCs>
      
      <AvailableDLCs>
        {game.dlcs.filter(d => !d.owned).map(dlc => (
          <DLCCard key={dlc.id}>
            {dlc.title}
            <Badge>Não adquirida</Badge>
          </DLCCard>
        ))}
      </AvailableDLCs>
    </DLCSection>
  )}
  
  {/* Jogos relacionados */}
  {game.relationships?.length > 0 && (
    <RelatedGames>
      <SectionTitle>Jogos Relacionados</SectionTitle>
      {game.relationships.map(rel => (
        <RelatedGameCard 
          key={rel.id}
          game={rel.game}
          relationship={rel.type}
        />
      ))}
    </RelatedGames>
  )}
</GameDetailsPage>
```

---

## 🚀 Roadmap de Implementação

### **Fase 1: Fundação (Semana 1-2)**

- ✅ Steam já implementado
- 🔨 Criar nova estrutura de banco de dados
- 🔨 Implementar sistema de normalização de títulos
- 🔨 Criar matcher inteligente (com testes unitários)

### **Fase 2: Plataformas Fáceis (Semana 3-4)**

- 🔨 **GOG Galaxy** (SQLite - instalados)
- 🔨 **Epic Games** (JSON - apenas instalados)
- 🔨 **EA App** (XML/JSON - apenas instalados)
- 🔨 Sistema básico de deduplicação

### **Fase 3: Deduplicação Avançada (Semana 5)**

- 🔨 Refinamento do matching
- 🔨 Detecção de remasters/remakes
- 🔨 Sistema de relacionamentos entre jogos
- 🔨 Interface de configuração

### **Fase 4: Plataformas Médias (Semana 6-7)**

- 🔨 **Ubisoft Connect**
- 🔨 **Battle.net**
- 🔨 Tratamento de casos especiais

### **Fase 5: OAuth (Semana 8-9)**

- 🔨 **Microsoft Store / Xbox Live API**
- 🔨 Implementar OAuth 2.0
- 🔨 Epic e GOG com biiblioteca completa
- 🔨 Filtros de PC games e exclusão de apps

### **Fase 6: DLCs e Refinamentos (Semana 10+)**

- 🔨 Sistema completo de DLCs
- 🔨 Integração com PCGamingWiki (opcional)
- 🔨 Polimento da UI
- 🔨 Testes extensivos

---

## ⚠️ Considerações Importantes

### **1. Performance:**

- Indexar campos críticos (normalized_title, platforms)
- Cachear queries de biblioteca completa
- Importação incremental (não full sync sempre)
- Considerar workers para importações longas

### **2. Segurança:**

- **NUNCA** armazenar credenciais de usuário
- OAuth tokens devem ser criptografados
- Validar dados de todas as plataformas
- Rate limiting nas APIs

### **3. Experiência do Usuário:**

- Sincronização em background
- Indicadores de progresso claros
- Permitir importação seletiva de plataformas
- Desfazer importações problemáticas

### **4. Manutenção:**

- Logar todas as sincronizações
- Monitorar erros por plataforma
- Versionamento do schema do banco
- Documentar estruturas de dados de cada plataforma

### **5. Casos Edge:**

- Jogos F2P com mesmo nome (ex: CS 1.6 vs CS 2)
- Jogos removidos da loja mas instalados
- Mudanças de nome (Uplay → Ubisoft Connect)
- Múltiplas edições (Standard/Deluxe/Ultimate)
- Early Access → Release

---

## 📚 Recursos Externos Úteis

### **APIs e Integrações:**

- **SteamGridDB** - Imagens e covers
- **PCGamingWiki** - Informações sobre DLCs e versões

### **Bibliotecas Recomendadas:**

- `fast-levenshtein` - Cálculo de similaridade
- `fuzzysort` - Fuzzy matching

---

## ✅ Checklist Final

```text
BANCO DE DADOS:
□ Criar tabela games com campos agregados
□ Criar tabela game_platform_data
□ Criar tabela dlcs
□ Criar tabela game_relationships
□ Criar tabela user_preferences
□ Criar tabela sync_history
□ Adicionar índices em campos críticos
□ Script de migração do schema atual

MATCHING E DEDUPLICAÇÃO:
□ Implementar normalização de títulos
□ Implementar extração de números
□ Implementar cálculo de similaridade
□ Implementar verificação de aliases
□ Testes unitários do matcher
□ Casos edge documentados

INTEGRAÇÕES:
□ GOG Galaxy (SQLite)
□ Epic Games (JSON)
□ EA App (XML/JSON)
□ Ubisoft Connect (Registro)
□ Battle.net (Config)
□ Xbox Live API (OAuth)

FEATURES:
□ Importação de demos (ocultas por padrão)
□ Classificação de DLCs
□ Detecção de remasters/remakes
□ Sistema de relacionamentos
□ Configurações de usuário
□ Sincronização em background

FRONTEND:
□ Card com múltiplas plataformas
□ Página de detalhes expandida
□ Seção de DLCs
□ Jogos relacionados
□ Interface de configuração
□ Indicadores de sincronização

TESTES:
□ Matcher (casos complexos)
□ Deduplicação (duplicatas reais)
□ Importação de cada plataforma
□ Performance com 1000+ jogos
□ Casos edge documentados
```

Gerado em: 11 de Fevereiro de 2026
Versão: 1.0
Projeto: Playlite - Gerenciador Multi-Plataforma de Bibliotecas de Jogos