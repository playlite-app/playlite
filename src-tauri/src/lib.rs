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

use crate::utils::logger;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_machine_uid::init())
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

            // === COLLABORATIVE FILTERING ===
            let cf_path = app_handle.path().resolve(
                "data/collaborative_index.json",
                tauri::path::BaseDirectory::AppData,
            )?;

            if let Err(e) = services::cf_aggregator::init_cf_index(&cf_path) {
                tracing::warn!("CF desativado (fallback CB ativo): {}", e);
            }

            // Log único de sucesso
            tracing::info!("Playlite iniciado com sucesso");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Comando de Inicialização do Banco de Dados
            database::init_db,
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
            // Comandos de ‘Backup’ e Restauração
            commands::backup::export_database,
            commands::backup::import_database,
            // Comando de Recomendação
            commands::recommendations::get_user_profile,
            commands::recommendations::recommend_from_library,
            commands::recommendations::get_game_affinity,
            commands::recommendations::recommend_collaborative_library,
            commands::recommendations::recommend_hybrid_library,
            // Comando de Tradução de Descrição
            commands::ai_translation::translate_description,
            // Comandos de Conquistas de Jogos
            commands::achievements::get_recent_achievements,
            // Comandos de Cache de Metadados
            commands::caches::cleanup_cache,
            commands::caches::clear_all_cache,
            commands::caches::get_detailed_cache_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
