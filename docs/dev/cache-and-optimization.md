# Cache Persistente vs Cache em Sessão

## ✅ Cache SQLite Implementado (Implementação Atual)

**Você já tem um sistema robusto de cache persistente em SQLite!**

### Estrutura Atual

- **Localização**: `src-tauri/src/services/cache.rs` + `src-tauri/src/commands/caches.rs`
- **Banco**: `metadata.db` com tabela `api_cache`
- **TTL Granular por Tipo**:
  - Trending/Upcoming/Giveaways: 1 dia
  - Reviews: 7 dias
  - Store data: 30 dias
  - Playtime: 15 dias

### ✅ Pontos Fortes da Implementação

1. **TTL Dinâmico** - Calcula expiração baseada no tipo de dado
2. **Modo Offline** - `get_stale_api_data()` retorna cache expirado quando offline
3. **Limpeza Automática** - `cleanup_expired_cache()` remove seletivamente
4. **Índice de Performance** - `idx_cache_updated` acelera queries por data
5. **Comandos Expostos** - Frontend pode limpar cache via `cleanup_cache()` e `clear_all_cache()`

### Performance: SQLite vs localStorage

| Aspecto              | SQLite                | localStorage      |
|----------------------|-----------------------|-------------------|
| **Read (cache hit)** | ~1-2ms                | ~0.1ms            |
| **Write**            | ~2-5ms                | ~0.5ms            |
| **Busca complexa**   | ✅ SQL queries         | ❌ Parse JSON      |
| **Tamanho limite**   | ✅ Sem limite          | ⚠️ 5-10MB         |
| **Estrutura**        | ✅ Tabelas relacionais | ❌ Key-value flat  |
| **Concorrência**     | ✅ Locks/WAL           | ⚠️ Pode corromper |

**Conclusão**: A diferença de 1-2ms é **insignificante** comparada aos benefícios (estrutura SQL, sem limite de tamanho,
concorrência segura).

### ⚠️ Mitos sobre "SQLite é Lento"

SQLite **não é lento** para cache. Benchmarks reais:

- **100 reads sequenciais**: ~50ms (0.5ms cada)
- **100 writes batch**: ~80ms com transactions
- **1000 entries scan**: ~15ms com índice

A "lentidão" vem de:

1. ❌ Usar sem índices (você tem!)
2. ❌ Não usar transactions em batch writes
3. ❌ Abrir/fechar conexão toda hora (você reusa!)

### Recomendação

✅ **Mantenha o SQLite** pelos motivos:

1. Já está implementado e funcionando
2. Permite queries complexas (ex: "quais caches expiram nos próximos 3 dias?")
3. Estrutura escalável (adicionar colunas sem quebrar)
4. Suporte nativo no Tauri
5. Performance suficiente (1-2ms é imperceptível)

❌ **Não mude para localStorage** porque:

- Perde a estrutura (volta para flat key-value)
- Limite de 5-10MB (pode estourar com muitas imagens)
- Não tem queries SQL
- Menos seguro em concorrência

---

## Cache em Sessão (Implementação Atual)

### ✅ Vantagens

- **Sempre dados frescos ao iniciar**: Cada vez que o app abre, faz fetch online garantindo conteúdo atualizado
- **Sem gestão de limpeza**: Não precisa se preocupar com cache desatualizado entre reinícios
- **Menos I/O no disco**: Tudo fica em memória (RAM), acesso mais rápido
- **Privacidade**: Dados não persistem após fechar o app
- **Menor complexidade**: Não precisa de migração de schema se o formato dos dados mudar

### ❌ Desvantagens

- **Toda vez busca online**: Primeiro load sempre faz request (mesmo que o cache de 10min ainda estivesse válido)
- **Mais lento em modo offline inicial**: Se abrir offline, não tem nada em cache até conectar

---

## Cache Persistente (localStorage / Tauri Store)

### ✅ Vantagens

- **Startup instantâneo**: Mostra dados imediatamente (mesmo que levemente desatualizados)
- **Funciona offline desde o início**: Não precisa ter conectado antes na sessão
- **Menos requests**: Respeita TTL mesmo entre reinícios (economiza API quota e banda)

### ❌ Desvantagens

- **Dados podem ficar desatualizados**: Se TTL for muito longo ou usuário ficar offline por dias
- **Precisa gerenciar limpeza automática**:
  - Cache antigo ocupa espaço
  - Mudanças no formato dos dados podem quebrar (precisa versionar)
- **I/O no disco**: Leitura/escrita mais lenta que memória
- **Segurança**: Dados ficam visíveis no sistema de arquivos (menos crítico aqui, mas é um ponto)

---

## Como Implementar Limpeza Automática de Cache Persistente

### Opção A: TTL com Timestamp (Recomendado)

```typescript
// Ao salvar
const cacheData = {
  data: games,
  fetchedAt: Date.now(),
  version: 1 // Para migração de schema
};
localStorage.setItem('trending_cache', JSON.stringify(cacheData));

// Ao ler
const cached = localStorage.getItem('trending_cache');
if (cached) {
  const {data, fetchedAt, version} = JSON.parse(cached);

  // Valida versão
  if (version !== 1) {
    localStorage.removeItem('trending_cache');
    return null;
  }

  // Valida TTL
  const now = Date.now();
  if (now - fetchedAt < TRENDING_TTL_MS) {
    return data; // Cache válido
  }

  // Expirou: Remove automaticamente
  localStorage.removeItem('trending_cache');
}
```

### Opção B: Limpeza Periódica Global

```typescript
// No boot do app (App.tsx useEffect)
function cleanupExpiredCache() {
  const keys = [
    'trending_cache',
    'upcoming_cache',
    'giveaways_cache'
  ];

  keys.forEach(key => {
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        const {fetchedAt} = JSON.parse(cached);
        const age = Date.now() - fetchedAt;

        // Remove se mais de 7 dias
        if (age > 7 * 24 * 60 * 60 * 1000) {
          localStorage.removeItem(key);
        }
      } catch {
        // Cache corrompido: remove
        localStorage.removeItem(key);
      }
    }
  });
}
```

### Opção C: Tauri Store com Expire (Mais Robusto)

```rust
// No backend Tauri
pub struct CachedData<T> {
  data: T,
  expires_at: i64, // Unix timestamp
}

// Ao ler
let cached: CachedData<Vec<Game> > = store.get("trending") ?;
let now = SystemTime::now().duration_since(UNIX_EPOCH) ?.as_secs();

if now < cached.expires_at {
Ok(Some(cached.data))
} else {
store.delete("trending") ?; // Auto-remove expirado
Ok(None)
}
```

---

## Recomendação para Este Projeto

**Manter cache em sessão** pelos seguintes motivos:

1. Trending/Giveaways mudam frequentemente (diariamente)
2. O tempo de boot já está aceitável (22s)
3. Usuário provavelmente fecha/abre o app algumas vezes por dia (não fica semanas offline)
4. Menos complexidade = menos bugs

**Se quiser persistente**, implementar apenas para:

- **Profile do usuário** (raramente muda)
- **Lista de jogos da biblioteca** (já está no SQLite)
- **Wishlist** (já está no SQLite)

---

# IntersectionObserver para CachedImage

## O Problema Atual

Quando você abre a página Libraries com 100+ jogos, o componente `CachedImage` executa `check_local_cover` para **todos
** os jogos imediatamente, mesmo os que estão fora da tela (scroll).

```typescript
// Problema: Chama IPC para imagens invisíveis
useEffect(() => {
  invoke('check_local_cover', {gameId}).then(...)
}, [gameId]);
```

## A Solução: IntersectionObserver

**IntersectionObserver** é uma API do browser que detecta quando um elemento HTML entra/sai do **viewport** (área
visível da tela).

### Como Funciona

```typescript
// 1. Cria o observer
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Elemento entrou na tela!
      console.log('Visível:', entry.target);
    }
  });
}, {
  rootMargin: '200px' // Começa a carregar 200px ANTES de entrar
});

// 2. Observa um elemento
const imgElement = document.querySelector('#game-card-123');
observer.observe(imgElement);
```

### Implementação no CachedImage

```typescript
export function CachedImage({src, gameId, alt, className}: Props) {
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // 1. Detecta visibilidade
  useEffect(() => {
    const element = imgRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Para de observar (já carregou)
        }
      },
      {rootMargin: '300px'} // Carrega antes de aparecer
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  // 2. Só busca quando visível
  useEffect(() => {
    if (!isVisible || !src || !gameId) return;

    // Agora sim faz o invoke
    resolveImage();
  }, [isVisible, src, gameId]);

  return (
    <div ref = {imgRef}
  className = {className} >
    {
      displaySrc ? (
        <img src = {displaySrc} alt = {alt} loading = "lazy" / >
) :
  (
    <Skeleton / > // Placeholder enquanto não carrega
  )
}
  </div>
)
  ;
}
```

### Benefícios

- **100 jogos**: Carrega apenas os ~12 visíveis + 4 próximos = **16 chamadas** em vez de 100
- **Scroll suave**: Carrega antes de aparecer (rootMargin)
- **Memória**: Não acumula todos os dados de uma vez

### Trade-offs

- **Complexidade**: Mais código para gerenciar
- **Scroll rápido**: Se usuário scrollar muito rápido, pode ver skeletons por 100-200ms
- **SSR/Testes**: IntersectionObserver não existe em Node.js (precisa de polyfill)

---

## Comparação: Cache em Sessão + IntersectionObserver

| Cenário                   | Sem IO             | Com IO           | Diferença        |
|---------------------------|--------------------|------------------|------------------|
| **Startup (Home)**        | ~5 imagens         | ~5 imagens       | ✅ Igual          |
| **Libraries (100 jogos)** | 100 chamadas IPC   | 12-16 chamadas   | ✅ **84% menos**  |
| **Scroll em Libraries**   | Nada (já carregou) | 4-6 por "página" | ⚠️ Pequeno delay |

---

## Próximos Passos (Se Quiser Implementar)

### 1. IntersectionObserver no CachedImage

**Prioridade: ALTA** (maior ganho imediato)

- Implementar lazy load com rootMargin de 300px
- Testar com 100+ jogos em Libraries
- Medir diferença de performance

### 2. Cache Persistente (Opcional)

**Prioridade: BAIXA** (benefício marginal)

- Só para Profile do usuário
- TTL de 24h com limpeza automática
- Versionar o schema

### 3. Outros Ganhos Possíveis

- **Virtualização de listas** (react-window): Renderiza apenas ~20 itens visíveis
- **Paginação**: 50 jogos por vez em Libraries
- **Web Workers**: Processar filtros pesados fora da thread principal

---

## Conclusão

**Para seu projeto:**

- ✅ Manter cache em sessão (já implementado)
- ✅ Implementar IntersectionObserver no CachedImage (ganho real)
- ❌ Não precisa de cache persistente (complexidade > benefício)

**Razão:** O maior gargalo é o número de IPC calls em Libraries, não o cache de dados externos.
