//! Módulos utilizados para importar de jogos.
//!
//! Fornece funcionalidades para integrar e obter dados de diferentes plataformas de jogos.
//! Cada módulo encapsula a lógica necessária para comunicação com uma plataforma específica,
//! facilitando a manutenção e expansão do código.
//!
//! **Módulos:**
//!
//! - `epic`: Importa jogos da Epic Games Store, conectando-se aos arquivos locais para obter a lista completa de jogos instalados.
//! - `heroic`: Importa jogos do Heroic Games Launcher, lendo os arquivos de configuração do Heroic para detectar jogos instalados via essa plataforma.
//! - `legacy`: Importa jogos da loja Legacy Games, utilizando métodos de leitura de arquivos para identificar jogos obtidos por essa plataforma.
//! - `providers`: Gerencia provedores de jogos, permitindo a integração com múltiplas plataformas de jogos.
//! - `scanner`: Escaneia pastas em busca de jogos instalados localmente.
//! - `steam`: Importa jogos da Steam.
//! - `ubisoft`: Importa jogos da Ubisoft Connect, conectando-se aos arquivos locais para obter a lista completa de jogos instalados.

pub mod epic;
pub mod heroic;
pub mod legacy;
pub mod providers;
pub mod scanner;
pub mod steam;
pub mod ubisoft;
