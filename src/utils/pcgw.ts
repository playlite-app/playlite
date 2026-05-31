// utils/pcgw.ts
//
// Funções utilitárias para formatação e normalização de dados provenientes
// do PCGamingWiki — usadas em windows/GameDetail/ e em utils de teste.

import { LangRow } from '@/types/game_detail';

/**
 * Converte variáveis de path no formato `{{p|variavel}}` do wikitext do
 * PCGamingWiki para representações legíveis pelo usuário.
 *
 * Exemplos:
 *   `{{p|localappdata}}\Game\`  →  `%LOCALAPPDATA%\Game\`
 *   `{{p|xdgdatahome}}/Game/`  →  `$XDG_DATA_HOME/Game/`
 *   `{{p|osxhome}}/Library/`   →  `$HOME/Library/`
 *
 * Variáveis não mapeadas são convertidas para `<nome>` para indicar que
 * precisam de resolução manual.
 */
export function expandPathVars(raw: string): string {
  return (
    raw
      // Windows — AppData
      .replace(/\{\{p\|localappdata}}/gi, '%LOCALAPPDATA%')
      .replace(/\{\{p\|appdata}}/gi, '%APPDATA%')
      .replace(/\{\{p\|programdata}}/gi, '%PROGRAMDATA%')
      .replace(/\{\{p\|public}}/gi, '%PUBLIC%')
      // Windows — User profile (ordem importa: Documents antes de userprofile)
      .replace(/\{\{p\|userprofile\\documents}}/gi, '%USERPROFILE%\\Documents')
      .replace(/\{\{p\|userprofile\/documents}}/gi, '%USERPROFILE%/Documents')
      .replace(/\{\{p\|userprofile}}/gi, '%USERPROFILE%')
      // Genérico
      .replace(/\{\{p\|game}}/gi, '<pasta do jogo>')
      .replace(/\{\{p\|steam}}/gi, '<pasta do Steam>')
      .replace(/\{\{p\|uid}}/gi, '<Steam User ID>')
      // Linux — XDG
      .replace(/\{\{p\|xdgdatahome}}/gi, '$XDG_DATA_HOME')
      .replace(/\{\{p\|xdgconfighome}}/gi, '$XDG_CONFIG_HOME')
      .replace(/\{\{p\|editorconfig}}/gi, '$XDG_CONFIG_HOME')
      .replace(/\{\{p\|xdgcachehome}}/gi, '$XDG_CACHE_HOME')
      // macOS / Unix
      .replace(/\{\{p\|osxhome}}/gi, '$HOME')
      .replace(/\{\{p\|home}}/gi, '$HOME')
      // Fallback: qualquer {{p|...}} restante não mapeado
      .replace(/\{\{p\|([^}]+)}}/gi, '<$1>')
  );
}

/**
 * Remove o prefixo `Engine:` inserido pelo PCGamingWiki em campos de engine.
 *
 * Exemplo: `"Engine:GoldSrc"` → `"GoldSrc"`
 */
export function formatEngine(value: string | null): string | null {
  if (!value) return null;

  return value.replace(/^Engine:/i, '').trim();
}

/**
 * Normaliza uma lista separada por vírgula garantindo espaço após cada vírgula.
 * Usado em `availableOn`, `upscaling` e `frameGen`, que chegam do banco sem
 * espaço: `"DLSS 3.1,FSR 2.1"` → `"DLSS 3.1, FSR 2.1"`.
 */
export function formatList(value: string | null): string | null {
  if (!value) return null;

  return value
    .split(',')
    .map(s => s.trim())
    .join(', ');
}

/**
 * Prefixa o valor de OS com o nome da família quando necessário.
 *
 * Regras:
 * - Se o valor já contém o nome da família, retorna sem alteração.
 * - `"OS X"`: também verifica ocorrência de `"mac"`.
 * - `"Linux"`: preserva o valor sem prefixo, pois os requisitos costumam
 *   listar a distro diretamente (ex: `"Ubuntu 20.04"`).
 * - Demais famílias (ex: `"Windows"`): prefixa → `"Windows XP"`.
 *
 * Exemplos:
 *   `formatOs("Windows", "XP")`       → `"Windows XP"`
 *   `formatOs("Windows", "Windows 11")` → `"Windows 11"` (sem duplicar)
 *   `formatOs("OS X", "10.6.3")`      → `"OS X 10.6.3"`
 *   `formatOs("Linux", "Ubuntu 22.04")` → `"Ubuntu 22.04"`
 */
export function formatOs(
  osFamily: string,
  value: string | null
): string | null {
  if (!value) return null;

  const lower = value.toLowerCase();
  const family = osFamily.toLowerCase();

  if (lower.includes(family)) return value;

  if (family === 'os x' && (lower.includes('os x') || lower.includes('mac'))) {
    return value;
  }

  // Linux: distros conhecidas não precisam do prefixo "Linux"
  if (family === 'linux') return value;

  return `${osFamily} ${value}`;
}

/**
 * Combina dois campos de CPU ou GPU opcionais em uma única string.
 * Usado quando o PCGamingWiki lista alternativas Intel/AMD separadas.
 *
 * Exemplos:
 *   `combineParts("Intel Core i5", "AMD Ryzen 5")` → `"Intel Core i5 / AMD Ryzen 5"`
 *   `combineParts("Intel Core i5", null)`           → `"Intel Core i5"`
 *   `combineParts(null, null)`                      → `null`
 */
export function combineParts(
  primary: string | null,
  secondary: string | null
): string | null {
  if (primary && secondary) return `${primary} / ${secondary}`;

  return primary ?? secondary ?? null;
}

/**
 * Constrói a tabela de idiomas a partir das três listas do backend.
 * Faz a união de todos os idiomas encontrados em qualquer das três listas
 * e retorna uma linha por idioma indicando onde ele está disponível.
 *
 * Exemplo de entrada:
 *   iface: ["English", "Portuguese"]
 *   audio: ["English"]
 *   subs:  ["English", "Portuguese", "French"]
 */
export function buildLanguageRows(
  iface: string[] | null,
  audio: string[] | null,
  subs: string[] | null
): LangRow[] {
  const ifaceList = iface ?? [];
  const audioList = audio ?? [];
  const subsList = subs ?? [];

  const allLangs = Array.from(
    new Set([...ifaceList, ...audioList, ...subsList])
  ).sort();

  return allLangs.map(lang => ({
    lang,
    interface: ifaceList.includes(lang),
    audio: audioList.includes(lang),
    subtitles: subsList.includes(lang),
  }));
}
