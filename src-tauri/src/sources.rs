//! Módulos utilizados para importar de jogos.
//!
//! Fornece funcionalidades para integrar e obter dados de diferentes plataformas de jogos.
//! Cada módulo encapsula a lógica necessária para comunicação com uma plataforma específica,
//! facilitando a manutenção e expansão do código.
//!
//! **Módulos:**
//!
//! - `providers`: Gerencia provedores de jogos, permitindo a integração com múltiplas plataformas de jogos.
//! - `scanner`: Escaneia pastas em busca de jogos instalados localmente.
//! - `steam`: Importa jogos da Steam.

pub mod providers;
pub mod scanner;
pub mod steam;
