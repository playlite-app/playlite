//! Módulos utilizados para importar de jogos.
//!
//! Fornece funcionalidades para integrar e obter dados de diferentes plataformas de jogos.
//! Cada módulo encapsula a lógica necessária para comunicação com uma plataforma específica,
//! facilitando a manutenção e expansão do código.
//!
//! **Módulos:**
//!
//! - `games_scanner`: Escaneia pastas em busca de jogos instalados localmente.
//! - `steam`: Impporta jogos da Steam.

pub mod games_scanner;
pub mod steam;
