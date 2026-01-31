//! # Playlite - Game Manager Library
//!
//! Fornece funcionalidades para:
//! - Importar jogos do Steam
//! - Gerenciar biblioteca pessoal
//! - Wishlist com tracking de preços
//! - Armazenamento seguro de API keys
//! - Busca de jogos em tendência (RAWG API)

pub mod commands;
mod constants;
mod crypto;
mod database;
mod errors;
pub mod models;
mod secrets;
mod security;
pub mod services;
pub mod utils;

use crate::errors::AppError;
use crate::utils::logger;
use chrono::Utc;
use tauri::{AppHandle, Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_machine_uid::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let app_handle = app.handle();

            // === LOGGING ===

            let log_dir = app_handle
                .path()
                .app_log_dir()
                .expect("Falha ao pegar pasta de log");

            std::fs::create_dir_all(&log_dir).expect("Falha ao criar pasta de dev_logs");

            let _guard = logger::init_logging(log_dir.clone());
            app.manage(_guard);

            // === SEGURANÇA ===

            security::init_security(app_handle).expect("Falha ao inicializar sistema de segurança");

            // === BANCOS DE DADOS ===

            let db_state = database::initialize_databases(app_handle)
                .expect("Falha ao inicializar bancos de dados");

            app.manage(db_state);

            // === INICIALIZAÇÃO PÓS-UPDATE ===

            // Verifica se houve atualização e faz backup/migração se necessário
            if let Err(e) = initialize_app(app_handle) {
                tracing::error!("Erro na inicialização pós-update: {}", e);
                // Não falha a aplicação, apenas loga o erro
            }

            // === COLLABORATIVE FILTERING ===

            if let Err(e) = services::cf_aggregator::init_cf_index() {
                tracing::warn!("CF desativado (fallback CB ativo): {}", e);
            }

            // Log de inicialização completa
            tracing::info!("Playlite iniciado com sucesso");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Comando de Inicialização do Banco de Dados
            database::init_db,
            // Comandos de Backup e Restauração
            database::backup::export_database,
            database::backup::import_database,
            // Comandos de Jogos (CRUD)
            commands::games::add_game,
            commands::games::get_games,
            commands::games::get_library_game_details,
            commands::games::toggle_favorite,
            commands::games::delete_game,
            commands::games::update_game,
            commands::games::update_game_details,
            // Comandos da Lista de Desejos
            commands::wishlist::search_wishlist_game,
            commands::wishlist::add_to_wishlist,
            commands::wishlist::get_wishlist,
            commands::wishlist::remove_from_wishlist,
            commands::wishlist::check_wishlist_status,
            commands::wishlist::refresh_prices,
            commands::wishlist::import_wishlist,
            commands::wishlist::fetch_wishlist_covers,
            // Comandos de Importação de Plataformas
            commands::plataforms::import_steam_library,
            // Comandos de Metadados (Enriquecimento, Capas, Refresh, Busca)
            commands::metadata::enrichment::update_metadata,
            commands::metadata::covers::fetch_missing_covers,
            commands::metadata::refresh::check_and_refresh_background,
            commands::metadata::search::get_trending_games,
            commands::metadata::search::get_upcoming_games,
            commands::metadata::search::fetch_game_details,
            commands::metadata::search::get_active_giveaways,
            // Comandos de Configuração (Secrets)
            commands::settings::set_secret,
            commands::settings::get_secret,
            commands::settings::delete_secret,
            commands::settings::list_secrets,
            commands::settings::get_secrets,
            commands::settings::set_secrets,
            // Comando de Recomendação
            commands::recommendations::get_user_profile,
            commands::recommendations::recommend_hybrid_library,
            commands::recommendations::recommend_collaborative_library,
            commands::recommendations::recommend_from_library,
            // Comando de Tradução de Descrição
            commands::ai_translation::translate_description,
            // Comandos de Conquistas de Jogos
            commands::achievements::get_recent_achievements,
            // Comandos de Cache de Metadados
            commands::caches::cleanup_cache,
            commands::caches::clear_all_cache,
            commands::caches::get_detailed_cache_stats,
            // Comandos de Versionamento
            commands::version::get_app_version_info,
            // Comandos de Imagem
            services::images::cache_cover_image,
            services::images::check_local_cover,
            services::images::clear_cover_cache,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Inicializa a aplicação após uma atualização
///
/// Verifica se houve mudança de versão e executa:
/// 1. Backup automático se versão major mudou
/// 2. Migração de schema se necessário
/// 3. Atualiza versão armazenada
///
/// Deve ser chamada após o Tauri updater ou na primeira inicialização
pub fn initialize_app(app: &AppHandle) -> Result<(), AppError> {
    let current_version = app.package_info().version.to_string();
    let previous_version = database::configs::get_stored_app_version(app)?;

    // Obtém acesso ao metadata_db para configurações
    let state: tauri::State<database::AppState> = app.state();
    let metadata_conn = state.metadata_db.lock().map_err(|_| AppError::MutexError)?;

    // Verifica se é primeira instalação
    if database::configs::get_config(&metadata_conn, "install_date")?.is_none() {
        let now = Utc::now().to_rfc3339();
        database::configs::set_config(&metadata_conn, "install_date", &now)?;
        tracing::info!("Primeira execução detectada. Data salva: {}", now);
    }

    drop(metadata_conn); // Libera o lock antes de continuar

    tracing::info!(
        "Inicializando app - Versão anterior: {}, Atual: {}",
        previous_version,
        current_version
    );

    // Se é primeira execução ou versão mudou
    if previous_version != current_version {
        // 1. Backup automático se major version mudou
        if let Some(backup_path) =
            database::backup::backup_if_major_update(app, &previous_version, &current_version)?
        {
            tracing::info!("Backup automático criado em: {:?}", backup_path);

            // Emite evento para o frontend saber sobre o backup
            let backup_path_str = backup_path.to_string_lossy().to_string();
            let _ = app.emit("backup-created", backup_path_str);
        }

        // 2. Migração de schema (já feita em initialize_databases, mas verificada aqui)
        let lib_conn = state.library_db.lock().map_err(|_| AppError::MutexError)?;
        database::migrations::run_migrations(app, &lib_conn)?;
        drop(lib_conn); // Libera o lock

        // 3. Atualiza versão armazenada
        database::configs::store_app_version(app, &current_version)?;

        // Armazena a versão do schema (major version)
        let schema_version = app.package_info().version.major as u32;
        database::configs::store_schema_version(app, schema_version)?;

        // Atualiza timestamp de última atualização
        let metadata_conn = state.metadata_db.lock().map_err(|_| AppError::MutexError)?;
        let now = Utc::now().to_rfc3339();
        database::configs::set_config(&metadata_conn, "last_updated_at", &now)?;
        drop(metadata_conn);

        tracing::info!("App inicializado com sucesso na versão {}", current_version);
    } else {
        tracing::info!("Nenhuma atualização detectada");
    }

    Ok(())
}
