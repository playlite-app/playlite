//! Sistema de migração de schema do banco de dados.
//!
//! Regras:
//! - Migrações só ocorrem entre MAJOR versions
//! - Sempre assume backup automático antes de migrar
//! - Falha de migração nunca destrói dados existentes
//!
//! **Nota:** Durante a fase de testes, as migrações estão desabilitadas.
//! O banco deve ser deletado e recriado manualmente para aplicar mudanças de schema.

use crate::database::{current_schema_version, expected_schema_version};
use crate::errors::AppError;
use rusqlite::Connection;
use tauri::AppHandle;

/// Executa migrações de schema se necessário.
///
/// Deve ser chamada logo após abrir o banco e ANTES de usar qualquer tabela.
pub fn run_migrations(app: &AppHandle, conn: &Connection) -> Result<(), AppError> {
    let current = current_schema_version(conn)?;
    let expected = expected_schema_version(app);

    // Banco novo (schema já foi criado em initialize_databases)
    if current == 0 {
        return Ok(());
    }

    // Nada a fazer
    if current == expected {
        return Ok(());
    }

    // Downgrade não suportado
    if current > expected {
        return Err(AppError::ValidationError(format!(
            "Downgrade não suportado. Banco v{}, app espera v{}",
            current, expected
        )));
    }

    // Durante fase de testes, migrações estão desabilitadas
    // O usuário deve deletar e recriar o banco manualmente
    Err(AppError::ValidationError(format!(
        "Migração necessária de v{} para v{}. Durante a fase de testes, delete o banco e deixe o app recriá-lo.",
        current, expected
    )))
}
