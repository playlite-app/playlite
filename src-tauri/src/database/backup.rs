//! Módulo de ‘backup’ e restauração de dados.
//!
//! Fornece funcionalidades para exportar e importar a base de dados completa
//! em formato JSON, incluindo biblioteca de jogos e lista de desejos.
//!
//! **Nota:**
//! Todas as operações usam transações ACID para garantir consistência dos dados.

use crate::database;
use crate::database::{current_schema_version, AppState};
use crate::errors::AppError;
use crate::models::{
    Game, GameDataPath, GameDetails, GameExtras, Platform, SystemRequirements, WishlistGame,
};
use chrono::Utc;
use rusqlite::params;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, State};

/// Type alias para dados de backup
type BackupDataTuple = (
    Vec<Game>,
    Vec<GameDetails>,
    Vec<WishlistGame>,
    Vec<GameExtras>,
    Vec<SystemRequirements>,
    Vec<GameDataPath>,
    u32,
);

/// Estrutura do arquivo de ‘backup’.
///
/// Contém metadados e todos os dados exportados da aplicação.
#[derive(serde::Serialize, serde::Deserialize)]
pub struct BackupData {
    pub version: u32, // schema == backup
    pub app_version: String,
    pub date: String,
    pub games: Vec<Game>,
    pub game_details: Vec<GameDetails>,
    pub wishlist_game: Vec<WishlistGame>,
    /// Dados técnicos obtidos do PCGamingWiki.
    /// Campo ausente em backups anteriores ao schema v4 — tratado como lista vazia.
    #[serde(default)]
    pub game_extras: Vec<GameExtras>,
    /// Requisitos de sistema por jogo/OS/tier.
    #[serde(default)]
    pub system_requirements: Vec<SystemRequirements>,
    /// Caminhos de save e config por jogo/OS.
    #[serde(default)]
    pub game_data_paths: Vec<GameDataPath>,
}

/// Função auxiliar interna para buscar dados do backup com transação ACID
///
/// Retorna tupla com (games, game_details, wishlist_game, schema_version)
fn fetch_backup_data(state: &State<AppState>) -> Result<BackupDataTuple, AppError> {
    let conn = state.games_db.lock()?;

    // Inicia transação READ para consistência
    conn.execute("BEGIN TRANSACTION", [])?;

    let games = fetch_games(&conn)?;
    let game_details = fetch_game_details(&conn)?;
    let wishlist_game = fetch_wishlist(&conn)?;
    let game_extras = fetch_game_extras(&conn)?;
    let system_requirements = fetch_system_requirements(&conn)?;
    let game_data_paths = fetch_game_data_paths(&conn)?;
    let schema_version = current_schema_version(&conn)?;

    conn.execute("COMMIT", [])?;

    Ok((
        games,
        game_details,
        wishlist_game,
        game_extras,
        system_requirements,
        game_data_paths,
        schema_version,
    ))
}

/// Exporta toda a base de dados para um arquivo JSON.
///
/// Cria um snapshot completo e consistente de todos os dados da aplicação,
/// incluindo jogos e wishlist, num único arquivo JSON formatado.
#[tauri::command]
pub async fn export_database(
    app: AppHandle,
    state: State<'_, AppState>,
    file_path: String,
) -> Result<(), AppError> {
    // Buscar dados com transação ACID
    let (
        games,
        game_details,
        wishlist_game,
        game_extras,
        system_requirements,
        game_data_paths,
        schema_version,
    ) = fetch_backup_data(&state)?;

    let backup = BackupData {
        version: schema_version,
        app_version: app.package_info().version.to_string(),
        date: chrono::Local::now().to_rfc3339(),
        games,
        game_details,
        wishlist_game,
        game_extras,
        system_requirements,
        game_data_paths,
    };

    let json = serde_json::to_string_pretty(&backup)?;
    fs::write(file_path, json)?;

    // Atualiza timestamp do último backup manual
    let cache_conn = state.cache_db.lock().map_err(|_| AppError::MutexError)?;
    let now = Utc::now().to_rfc3339();
    database::configs::set_config(&cache_conn, "last_backup_at", &now)?;

    Ok(())
}

pub fn backup_if_major_update(
    app: &AppHandle,
    previous_version: &str,
    current_version: &str,
) -> Result<Option<PathBuf>, AppError> {
    // Parse das versões
    let parse_version = |v: &str| -> (u32, u32, u32) {
        let parts: Vec<&str> = v.split('.').collect();
        let major = parts.first().and_then(|s| s.parse().ok()).unwrap_or(0);
        let minor = parts.get(1).and_then(|s| s.parse().ok()).unwrap_or(0);
        let patch = parts.get(2).and_then(|s| s.parse().ok()).unwrap_or(0);
        (major, minor, patch)
    };

    let (prev_major, _, _) = parse_version(previous_version);
    let (curr_major, _, _) = parse_version(current_version);

    // Se versão major mudou, faz backup
    if prev_major != curr_major && prev_major > 0 {
        tracing::info!(
            "Mudança de versão major detectada: v{} -> v{}",
            previous_version,
            current_version
        );
        let backup_path = backup_before_update(app, previous_version)?;
        Ok(Some(backup_path))
    } else {
        Ok(None)
    }
}

/// Cria backup automático antes de atualização de versão
///
/// Chamado automaticamente quando detecta mudança de versão major
pub fn backup_before_update(app: &AppHandle, previous_version: &str) -> Result<PathBuf, AppError> {
    tracing::info!("Criando backup automático antes da atualização...");

    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::IoError(format!("Falha ao obter app_data_dir: {}", e)))?;

    let backups_dir = app_data_dir.join("backups");
    std::fs::create_dir_all(&backups_dir)?;

    // Nome do backup com timestamp e versão anterior
    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
    let backup_filename = format!("auto_backup_v{}_{}.json", previous_version, timestamp);
    let backup_path = backups_dir.join(backup_filename);

    // Reutiliza a função auxiliar de fetch
    let state: tauri::State<AppState> = app.state();
    let (
        games,
        game_details,
        wishlist_game,
        game_extras,
        system_requirements,
        game_data_paths,
        schema_version,
    ) = fetch_backup_data(&state)?;

    let backup = BackupData {
        version: schema_version,
        app_version: previous_version.to_string(),
        date: chrono::Local::now().to_rfc3339(),
        games,
        game_details,
        wishlist_game,
        game_extras,
        system_requirements,
        game_data_paths,
    };

    let json = serde_json::to_string_pretty(&backup)?;
    fs::write(&backup_path, json)?;

    // Atualiza timestamp do último backup automático
    let cache_conn = state.cache_db.lock().map_err(|_| AppError::MutexError)?;
    let now = Utc::now().to_rfc3339();
    database::configs::set_config(&cache_conn, "last_auto_backup_at", &now)?;

    tracing::info!("Backup automático criado: {:?}", backup_path);
    Ok(backup_path)
}

/// Importa e restaura dados de um arquivo de 'backup'.
///
/// Lê um arquivo JSON de 'backup' restaura todos os dados no banco,
/// substituindo registros existentes (INSERT OR REPLACE).
///
/// **Nota:**
/// Esta operação pode sobrescrever dados existentes. Considere criar um 'backup' antes de importar.
#[tauri::command]
pub async fn import_database(
    _app: AppHandle,
    state: State<'_, AppState>,
    file_path: String,
) -> Result<String, AppError> {
    let content = fs::read_to_string(file_path)?;
    let backup: BackupData = serde_json::from_str(&content)
        .map_err(|_| AppError::ValidationError("Arquivo de backup inválido".to_string()))?;

    // Validação de versão
    let current_version = {
        let conn = state.games_db.lock()?;
        current_schema_version(&conn)?
    };

    if backup.version != current_version {
        return Err(AppError::ValidationError(format!(
            "Backup incompatível. Backup v{}, app espera v{}",
            backup.version, current_version
        )));
    }

    let conn = state.games_db.lock()?;

    // Transação única para todas as operações
    conn.execute("BEGIN IMMEDIATE TRANSACTION", [])?;

    // Usa prepared statements para melhor desempenho
    let mut game_stmt = conn.prepare(
        "INSERT OR REPLACE INTO games (id, name, cover_url, platform, platform_game_id, installed, import_confidence, install_path, executable_path, launch_args, user_rating, favorite, status, playtime, last_played, added_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)"
    )?;

    // Prepared Statement para Details (ATUALIZADO COM NOVOS CAMPOS)
    let mut details_stmt = conn.prepare(
        "INSERT OR REPLACE INTO game_details (
        game_id, steam_app_id, developer, publisher, release_date, genres, tags, series,
        description_raw, description_ptbr, background_image, critic_score, steam_review_label,
        steam_review_count, steam_review_score, steam_review_updated_at, esrb_rating, is_adult,
        adult_tags, external_links, median_playtime, estimated_playtime
    )
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22)"
    )?;

    let mut wishlist_stmt = conn.prepare(
        "INSERT OR REPLACE INTO wishlist (id, name, cover_url, store_url, store_platform, current_price, normal_price, lowest_price, currency, on_sale, voucher, added_at, itad_id)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)"
    )?;

    for game in &backup.games {
        game_stmt.execute(rusqlite::params![
            game.id,
            game.name,
            game.cover_url,
            game.platform.to_string(),
            game.platform_game_id,
            game.installed,
            game.import_confidence.as_ref().map(|ic| ic.to_string()),
            game.install_path,
            game.executable_path,
            game.launch_args,
            game.user_rating,
            game.favorite,
            game.status,
            game.playtime,
            game.last_played,
            game.added_at
        ])?;
    }

    // Loop Details
    for detail in &backup.game_details {
        // Serializa o HashMap de links e as tags para JSON String antes de salvar
        let links_json = detail
            .external_links
            .as_ref()
            .and_then(|links| serde_json::to_string(links).ok());

        let tags_json = detail
            .tags
            .as_ref()
            .and_then(|tags| crate::database::serialize_tags(tags).ok());

        details_stmt.execute(params![
            detail.game_id,
            detail.steam_app_id,
            detail.developer,
            detail.publisher,
            detail.release_date,
            detail.genres,
            tags_json,
            detail.series,
            detail.description_raw,
            detail.description_ptbr,
            detail.background_image,
            detail.critic_score,
            detail.steam_review_label,
            detail.steam_review_count,
            detail.steam_review_score,
            detail.steam_review_updated_at,
            detail.esrb_rating,
            detail.is_adult,
            detail.adult_tags,
            links_json, // JSON String
            detail.median_playtime,
            detail.estimated_playtime
        ])?;
    }

    for item in &backup.wishlist_game {
        wishlist_stmt.execute(rusqlite::params![
            item.id,
            item.name,
            item.cover_url,
            item.store_url,
            item.store_platform,
            item.current_price,
            item.normal_price,
            item.lowest_price,
            item.currency,
            item.on_sale,
            item.voucher,
            item.added_at,
            item.itad_id
        ])?;
    }

    // Prepared statement para game_extras
    let mut extras_stmt = conn.prepare(
        "INSERT OR REPLACE INTO game_extras (
        steam_app_id, pcgw_page_id, pcgw_page_name, engine,
        available_on,
        dx_versions, vulkan_versions, opengl_versions,
        win64, linux64, macos_arm, macos_intel64,
        ray_tracing, upscaling, frame_gen,
        ultrawidescreen, four_k_support, hdr, high_fps, fov, borderless_windowed, color_blind,
        controller_support, full_controller, playstation_controllers, xinput_controllers,
        surround_sound, subtitles, closed_captions,
        has_save_data, has_config_data,
        languages_interface, languages_audio, languages_subtitles,
        fetched_at
    ) VALUES (
        ?1,  ?2,  ?3,  ?4,
        ?5,
        ?6,  ?7,  ?8,
        ?9,  ?10, ?11, ?12,
        ?13, ?14, ?15,
        ?16, ?17, ?18, ?19, ?20, ?21, ?22,
        ?23, ?24, ?25, ?26,
        ?27, ?28, ?29,
        ?30, ?31,
        ?32, ?33, ?34,
        ?35
    )",
    )?;

    let mut sysreq_stmt = conn.prepare(
        "INSERT INTO system_requirements (
            steam_app_id, os_family, tier_title, target,
            min_os, min_cpu, min_cpu2, min_ram, min_gpu, min_gpu2, min_vram, min_dx, min_storage,
            rec_os, rec_cpu, rec_cpu2, rec_ram, rec_gpu, rec_gpu2, rec_vram, rec_dx, rec_storage,
            fetched_at
        ) VALUES (
            ?1,  ?2,  ?3,  ?4,
            ?5,  ?6,  ?7,  ?8,  ?9,  ?10, ?11, ?12, ?13,
            ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22,
            ?23
        )",
    )?;

    let mut paths_stmt = conn.prepare(
        "INSERT INTO game_data_paths (steam_app_id, kind, os, raw_path, fetched_at)
         VALUES (?1, ?2, ?3, ?4, ?5)",
    )?;

    let serialize_vec = |v: &Option<Vec<String>>| -> Option<String> {
        v.as_ref().and_then(|list| serde_json::to_string(list).ok())
    };

    let now = Utc::now().to_rfc3339();

    // Limpa dados anteriores das tabelas com múltiplas linhas por jogo antes de reinserir
    conn.execute("DELETE FROM system_requirements", [])?;
    conn.execute("DELETE FROM game_data_paths", [])?;

    for extras in &backup.game_extras {
        extras_stmt.execute(params![
            extras.steam_app_id,
            extras.pcgw_page_id,
            extras.pcgw_page_name,
            extras.engine,
            extras.available_on,
            extras.dx_versions,
            extras.vulkan_versions,
            extras.opengl_versions,
            extras.win64,
            extras.linux64,
            extras.macos_arm,
            extras.macos_intel64,
            extras.ray_tracing,
            extras.upscaling,
            extras.frame_gen,
            extras.ultrawidescreen,
            extras.four_k_support,
            extras.hdr,
            extras.high_fps,
            extras.fov,
            extras.borderless_windowed,
            extras.color_blind,
            extras.controller_support,
            extras.full_controller,
            extras.playstation_controllers,
            extras.xinput_controllers,
            extras.surround_sound,
            extras.subtitles,
            extras.closed_captions,
            extras.has_save_data,
            extras.has_config_data,
            serialize_vec(&extras.languages_interface),
            serialize_vec(&extras.languages_audio),
            serialize_vec(&extras.languages_subtitles),
            extras.fetched_at,
        ])?;
    }

    for req in &backup.system_requirements {
        sysreq_stmt.execute(params![
            req.steam_app_id,
            req.os_family,
            req.tier_title,
            req.target,
            req.min_os,
            req.min_cpu,
            req.min_cpu2,
            req.min_ram,
            req.min_gpu,
            req.min_gpu2,
            req.min_vram,
            req.min_dx,
            req.min_storage,
            req.rec_os,
            req.rec_cpu,
            req.rec_cpu2,
            req.rec_ram,
            req.rec_gpu,
            req.rec_gpu2,
            req.rec_vram,
            req.rec_dx,
            req.rec_storage,
            now,
        ])?;
    }

    for path in &backup.game_data_paths {
        paths_stmt.execute(params![
            path.steam_app_id,
            path.kind,
            path.os,
            path.raw_path,
            now,
        ])?;
    }

    conn.execute("COMMIT", [])?;

    Ok(format!(
        "Backup restaurado! {} jogos, {} detalhes, {} itens da wishlist, {} dados técnicos, {} requisitos de sistema e {} caminhos.",
        backup.games.len(),
        backup.game_details.len(),
        backup.wishlist_game.len(),
        backup.game_extras.len(),
        backup.system_requirements.len(),
        backup.game_data_paths.len(),
    ))
}

/// Busca todos os jogos na biblioteca
///
/// Retorna um vetor de `Game` ou um erro AppError.
fn fetch_games(conn: &rusqlite::Connection) -> Result<Vec<Game>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, name, cover_url, platform, platform_game_id, installed, import_confidence, install_path, executable_path, launch_args, user_rating, favorite, status, playtime, last_played, added_at FROM games"
    )?;

    let game_iter = stmt.query_map([], |row| {
        Ok(Game {
            id: row.get(0)?,
            name: row.get(1)?,
            cover_url: row.get(2)?,
            genres: None,
            developer: None,
            platform: row.get::<_, String>(3)?.parse().unwrap_or(Platform::Outra),
            platform_game_id: row.get(4)?,
            installed: row.get(5)?,
            import_confidence: row
                .get::<_, Option<String>>(6)?
                .and_then(|s| s.parse().ok()),
            install_path: row.get(7)?,
            executable_path: row.get(8)?,
            launch_args: row.get(9)?,
            user_rating: row.get(10)?,
            favorite: row.get(11)?,
            status: row.get(12)?,
            playtime: row.get(13)?,
            last_played: row.get(14)?,
            added_at: row.get(15)?,
            is_adult: false,
        })
    })?;

    Ok(game_iter.collect::<Result<Vec<_>, _>>()?)
}

/// Busca todos os detalhes dos jogos na biblioteca
///
/// Retorna um vetor de `GameDetails` ou um erro AppError.
fn fetch_game_details(conn: &rusqlite::Connection) -> Result<Vec<GameDetails>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT
        game_id, steam_app_id, developer, publisher, release_date, genres, tags, series,
        description_raw, description_ptbr, background_image, critic_score,
        steam_review_label, steam_review_count, steam_review_score, steam_review_updated_at,
        esrb_rating, is_adult, adult_tags, external_links, median_playtime,
        estimated_playtime
     FROM game_details",
    )?;

    let details_iter = stmt.query_map([], |row| {
        // Deserializa JSON strings
        let links_json: Option<String> = row.get(19)?;
        let external_links = links_json.and_then(|s| serde_json::from_str(&s).ok());

        let tags_json: Option<String> = row.get(6)?;
        let tags = tags_json.map(|s| crate::database::deserialize_tags(&s));

        Ok(GameDetails {
            game_id: row.get(0)?,
            steam_app_id: row.get(1)?,
            developer: row.get(2)?,
            publisher: row.get(3)?,
            release_date: row.get(4)?,
            genres: row.get(5)?,
            tags,
            series: row.get(7)?,
            description_raw: row.get(8)?,
            description_ptbr: row.get(9)?,
            background_image: row.get(10)?,
            critic_score: row.get(11)?,
            steam_review_label: row.get(12)?,
            steam_review_count: row.get(13)?,
            steam_review_score: row.get(14)?,
            steam_review_updated_at: row.get(15)?,
            esrb_rating: row.get(16)?,
            is_adult: row.get(17).unwrap_or(false),
            adult_tags: row.get(18)?,
            external_links,
            median_playtime: row.get(20)?,
            estimated_playtime: row.get(21)?,
        })
    })?;

    Ok(details_iter.collect::<Result<Vec<_>, _>>()?)
}

/// Busca todos os jogos da wishlist
///
/// Retorna um vetor de `WishlistGame` ou um erro AppError.
fn fetch_wishlist(conn: &rusqlite::Connection) -> Result<Vec<WishlistGame>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, name, cover_url, store_url, store_platform, itad_id, current_price, normal_price, lowest_price, currency, on_sale, voucher, added_at FROM wishlist"
    )?;

    let wishlist_iter = stmt.query_map([], |row| {
        Ok(WishlistGame {
            id: row.get(0)?,
            name: row.get(1)?,
            cover_url: row.get(2)?,
            store_url: row.get(3)?,
            store_platform: row.get(4)?,
            itad_id: row.get(5)?,
            current_price: row.get(6)?,
            normal_price: row.get(7)?,
            lowest_price: row.get(8)?,
            currency: row.get(9)?,
            on_sale: row.get(10)?,
            voucher: row.get(11)?,
            added_at: row.get(12)?,
        })
    })?;

    Ok(wishlist_iter.collect::<Result<Vec<_>, _>>()?)
}

/// Busca todos os dados técnicos do PCGamingWiki para backup.
///
/// Inclui apenas registros que já foram buscados (`fetched_at IS NOT NULL`).
fn fetch_game_extras(conn: &rusqlite::Connection) -> Result<Vec<GameExtras>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT
            steam_app_id, pcgw_page_id, pcgw_page_name, engine,
            available_on,
            dx_versions, vulkan_versions, opengl_versions,
            win64, linux64, macos_arm, macos_intel64,
            ray_tracing, upscaling, frame_gen,
            ultrawidescreen, four_k_support, hdr, high_fps, fov, borderless_windowed, color_blind,
            controller_support, full_controller, playstation_controllers, xinput_controllers,
            surround_sound, subtitles, closed_captions,
            has_save_data, has_config_data,
            languages_interface, languages_audio, languages_subtitles,
            fetched_at
         FROM game_extras
         WHERE fetched_at IS NOT NULL",
    )?;

    let parse_json_vec = |s: Option<String>| -> Option<Vec<String>> {
        s.and_then(|v| serde_json::from_str(&v).ok())
    };

    let iter = stmt.query_map([], |row| {
        Ok(GameExtras {
            steam_app_id: row.get(0)?,
            pcgw_page_id: row.get(1)?,
            pcgw_page_name: row.get(2)?,
            engine: row.get(3)?,
            available_on: row.get(4)?,
            dx_versions: row.get(5)?,
            vulkan_versions: row.get(6)?,
            opengl_versions: row.get(7)?,
            win64: row.get(8)?,
            linux64: row.get(9)?,
            macos_arm: row.get(10)?,
            macos_intel64: row.get(11)?,
            ray_tracing: row.get(12)?,
            upscaling: row.get(13)?,
            frame_gen: row.get(14)?,
            ultrawidescreen: row.get(15)?,
            four_k_support: row.get(16)?,
            hdr: row.get(17)?,
            high_fps: row.get(18)?,
            fov: row.get(19)?,
            borderless_windowed: row.get(20)?,
            color_blind: row.get(21)?,
            controller_support: row.get(22)?,
            full_controller: row.get(23)?,
            playstation_controllers: row.get(24)?,
            xinput_controllers: row.get(25)?,
            surround_sound: row.get(26)?,
            subtitles: row.get(27)?,
            closed_captions: row.get(28)?,
            has_save_data: row.get(29)?,
            has_config_data: row.get(30)?,
            languages_interface: parse_json_vec(row.get(31)?),
            languages_audio: parse_json_vec(row.get(32)?),
            languages_subtitles: parse_json_vec(row.get(33)?),
            fetched_at: row.get(34)?,
        })
    })?;

    Ok(iter.collect::<Result<Vec<_>, _>>()?)
}

/// Busca todos os requisitos de sistema para backup.
fn fetch_system_requirements(
    conn: &rusqlite::Connection,
) -> Result<Vec<SystemRequirements>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT
            steam_app_id, os_family, tier_title, target,
            min_os, min_cpu, min_cpu2, min_ram, min_gpu, min_gpu2, min_vram, min_dx, min_storage,
            rec_os, rec_cpu, rec_cpu2, rec_ram, rec_gpu, rec_gpu2, rec_vram, rec_dx, rec_storage
         FROM system_requirements
         ORDER BY steam_app_id, id ASC",
    )?;

    let iter = stmt.query_map([], |row| {
        Ok(SystemRequirements {
            steam_app_id: row.get(0)?,
            os_family: row.get(1)?,
            tier_title: row.get(2)?,
            target: row.get(3)?,
            min_os: row.get(4)?,
            min_cpu: row.get(5)?,
            min_cpu2: row.get(6)?,
            min_ram: row.get(7)?,
            min_gpu: row.get(8)?,
            min_gpu2: row.get(9)?,
            min_vram: row.get(10)?,
            min_dx: row.get(11)?,
            min_storage: row.get(12)?,
            rec_os: row.get(13)?,
            rec_cpu: row.get(14)?,
            rec_cpu2: row.get(15)?,
            rec_ram: row.get(16)?,
            rec_gpu: row.get(17)?,
            rec_gpu2: row.get(18)?,
            rec_vram: row.get(19)?,
            rec_dx: row.get(20)?,
            rec_storage: row.get(21)?,
        })
    })?;

    Ok(iter.collect::<Result<Vec<_>, _>>()?)
}

/// Busca todos os caminhos de game data para backup.
fn fetch_game_data_paths(conn: &rusqlite::Connection) -> Result<Vec<GameDataPath>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT steam_app_id, kind, os, raw_path
         FROM game_data_paths
         ORDER BY steam_app_id, id ASC",
    )?;

    let iter = stmt.query_map([], |row| {
        Ok(GameDataPath {
            steam_app_id: row.get(0)?,
            kind: row.get(1)?,
            os: row.get(2)?,
            raw_path: row.get(3)?,
            expanded_path: None,
        })
    })?;

    Ok(iter.collect::<Result<Vec<_>, _>>()?)
}
