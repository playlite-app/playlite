import { ChevronDown, ExternalLink } from 'lucide-react';
import { useState } from 'react';

import { Github } from '@/icons';

const APP_VERSION = '1.0.0';

interface TechLinkProps {
  name: string;
  url: string;
  description?: string;
}

function TechLink({ name, url, description }: TechLinkProps) {
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

export function AboutPlaylite({ className = '' }: AboutPlayliteProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-purple-600 text-white shadow-lg">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
            >
              <path d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5z" />
              <path d="m9 12 2 2 4-4" />
              <path d="M8 8h8" />
              <path d="M8 16h5" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg leading-none font-semibold tracking-tight">
              Playlite
            </h3>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Versão {APP_VERSION}
            </p>
          </div>
        </div>
        <ChevronDown
          size={20}
          className={`text-muted-foreground transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
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
            {/* Descrição */}
            <div className="border-l-2 border-blue-500/50 pl-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                O{' '}
                <span className="text-foreground font-semibold">Playlite</span>{' '}
                é um gerenciador de biblioteca de jogos desktop com foco em uso
                local (<em>local-first</em>), privacidade e recomendações
                inteligentes.
              </p>
            </div>

            {/* Stack Técnica */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Stack Técnica</h4>
              <div className="bg-accent/30 space-y-2 rounded-lg p-4 text-sm">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-muted-foreground">Framework:</span>
                  <TechLink name="Tauri" url="https://tauri.app" />
                  <span className="text-muted-foreground">•</span>
                  <TechLink
                    name="Rust"
                    url="https://www.rust-lang.org"
                    description="Backend"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-muted-foreground">Frontend:</span>
                  <TechLink name="React" url="https://react.dev" />
                  <span className="text-muted-foreground">•</span>
                  <TechLink
                    name="TypeScript"
                    url="https://www.typescriptlang.org"
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
                  <div className="flex-1">
                    <TechLink name="RAWG" url="https://rawg.io/apidocs" /> -
                    Metadados de jogos
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5 text-xs">
                    •
                  </span>
                  <div className="flex-1">
                    <TechLink
                      name="IsThereAnyDeal"
                      url="https://isthereanydeal.com"
                    />{' '}
                    - Preços e promoções
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5 text-xs">
                    •
                  </span>
                  <div className="flex-1">
                    <TechLink
                      name="Steam Web API"
                      url="https://steamcommunity.com/dev"
                    />{' '}
                    - Biblioteca pessoal
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5 text-xs">
                    •
                  </span>
                  <div className="flex-1">
                    <TechLink
                      name="SteamSpy"
                      url="https://steamspy.com/api.php"
                    />{' '}
                    - Estatísticas públicas
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5 text-xs">
                    •
                  </span>
                  <div className="flex-1">
                    <TechLink
                      name="GamerPower"
                      url="https://www.gamerpower.com/api-read"
                    />{' '}
                    - Jogos gratuitos
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
                Desenvolvido por Alan de O. Gonçalves, 2026.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
