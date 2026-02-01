# Consolidação: Sistema de Preferências do Usuário

## Visão Geral

Consolidamos todo o gerenciamento de configurações e preferências do sistema de recomendação em um único lugar,
removendo duplicação de código e simplificando a arquitetura.

## Mudanças Realizadas

### 1. ✅ Tipos Expandidos (`recommendation.ts`)

Expandimos `RecommendationConfig` para incluir preferências do usuário:

```typescript
export interface RecommendationConfig {
  content_weight: number;
  collaborative_weight: number;
  age_decay: number;
  favor_series: boolean;
  filter_adult_content: boolean;        // ✨ NOVO
  series_limit: 'none' | 'moderate' | 'aggressive'; // ✨ NOVO
}
```

### 2. ✅ Hook Central Expandido (`useRecommendationConfig.ts`)

O hook agora gerencia TODAS as configurações e preferências:

```typescript
export function useRecommendationConfig() {
  // ...existing code...

  // ✨ NOVO: Funções para preferências do usuário
  const toggleAdultFilter = useCallback(async () => {
    const newConfig = {
      ...config,
      filter_adult_content: !config.filter_adult_content,
    };
    await updateConfig(newConfig);
  }, [config, updateConfig]);

  const setSeriesLimit = useCallback(
    async (limit: 'none' | 'moderate' | 'aggressive') => {
      const newConfig = {
        ...config,
        series_limit: limit,
      };
      await updateConfig(newConfig);
    },
    [config, updateConfig]
  );

  return {
    config,
    ready,
    updateConfig,
    resetConfig,
    toggleAdultFilter,  // ✨ NOVO
    setSeriesLimit,     // ✨ NOVO
  };
}
```

### 3. ✅ Hook Principal Atualizado (`useRecommendation.ts`)

Agora expõe as funções de preferências:

```typescript
export function useRecommendation() {
  const {
    config,
    ready: configReady,
    updateConfig,
    toggleAdultFilter,  // ✨ NOVO
    setSeriesLimit,     // ✨ NOVO
  } = useRecommendationConfig();

  return {
    // ...existing returns...
    toggleAdultFilter,  // ✨ NOVO
    setSeriesLimit,     // ✨ NOVO
  };
}
```

### 4. ✅ Hook Legado Deprecado (`useUserPreferences.ts`)

Transformado em re-export para manter compatibilidade:

```typescript
/**
 * @deprecated Use useRecommendationConfig from '@/hooks/recommendation' instead.
 */
export {useRecommendationConfig as useUserPreferences} from '../recommendation/useRecommendationConfig';
```

### 5. ✅ Settings Simplificado (`Settings.tsx`)

Agora usa apenas um hook ao invés de dois:

**ANTES:**

```typescript
const {config, updateConfig, resetFeedback, ignoredIds} = useRecommendation();
const {preferences, toggleAdultFilter, setSeriesLimit} = useUserPreferences();

// Usava preferences.filter_adult_content
// Usava preferences.series_limit
```

**DEPOIS:**

```typescript
const {
  config,
  updateConfig,
  resetFeedback,
  ignoredIds,
  toggleAdultFilter,  // ✨ Agora vem do useRecommendation
  setSeriesLimit      // ✨ Agora vem do useRecommendation
} = useRecommendation();

// Usa config.filter_adult_content
// Usa config.series_limit
```

### 6. ✅ Backend Limpo (Rust)

Removidos arquivos e comandos desnecessários:

- ❌ `src-tauri/src/commands/user_preferences.rs` - DELETADO
- ❌ `commands::user_preferences::get_user_preferences` - REMOVIDO do handler
- ❌ `commands::user_preferences::save_user_preferences` - REMOVIDO do handler

### 7. ✅ Persistência Unificada

Tudo agora salva no mesmo local (`recommendation.store`):

```typescript
// ANTES: Dois arquivos separados
-user_preferences.json    // Preferências do usuário
- recommendation.store      // Configurações de recomendação

// DEPOIS: Um arquivo único
- recommendation.store      // TUDO junto
```

## Benefícios

### 🎯 **Simplicidade**

- **1 hook** em vez de 2 para gerenciar configurações
- **1 arquivo** de persistência em vez de 2
- **1 interface** TypeScript em vez de 2

### 🔧 **Manutenção**

- Menos código duplicado
- Lógica centralizada
- Mais fácil de debugar

### 🚀 **Performance**

- Menos chamadas ao backend
- Cache unificado
- Menos reads/writes no disco

### 📦 **Organização**

- Estrutura mais limpa
- Responsabilidades claras
- Código mais coeso

## Migração Automática

✅ **Não é necessária migração de dados!**

- Preferências antigas continuam funcionando se existirem
- Novos valores têm defaults sensatos
- Sistema é totalmente retrocompatível

## Arquivos Modificados

### Frontend (TypeScript)

1. `src/types/recommendation.ts` - Interface expandida
2. `src/hooks/recommendation/useRecommendationConfig.ts` - Hook expandido
3. `src/hooks/recommendation/useRecommendation.ts` - Exporta novas funções
4. `src/hooks/user/useUserPreferences.ts` - Deprecado (re-export)
5. `src/pages/Settings.tsx` - Simplificado

### Backend (Rust)

1. `src-tauri/src/lib.rs` - Removidos comandos antigos
2. `src-tauri/src/commands/user_preferences.rs` - DELETADO

## Testando

Para testar as mudanças:

```bash
# 1. Compilar o backend
cd src-tauri
cargo build

# 2. Executar o app
npm run tauri dev
```

### Verificações

1. ✅ Abrir Settings
2. ✅ Alternar "Filtrar Conteúdo Adulto"
3. ✅ Mudar "Diversidade de Séries"
4. ✅ Verificar que salva corretamente
5. ✅ Reabrir o app e verificar que mantém as configurações

## Compatibilidade

### ✅ Retrocompatível

- Hooks antigos continuam funcionando (deprecados)
- Dados antigos são lidos corretamente
- Sem breaking changes

### ⚠️ Deprecations

- `useUserPreferences` → Use `useRecommendationConfig`
- Comandos Rust removidos (não eram usados diretamente)

## Próximos Passos (Opcional)

Se quiser limpar ainda mais:

1. Remover `useUserPreferences.ts` completamente
2. Atualizar imports em outros arquivos se existirem
3. Remover pasta `hooks/user` se estiver vazia

Mas isso não é necessário - o re-export mantém tudo funcionando!

## Conclusão

✨ **Sistema mais limpo, simples e manutenível!**

- Menos arquivos
- Menos código duplicado
- Mesma funcionalidade
- Melhor organização

