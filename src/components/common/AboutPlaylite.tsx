import { invoke } from '@tauri-apps/api/core';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Github } from '@/components/icons';

interface TechLinkProps {
  name: string;
  url: string;
  description?: string;
}

function TechLink({ name, url, description }: Readonly<TechLinkProps>) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group inline-flex items-center gap-1 text-blue-400 transition-colors hover:text-blue-300 hover:underline"
    >
      {name}
      <ExternalLink size={12} className="opacity-70 group-hover:opacity-100" />
      {description && (
        <span className="text-muted-foreground ml-1 text-xs">
          ({description})
        </span>
      )}
    </a>
  );
}

interface AboutPlayliteProps {
  className?: string;
}

export function AboutPlaylite({
  className = '',
}: Readonly<AboutPlayliteProps>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [appVersion, setAppVersion] = useState('3.0.0');

  useEffect(() => {
    // Busca a versão do app do backend Rust
    invoke<string>('get_app_version')
      .then(version => setAppVersion(version))
      .catch(error => {
        console.warn('Erro ao obter versão do app:', error);
        // Mantém o fallback
      });
  }, []);

  return (
    <div
      className={`bg-card overflow-hidden rounded-xl border transition-all ${className}`}
    >
      {/* Header - Sempre visível */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="hover:bg-accent/5 flex w-full items-center justify-between p-6 text-left transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg text-white shadow-lg">
            <img
              src="/app-icon.png"
              alt="Logo"
              className="shrink-0 object-contain"
            />
          </div>
          <div>
            <h3 className="text-lg leading-none font-semibold tracking-tight">
              Playlite
            </h3>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Gerenciador de biblioteca de jogos desktop com foco em uso{' '}
              <em>local-first</em>, privacidade e recomendações inteligentes.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-muted-foreground text-sm whitespace-nowrap">
            Versão {appVersion}
          </p>
          <ChevronDown
            size={20}
            className={`text-muted-foreground transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Conteúdo expandível */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-6 px-6 pb-6">
            {/* Stack Técnica */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Stack Técnica</h4>
              <div className="bg-accent/30 space-y-2 rounded-lg p-4 text-sm">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-muted-foreground">Framework:</span>
                  <TechLink name="Tauri" url="https://tauri.app" />
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-muted-foreground">Linguagens:</span>
                  <TechLink
                    name="Rust"
                    url="https://www.rust-lang.org"
                    description="backend"
                  />
                  <span className="text-muted-foreground">•</span>
                  <TechLink
                    name="TypeScript"
                    url="https://www.typescriptlang.org"
                    description="frontend"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-muted-foreground">
                    Biblioteca principal:
                  </span>
                  <TechLink
                    name="React"
                    url="https://react.dev"
                    description="frontend"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-muted-foreground">UI/UX:</span>
                  <TechLink name="Tailwind CSS" url="https://tailwindcss.com" />
                  <span className="text-muted-foreground">•</span>
                  <TechLink name="shadcn/ui" url="https://ui.shadcn.com" />
                  <span className="text-muted-foreground">•</span>
                  <TechLink name="Lucide Icons" url="https://lucide.dev" />
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-muted-foreground">Banco de dados:</span>
                  <TechLink name="SQLite" url="https://sqlite.org/index.html" />
                </div>
              </div>
            </div>

            {/* APIs Externas */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">
                APIs e Serviços Externos
              </h4>
              <div className="bg-accent/30 grid gap-2 rounded-lg p-4 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5 text-xs">
                    •
                  </span>
                  <p>Metadados de jogos:</p>
                  <div className="flex-1">
                    <TechLink name="RAWG" url="https://rawg.io/apidocs" />{' '}
                    <span className="text-muted-foreground mt-0.5 text-xs">
                      •
                    </span>{' '}
                    <TechLink
                      name="Steam Web API"
                      url="https://steamcommunity.com/dev"
                      description="Web + Store"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5 text-xs">
                    •
                  </span>
                  <p>Preços e promoções:</p>
                  <div className="flex-1">
                    <TechLink
                      name="IsThereAnyDeal"
                      url="https://isthereanydeal.com"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5 text-xs">
                    •
                  </span>
                  <p>Estatísticas públicas:</p>
                  <div className="flex-1">
                    <TechLink
                      name="SteamSpy"
                      url="https://steamspy.com/api.php"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5 text-xs">
                    •
                  </span>
                  <p>Jogos gratuitos:</p>
                  <div className="flex-1">
                    <TechLink
                      name="GamerPower"
                      url="https://www.gamerpower.com/api-read"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5 text-xs">
                    •
                  </span>
                  <p>Tradução de descrição:</p>
                  <div className="flex-1">
                    <TechLink
                      name="Gemini"
                      url="https://aistudio.google.com/"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dataset de Recomendações */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">
                Dataset de Recomendações
              </h4>
              <div className="bg-accent/30 rounded-lg p-4">
                <div className="space-y-2.5 text-sm">
                  <p className="text-muted-foreground leading-relaxed">
                    As recomendações são baseadas no dataset público{' '}
                    <span className="text-foreground font-semibold">
                      Game Recommendations on Steam
                    </span>{' '}
                    por Anton Kozyriev.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <TechLink
                      name="Ver no Kaggle"
                      url="https://www.kaggle.com/datasets/antonkozyriev/game-recommendations-on-steam"
                    />
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      Licença: CC0 Public Domain
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">2023</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Links e Licença */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <a
                  href="https://github.com/Alan-oliveir/game_manager"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <Github size={16} />
                  <span>GitHub</span>
                </a>
                <span className="text-muted-foreground">•</span>
                <a
                  href="https://github.com/Alan-oliveir/game_manager/blob/main/LICENSE"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Licença MIT
                </a>
              </div>
              <p className="text-muted-foreground text-xs">
                Desenvolvido por Alan de O. Gonçalves, 2025-2026.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
