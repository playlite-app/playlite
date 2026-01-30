//! Seriços para interagir com o banco de dados do aplicativo.
//!
//! **Módulos:**
//! - `core`: Gerenciamento da conexão com o banco de dados SQLite.
//! - `migrations`: Gerenciamento de migrações do banco de dados.
//! - `backup`: Funcionalidades de backup e restauração do banco de dados.

pub mod backup;
pub(crate) mod core;
pub(crate) mod migrations;

// Reexporta o módulo core para fácil acesso
pub use core::*;
