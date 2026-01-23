use serde::Serialize;
use thiserror::Error;

#[allow(dead_code)]
#[derive(Debug, Error, Serialize)]
#[serde(tag = "type", content = "message")]
pub enum AppError {
    #[error("Erro de banco de dados: {0}")]
    DatabaseError(String),

    #[error("Erro de validação: {0}")]
    ValidationError(String),

    #[error("Erro de rede: {0}")]
    NetworkError(String),

    #[error("Não encontrado: {0}")]
    NotFound(String),

    #[error("Erro interno: falha ao acessar recurso compartilhado")]
    MutexError,

    #[error("Erro de I/O: {0}")]
    IoError(String),

    #[error("Erro de serialização: {0}")]
    SerializationError(String),

    #[error("Recurso já existe: {0}")]
    AlreadyExists(String),
}

impl From<rusqlite::Error> for AppError {
    fn from(err: rusqlite::Error) -> Self {
        AppError::DatabaseError(err.to_string())
    }
}

// Para erros de Mutex/PoisonError
impl<T> From<std::sync::PoisonError<T>> for AppError {
    fn from(_: std::sync::PoisonError<T>) -> Self {
        AppError::MutexError
    }
}

// Para erros de I/O
impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::IoError(err.to_string())
    }
}

// Para erros de serialização/deserialização JSON
impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::SerializationError(err.to_string())
    }
}

// Para converter String em AppError (útil para migração gradual)
impl From<String> for AppError {
    fn from(err: String) -> Self {
        AppError::DatabaseError(err)
    }
}

// Para converter AppError em String (compatibilidade com código antigo)
impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        err.to_string()
    }
}
