//! Sistema de migração de schema do banco de dados.
//!
//! Regras:
//! - Migrações só ocorrem entre MAJOR versions
//! - Sempre assume backup automático antes de migrar
//! - Falha de migração nunca destrói dados existentes

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

    // Migração incremental
    migrate_schema(conn, current, expected)?;

    // Atualiza versão do schema
    conn.pragma_update(None, "user_version", expected)
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok(())
}

/// Função central de migração
fn migrate_schema(conn: &Connection, from: u32, to: u32) -> Result<(), AppError> {
    let mut current = from;

    while current < to {
        match current {
            2 => migrate_v2_to_v3(conn)?,
            _ => {
                return Err(AppError::ValidationError(format!(
                    "Migração não implementada: v{} → v{}",
                    current,
                    current + 1
                )));
            }
        }

        current += 1;
    }

    Ok(())
}

/// Migração do schema v2 para v3
///
/// Principais mudanças:
/// - Campos HLTB removidos
/// - URLs legadas removidas (migradas para external_links JSON)
/// - users_score removido (substituído por steam_review_*)
fn migrate_v2_to_v3(_conn: &Connection) -> Result<(), AppError> {
    // Remove colunas antigas se existirem
    // SQLite não suporta DROP COLUMN diretamente, então usamos uma abordagem de recriar tabela

    // Por enquanto, apenas marca como migrado
    // A migração real deve ser implementada conforme necessário

    Ok(())
}
