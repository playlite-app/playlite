//! Utilitários genéricos para fluxo OAuth2 com PKCE.
//!
//! Fornece funcionalidades para gerar desafios PKCE e iniciar um servidor temporário
//! para capturar o código de autorização retornado pelo provedor OAuth2.

use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use rand::{distr::Alphanumeric, Rng};
use sha2::{Digest, Sha256};
use std::{sync::mpsc, thread, time::Duration};
use tiny_http::{Response, Server};
use url::Url;

/// Estrutura para o desafio PKCE (Proof Key for Code Exchange).
pub struct PkceChallenge {
    pub verifier: String,
    pub challenge: String,
}

impl PkceChallenge {
    pub fn generate() -> Self {
        let verifier: String = rand::rng()
            .sample_iter(&Alphanumeric)
            .take(64)
            .map(char::from)
            .collect();

        let hash = Sha256::digest(verifier.as_bytes());
        let challenge = URL_SAFE_NO_PAD.encode(hash);

        Self {
            verifier,
            challenge,
        }
    }
}

/// Inicia um servidor temporário para receber o callback do OAuth.
/// Bloqueia a thread até receber o código ou dar timeout.
pub fn wait_for_auth_code(port: u16) -> Result<String, String> {
    let address = format!("127.0.0.1:{}", port);
    // Tenta iniciar o servidor
    let server =
        Server::http(&address).map_err(|e| format!("Porta ocupada ou erro de rede: {}", e))?;

    let (tx, rx) = mpsc::channel::<String>();

    thread::spawn(move || {
        // Aguarda requisição (Timeout de 2 minutos)
        if let Ok(Some(request)) = server.recv_timeout(Duration::from_secs(120)) {
            // Parser da URL de callback
            let url_string = format!("http://localhost{}", request.url());
            if let Ok(url) = Url::parse(&url_string) {
                // Busca o parâmetro ?code=...
                if let Some((_, code)) = url.query_pairs().find(|(k, _)| k == "code") {
                    let _ = tx.send(code.to_string());

                    // Resposta bonita para o usuário no navegador
                    let html = "
                        <html>
                        <body style='background:#1a1a1a; color:#fff; font-family:sans-serif; text-align:center; padding-top:50px;'>
                            <h1 style='color:#4ade80'>Login Concluído!</h1>
                            <p>Você já pode fechar esta janela e voltar para o Playlite.</p>
                            <script>window.close();</script>
                        </body>
                        </html>
                    ";
                    let _ = request.respond(
                        Response::from_string(html).with_header(
                            tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"text/html"[..])
                                .unwrap(),
                        ),
                    );
                    return;
                }
            }
            // Se não achou code, responde erro
            let _ = request.respond(Response::from_string("Erro: Código não encontrado."));
        }
    });

    // Aguarda o canal enviar o código
    rx.recv_timeout(Duration::from_secs(120))
        .map_err(|_| "Tempo limite de login excedido.".to_string())
}
