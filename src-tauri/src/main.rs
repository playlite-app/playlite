//! Ponto de entrada da aplicação.
//!
//! Apenas inicializa e executa a aplicação principal.

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    game_manager_lib::run();
}
