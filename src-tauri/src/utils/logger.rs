//! Módulo responsável pela configuração do sistema de logging da aplicação.
//!
//! Utiliza a crate `tracing` para capturar e formatar logs, com suporte a rotação de arquivos diários.
//! Níveis de log configuráveis via variáveis de ambiente.
//!
//! # Funções
//! - `init_logging(log_dir: PathBuf) -> WorkerGuard`: Inicializa o sistema de logging.
//!
//! # Retorno
//! - `WorkerGuard` para garantir que os logs sejam escritos corretamente antes do encerramento da aplicação.
//!
//! # Exemplo de Uso
//! ```no_run
//! use std::path::PathBuf;
//! use your_crate::utils::logger;
//! let log_dir = PathBuf::from("/caminho/para/logs");
//!
//! let _guard = logger::init_logging(log_dir);
//!
//! ```

use std::path::PathBuf;
use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::{
    filter::EnvFilter, fmt, layer::SubscriberExt, util::SubscriberInitExt, Layer,
};

pub fn init_logging(log_dir: PathBuf) -> WorkerGuard {
    // Configura rotação de dev_logs: cria um arquivo novo por dia - Ex: app.log.2026-01-02
    let file_appender = tracing_appender::rolling::daily(log_dir, "playlite.log");

    // O WorkerGuard garante que os dev_logs sejam escritos antes do app fechar
    let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);

    // Configura o formato do log
    let registry = tracing_subscriber::registry()
        .with(EnvFilter::new("info,game_manager_lib=debug,tao=error"))
        .with(
            fmt::Layer::default()
                .with_writer(non_blocking)
                .with_ansi(false) // Remove cores para o arquivo ficar legível
                .with_target(false)
                .with_file(true)
                .with_line_number(true),
        );

    // Adiciona layer para stdout APENAS em modo de desenvolvimento (debug)
    #[cfg(debug_assertions)]
    let registry = registry.with(
        fmt::Layer::default()
            .with_writer(std::io::stdout)
            .with_filter(tracing_subscriber::filter::LevelFilter::DEBUG),
    );

    registry.init();

    guard
}
