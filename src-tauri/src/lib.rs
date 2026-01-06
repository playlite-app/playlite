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
mod database;
pub mod models;
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

            tracing::info!("Aplicação iniciada! Logs em: {:?}", log_dir);

            // === SEGURANÇA ===
            security::init_security(app_handle).expect("Falha ao inicializar sistema de segurança");

            tracing::info!("Sistema de segurança inicializado");

            // === BANCOS DE DADOS ===
            let db_state = database::initialize_databases(app_handle)
                .expect("Falha ao inicializar bancos de dados");

            app.manage(db_state);

            tracing::info!("Bancos de dados inicializados com sucesso");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Comando de Inicialização do Banco de Dados
            database::init_db,
            // Comandos de Jogos (CRUD)
            commands::games::add_game,
            commands::games::get_games,
            commands::games::toggle_favorite,
            commands::games::delete_game,
            commands::games::update_game,
            // Comandos da Lista de Desejos
            commands::wishlist::search_wishlist_game,
            commands::wishlist::add_to_wishlist,
            commands::wishlist::get_wishlist,
            commands::wishlist::remove_from_wishlist,
            commands::wishlist::check_wishlist_status,
            commands::wishlist::refresh_prices,
            // Comandos de Integração (Steam/RAWG)
            commands::integrations::import_steam_library,
            commands::integrations::enrich_library,
            commands::integrations::get_trending_games,
            commands::integrations::get_upcoming_games,
            commands::integrations::fetch_game_details,
            // Comandos de Configuração (Secrets)
            commands::settings::set_secret,
            commands::settings::get_secret,
            commands::settings::delete_secret,
            commands::settings::list_secrets,
            commands::settings::get_secrets,
            commands::settings::set_secrets,
            // Comandos de Backup e Restauração
            commands::backup::export_database,
            commands::backup::import_database,
            // Comando de Recomendação
            commands::recommendations::get_user_profile
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
