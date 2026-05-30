//! Parser de wikitext do PCGamingWiki para dados não disponíveis via Cargo API.
//!
//! Extrai dois tipos de dados da wikitext bruta da página via `action=parse`:
//!
//! - **System requirements** — blocos `{{System requirements}}`, um por OS.
//!   Suporta parâmetros padrão (`minCPU`, `recGPU`, etc.), campos duplos
//!   (`minCPU2`, `minGPU2` para alternativas AMD/Intel) e tiers extras
//!   (`alt1Title`/`alt1CPU`/etc., comuns em jogos AAA modernos como Witcher 3).
//!
//! - **Game data paths** — blocos `{{Game data/config|OS|path}}` e
//!   `{{Game data/saves|OS|path}}`. Os caminhos preservam a sintaxe
//!   `{{p|variavel}}` para que o frontend possa expandir conforme o OS do usuário.
//!
//! # Estratégia de parsing
//!
//! O wikitext não é parseado como árvore — isso seria frágil e lento.
//! Em vez disso, identificamos blocos de template por nome (`{{System requirements`),
//! extraímos o conteúdo até o `}}` de fechamento correspondente (respeitando
//! aninhamento), e dentro do bloco extraímos parâmetros com regex simples
//! `|chave = valor`.
//!
//! # Normalização de valores
//!
//! Todos os valores booleanos da PCGW (`true`, `false`, `unknown`, `n/a`,
//! `hackable`, `limited`, `always on`) são preservados como `Option<String>`
//! para que o frontend decida a semântica de exibição.
//!
//! # Integração com fetch.rs
//!
//! Este módulo é chamado em paralelo com as queries Cargo existentes.
//! A busca do wikitext usa `action=parse&prop=wikitext` e requer uma chamada
//! HTTP adicional — deve respeitar o mesmo rate limiting de 250ms.

use crate::errors::AppError;
use once_cell::sync::Lazy;
use regex::Regex;
use serde::{Deserialize, Serialize};

// ============================================================
// Regex compiladas uma única vez
// ============================================================

/// Captura `|chave = valor` dentro de um bloco de template.
/// Grupos: 1 = chave (sem espaços), 2 = valor (sem espaços nas bordas).
static RE_PARAM: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"(?m)^\s*\|([^=\n]+?)\s*=\s*([^\n]*?)\s*$").unwrap());

/// Captura `{{Game data/config|OS|path}}` ou `{{Game data/saves|OS|path}}`.
/// Grupos: 1 = tipo ("config" ou "saves"), 2 = OS, 3 = path bruto.
static RE_GAME_DATA_ROW: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"\{\{Game data/(config|saves)\|([^|]+)\|([^}]+)}}").unwrap());

// ============================================================
// Tipos públicos
// ============================================================

/// Requisitos de sistema para um único OS/tier.
///
/// Campos `cpu2` e `gpu2` capturam alternativas AMD/Intel quando presentes.
/// Tiers extras do Witcher 3 (`alt1`, `alt2`) são representados como entradas
/// separadas no vetor retornado por [`parse_system_requirements`].
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SystemRequirements {
    /// OS alvo: "Windows", "Linux", "Mac OS", "DOS", etc.
    pub os_family: String,

    /// Rótulo do tier — `None` para requisitos padrão (min/rec).
    /// Exemplos: `Some("High")`, `Some("Ultra (1440p)")`.
    pub tier_title: Option<String>,

    /// Alvo de desempenho descrito pela PCGW, ex: "1080p, DX11".
    pub target: Option<String>,

    // Mínimo
    pub min_os: Option<String>,
    pub min_cpu: Option<String>,
    pub min_cpu2: Option<String>,
    pub min_ram: Option<String>,
    pub min_gpu: Option<String>,
    pub min_gpu2: Option<String>,
    pub min_vram: Option<String>,
    pub min_dx: Option<String>,
    pub min_storage: Option<String>,

    // Recomendado
    pub rec_os: Option<String>,
    pub rec_cpu: Option<String>,
    pub rec_cpu2: Option<String>,
    pub rec_ram: Option<String>,
    pub rec_gpu: Option<String>,
    pub rec_gpu2: Option<String>,
    pub rec_vram: Option<String>,
    pub rec_dx: Option<String>,
    pub rec_storage: Option<String>,
}

/// Caminho de dado do jogo (save ou config) para um OS específico.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameDataPath {
    /// Tipo do dado: `"config"` ou `"saves"`.
    pub kind: String,

    /// OS alvo: `"Windows"`, `"Linux"`, `"OS X"`, etc.
    pub os: String,

    /// Caminho bruto preservando `{{p|variavel}}`.
    /// Ex: `"{{p|userprofile\\Documents}}\\Reus\\"`.
    pub raw_path: String,

    /// Caminho com variáveis expandidas para o OS atual (calculado pelo frontend).
    /// `None` até que o frontend expanda `{{p|...}}`.
    pub expanded_path: Option<String>,
}

/// Resultado completo do scraping de uma página do PCGamingWiki.
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct PcgwScrapedData {
    /// Todos os blocos de requisitos encontrados (um por OS + tiers extras).
    pub system_requirements: Vec<SystemRequirements>,

    /// Todos os caminhos de save e config encontrados.
    pub game_data_paths: Vec<GameDataPath>,
}

// ============================================================
// Busca do wikitext via MediaWiki API
// ============================================================

/// Busca o wikitext bruto de uma página do PCGamingWiki pelo `page_id`.
///
/// Usa `action=parse&prop=wikitext` — retorna o wikitext completo da página.
/// Deve ser chamado após a query `Infobox_game` que resolve o `page_id`.
///
/// # Rate limiting
/// Adiciona o delay padrão de 250ms antes da requisição.
pub async fn fetch_wikitext(client: &reqwest::Client, page_id: &str) -> Result<String, AppError> {
    use std::time::Duration;
    use tokio::time::sleep;

    // Mesmo delay das queries Cargo para respeitar rate limit de 30 req/min
    sleep(Duration::from_millis(250)).await;

    let response = client
        .get("https://www.pcgamingwiki.com/w/api.php")
        .query(&[
            ("action", "parse"),
            ("pageid", page_id),
            ("prop", "wikitext"),
            ("format", "json"),
        ])
        .send()
        .await
        .map_err(|e| AppError::NetworkError(e.to_string()))?;

    if !response.status().is_success() {
        return Err(AppError::NetworkError(format!(
            "PCGW wikitext API retornou HTTP {}",
            response.status()
        )));
    }

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| AppError::ParseError(e.to_string()))?;

    let wikitext = json
        .pointer("/parse/wikitext/*")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::ParseError("Campo wikitext ausente na resposta".to_string()))?
        .to_string();

    Ok(wikitext)
}

// ============================================================
// Extração de blocos de template
// ============================================================

/// Encontra todas as ocorrências de `{{NomeDoTemplate` no wikitext e retorna
/// o conteúdo interno de cada bloco (sem as chaves externas), respeitando
/// aninhamento de templates.
///
/// Exemplo: para `{{System requirements\n|OSfamily = Windows\n}}` retorna
/// `"System requirements\n|OSfamily = Windows\n"`.
fn extract_template_blocks<'a>(wikitext: &'a str, template_name: &str) -> Vec<&'a str> {
    let marker = format!("{{{{{}", template_name);
    let mut blocks = Vec::new();
    let mut search_from = 0;

    while let Some(start) = wikitext[search_from..].find(&marker) {
        let abs_start = search_from + start;

        // Encontra o }} de fechamento respeitando aninhamento
        let content_start = abs_start + 2; // após {{
        let mut depth = 1usize;
        let mut pos = content_start;
        let bytes = wikitext.as_bytes();

        while pos < bytes.len().saturating_sub(1) && depth > 0 {
            if bytes[pos] == b'{' && bytes[pos + 1] == b'{' {
                depth += 1;
                pos += 2;
            } else if bytes[pos] == b'}' && bytes[pos + 1] == b'}' {
                depth -= 1;
                if depth == 0 {
                    // Inclui o conteúdo sem as {{ e }}
                    blocks.push(&wikitext[content_start..pos]);
                    search_from = pos + 2;
                    break;
                }
                pos += 2;
            } else {
                pos += 1;
            }
        }

        if depth > 0 {
            // Bloco sem fechamento — para de buscar
            break;
        }
    }

    blocks
}

// ============================================================
// Parser de parâmetros
// ============================================================

/// Extrai todos os parâmetros `|chave = valor` de um bloco de template.
/// Retorna um mapa de chave normalizada (lowercase, trim) → valor (trim).
fn parse_params(block: &str) -> std::collections::HashMap<String, String> {
    let mut map = std::collections::HashMap::new();

    for cap in RE_PARAM.captures_iter(block) {
        let key = cap[1].trim().to_lowercase();
        let value = cap[2].trim().to_string();

        // Ignora linhas de notas e refs — só queremos os valores primários
        if key.ends_with(" notes") || key == "ref" {
            continue;
        }

        // Ignora valores vazios
        if !value.is_empty() {
            map.insert(key, value);
        }
    }

    map
}

/// Retorna `Some(value)` se a chave existe e o valor não é vazio.
fn get_param(params: &std::collections::HashMap<String, String>, key: &str) -> Option<String> {
    params.get(key).cloned()
}

/// Combina dois campos opcionais em uma string "valor1 / valor2" quando ambos
/// existem, ou retorna apenas o primeiro. Usado para `minCPU` + `minCPU2`.
fn combine_fields(primary: Option<String>, secondary: Option<String>) -> Option<String> {
    match (primary, secondary) {
        (Some(a), Some(b)) if !b.is_empty() => Some(format!("{} / {}", a, b)),
        (Some(a), _) => Some(a),
        (None, Some(b)) => Some(b),
        (None, None) => None,
    }
}

// ============================================================
// Parser de System Requirements
// ============================================================

/// Extrai todos os blocos `{{System requirements}}` do wikitext.
///
/// Retorna um vetor com uma entrada por bloco encontrado. Cada bloco
/// representa um OS (`OSfamily`) e opcionalmente um tier extra (`alt1`, `alt2`).
///
/// # Tiers extras (Witcher 3 style)
///
/// Quando `alt1Title` está presente, o bloco padrão (min/rec) é retornado como
/// primeiro elemento e os tiers extras como elementos adicionais. Isso permite
/// ao frontend exibir "Mínimo / Recomendado / High / Ultra" separadamente.
pub fn parse_system_requirements(wikitext: &str) -> Vec<SystemRequirements> {
    let blocks = extract_template_blocks(wikitext, "System requirements");
    let mut all_reqs = Vec::new();

    for block in blocks {
        let params = parse_params(block);

        let os_family = get_param(&params, "osfamily").unwrap_or_else(|| "Unknown".to_string());

        // --- Requisitos padrão (min / rec) ---
        let standard = SystemRequirements {
            os_family: os_family.clone(),
            tier_title: None,
            target: get_param(&params, "mintgt"),
            min_os: get_param(&params, "minos"),
            min_cpu: combine_fields(get_param(&params, "mincpu"), get_param(&params, "mincpu2")),
            min_cpu2: None, // já combinado acima
            min_ram: get_param(&params, "minram"),
            min_gpu: combine_fields(get_param(&params, "mingpu"), get_param(&params, "mingpu2")),
            min_gpu2: None,
            min_vram: get_param(&params, "minvram"),
            min_dx: get_param(&params, "mindx"),
            min_storage: get_param(&params, "minhd"),
            rec_os: get_param(&params, "recos"),
            rec_cpu: combine_fields(get_param(&params, "reccpu"), get_param(&params, "reccpu2")),
            rec_cpu2: None,
            rec_ram: get_param(&params, "recram"),
            rec_gpu: combine_fields(get_param(&params, "recgpu"), get_param(&params, "recgpu2")),
            rec_gpu2: None,
            rec_vram: get_param(&params, "recvram"),
            rec_dx: get_param(&params, "recdx"),
            rec_storage: get_param(&params, "rechd"),
        };
        all_reqs.push(standard);

        // --- Tiers extras: alt1, alt2, alt3 (Witcher 3 style) ---
        for n in 1..=3u8 {
            let prefix = format!("alt{}", n);
            let title_key = format!("{}title", prefix);

            // Tier só existe se tiver título
            let tier_title = match get_param(&params, &title_key) {
                Some(t) => t,
                None => break,
            };

            let alt = SystemRequirements {
                os_family: os_family.clone(),
                tier_title: Some(tier_title),
                target: get_param(&params, &format!("{}tgt", prefix)),
                min_os: get_param(&params, &format!("{}os", prefix)),
                min_cpu: combine_fields(
                    get_param(&params, &format!("{}cpu", prefix)),
                    get_param(&params, &format!("{}cpu2", prefix)),
                ),
                min_cpu2: None,
                min_ram: get_param(&params, &format!("{}ram", prefix)),
                min_gpu: combine_fields(
                    get_param(&params, &format!("{}gpu", prefix)),
                    get_param(&params, &format!("{}gpu2", prefix)),
                ),
                min_gpu2: None,
                min_vram: get_param(&params, &format!("{}vram", prefix)),
                min_dx: get_param(&params, &format!("{}dx", prefix)),
                min_storage: get_param(&params, &format!("{}hd", prefix)),
                // Tiers extras só têm mínimo — sem rec separado
                rec_os: None,
                rec_cpu: None,
                rec_cpu2: None,
                rec_ram: None,
                rec_gpu: None,
                rec_gpu2: None,
                rec_vram: None,
                rec_dx: None,
                rec_storage: None,
            };
            all_reqs.push(alt);
        }
    }

    all_reqs
}

// ============================================================
// Parser de Game Data Paths
// ============================================================

/// Extrai todos os caminhos de save e config do wikitext.
///
/// Cada `{{Game data/config|OS|path}}` e `{{Game data/saves|OS|path}}` gera
/// uma entrada. Os caminhos preservam a sintaxe `{{p|variavel}}` intacta.
///
/// OS normalizado: "Windows", "Linux", "OS X" (como aparece na PCGW).
pub fn parse_game_data_paths(wikitext: &str) -> Vec<GameDataPath> {
    let mut paths = Vec::new();

    for cap in RE_GAME_DATA_ROW.captures_iter(wikitext) {
        let kind = cap[1].trim().to_string(); // "config" ou "saves"
        let os = cap[2].trim().to_string(); // "Windows", "Linux", "OS X"
        let raw_path = cap[3].trim().to_string();

        if raw_path.is_empty() {
            continue;
        }

        paths.push(GameDataPath {
            kind,
            os,
            raw_path,
            expanded_path: None,
        });
    }

    paths
}

// ============================================================
// Ponto de entrada principal
// ============================================================

/// Faz o scraping completo de uma página do PCGamingWiki pelo `page_id`.
///
/// Orquestra:
/// 1. Busca do wikitext via `fetch_wikitext`
/// 2. Parse dos blocos `{{System requirements}}`
/// 3. Parse dos blocos `{{Game data/config}}` e `{{Game data/saves}}`
///
/// Retorna `PcgwScrapedData` com todos os dados extraídos.
/// Em caso de falha de rede, propaga `AppError::NetworkError` para que o
/// chamador trate graciosamente (offline-first: nenhum dado parcial é salvo).
pub async fn scrape_pcgw_page(
    client: &reqwest::Client,
    page_id: &str,
) -> Result<PcgwScrapedData, AppError> {
    let wikitext = fetch_wikitext(client, page_id).await?;

    let system_requirements = parse_system_requirements(&wikitext);
    let game_data_paths = parse_game_data_paths(&wikitext);

    Ok(PcgwScrapedData {
        system_requirements,
        game_data_paths,
    })
}

// ============================================================
// Persistência SQLite
// ============================================================

/// Cria as tabelas de requisitos e game data paths se não existirem.
///
/// Separadas da tabela `pcgw_data` porque têm cardinalidade N:1 com o jogo —
/// um jogo pode ter múltiplos blocos de requisitos (Windows + Linux + tiers).
pub fn initialize_scraper_tables(conn: &rusqlite::Connection) -> Result<(), String> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS pcgw_system_requirements (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            steam_app_id TEXT NOT NULL,
            os_family   TEXT NOT NULL,
            tier_title  TEXT,           -- NULL para requisitos padrão
            target      TEXT,           -- ex: '1080p, DX11'
            -- Mínimo
            min_os      TEXT,
            min_cpu     TEXT,
            min_ram     TEXT,
            min_gpu     TEXT,
            min_vram    TEXT,
            min_dx      TEXT,
            min_storage TEXT,
            -- Recomendado
            rec_os      TEXT,
            rec_cpu     TEXT,
            rec_ram     TEXT,
            rec_gpu     TEXT,
            rec_vram    TEXT,
            rec_dx      TEXT,
            rec_storage TEXT,
            fetched_at  TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_sysreq_app_id
            ON pcgw_system_requirements(steam_app_id);

        CREATE TABLE IF NOT EXISTS pcgw_game_data_paths (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            steam_app_id TEXT NOT NULL,
            kind         TEXT NOT NULL,  -- 'config' ou 'saves'
            os           TEXT NOT NULL,  -- 'Windows', 'Linux', 'OS X'
            raw_path     TEXT NOT NULL,  -- preserva {{p|variavel}}
            fetched_at   TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_gamedata_app_id
            ON pcgw_game_data_paths(steam_app_id);",
    )
    .map_err(|e| format!("Erro ao criar tabelas do scraper: {}", e))
}

/// Salva os dados raspados no banco, substituindo entradas anteriores do jogo.
///
/// Usa DELETE + INSERT em vez de REPLACE porque os dados têm múltiplas linhas
/// por jogo (não há PK natural além de `steam_app_id + os_family + tier_title`).
pub fn save_scraped_data(
    conn: &rusqlite::Connection,
    steam_app_id: &str,
    data: &PcgwScrapedData,
) -> Result<(), String> {
    use chrono::Utc;
    use rusqlite::params;

    let now = Utc::now().to_rfc3339();

    // Remove dados anteriores deste jogo antes de reinserir
    conn.execute(
        "DELETE FROM pcgw_system_requirements WHERE steam_app_id = ?1",
        params![steam_app_id],
    )
    .map_err(|e| format!("Erro ao limpar system_requirements: {}", e))?;

    conn.execute(
        "DELETE FROM pcgw_game_data_paths WHERE steam_app_id = ?1",
        params![steam_app_id],
    )
    .map_err(|e| format!("Erro ao limpar game_data_paths: {}", e))?;

    // Insere requisitos de sistema
    let mut sysreq_stmt = conn
        .prepare(
            "INSERT INTO pcgw_system_requirements (
                steam_app_id, os_family, tier_title, target,
                min_os, min_cpu, min_ram, min_gpu, min_vram, min_dx, min_storage,
                rec_os, rec_cpu, rec_ram, rec_gpu, rec_vram, rec_dx, rec_storage,
                fetched_at
            ) VALUES (
                ?1, ?2, ?3, ?4,
                ?5, ?6, ?7, ?8, ?9, ?10, ?11,
                ?12, ?13, ?14, ?15, ?16, ?17, ?18,
                ?19
            )",
        )
        .map_err(|e| format!("Erro ao preparar insert de system_requirements: {}", e))?;

    for req in &data.system_requirements {
        sysreq_stmt
            .execute(params![
                steam_app_id,
                req.os_family,
                req.tier_title,
                req.target,
                req.min_os,
                req.min_cpu,
                req.min_ram,
                req.min_gpu,
                req.min_vram,
                req.min_dx,
                req.min_storage,
                req.rec_os,
                req.rec_cpu,
                req.rec_ram,
                req.rec_gpu,
                req.rec_vram,
                req.rec_dx,
                req.rec_storage,
                now,
            ])
            .map_err(|e| format!("Erro ao inserir system_requirement: {}", e))?;
    }

    // Insere caminhos de game data
    let mut path_stmt = conn
        .prepare(
            "INSERT INTO pcgw_game_data_paths (steam_app_id, kind, os, raw_path, fetched_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
        )
        .map_err(|e| format!("Erro ao preparar insert de game_data_paths: {}", e))?;

    for path in &data.game_data_paths {
        path_stmt
            .execute(params![
                steam_app_id,
                path.kind,
                path.os,
                path.raw_path,
                now,
            ])
            .map_err(|e| format!("Erro ao inserir game_data_path: {}", e))?;
    }

    Ok(())
}

/// Retorna os requisitos de sistema salvos para um jogo.
/// Retorna vetor vazio se nunca foram buscados.
pub fn get_system_requirements(
    conn: &rusqlite::Connection,
    steam_app_id: &str,
) -> Vec<SystemRequirements> {
    let mut stmt = match conn.prepare(
        "SELECT os_family, tier_title, target,
                min_os, min_cpu, min_ram, min_gpu, min_vram, min_dx, min_storage,
                rec_os, rec_cpu, rec_ram, rec_gpu, rec_vram, rec_dx, rec_storage
         FROM pcgw_system_requirements
         WHERE steam_app_id = ?1
         ORDER BY id ASC",
    ) {
        Ok(s) => s,
        Err(_) => return Vec::new(),
    };

    let iter = stmt.query_map(rusqlite::params![steam_app_id], |row| {
        Ok(SystemRequirements {
            os_family: row.get(0)?,
            tier_title: row.get(1)?,
            target: row.get(2)?,
            min_os: row.get(3)?,
            min_cpu: row.get(4)?,
            min_cpu2: None,
            min_ram: row.get(5)?,
            min_gpu: row.get(6)?,
            min_gpu2: None,
            min_vram: row.get(7)?,
            min_dx: row.get(8)?,
            min_storage: row.get(9)?,
            rec_os: row.get(10)?,
            rec_cpu: row.get(11)?,
            rec_cpu2: None,
            rec_ram: row.get(12)?,
            rec_gpu: row.get(13)?,
            rec_gpu2: None,
            rec_vram: row.get(14)?,
            rec_dx: row.get(15)?,
            rec_storage: row.get(16)?,
        })
    });

    match iter {
        Ok(rows) => rows.filter_map(|r| r.ok()).collect(),
        Err(_) => Vec::new(),
    }
}

/// Retorna os caminhos de game data salvos para um jogo.
/// Retorna vetor vazio se nunca foram buscados.
pub fn get_game_data_paths(conn: &rusqlite::Connection, steam_app_id: &str) -> Vec<GameDataPath> {
    let mut stmt = match conn.prepare(
        "SELECT kind, os, raw_path
         FROM pcgw_game_data_paths
         WHERE steam_app_id = ?1
         ORDER BY id ASC",
    ) {
        Ok(s) => s,
        Err(_) => return Vec::new(),
    };

    let iter = stmt.query_map(rusqlite::params![steam_app_id], |row| {
        Ok(GameDataPath {
            kind: row.get(0)?,
            os: row.get(1)?,
            raw_path: row.get(2)?,
            expanded_path: None,
        })
    });

    match iter {
        Ok(rows) => rows.filter_map(|r| r.ok()).collect(),
        Err(_) => Vec::new(),
    }
}
