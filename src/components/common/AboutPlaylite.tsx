import { invoke } from '@tauri-apps/api/core';
import i18n from 'i18next';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('settings');
  const [isExpanded, setIsExpanded] = useState(false);
  const [appVersion, setAppVersion] = useState('4.0.0');

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
              {t('about_title')}
            </h3>
            <p className="text-muted-foreground mt-1.5 text-sm">
              {t('about_description_prefix')}
              <em> {t('about_description_emphasis')}</em>
              {t('about_description_suffix')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-muted-foreground text-sm whitespace-nowrap">
            {t('about_version', { version: appVersion })}
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
            {/* Idioma */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">{t('about_language')}</h4>
              <div className="bg-accent/30 text-muted-foreground flex items-center justify-between rounded-lg p-4 text-sm">
                {t('about_select_language')}
                <select
                  className={
                    'bg-background ml-2 rounded-md border px-2 py-1 text-sm focus:ring-1 focus:outline-none'
                  }
                  value={i18n.language}
                  onChange={e => {
                    const value = e.target.value as 'pt-BR' | 'en';
                    void i18n.changeLanguage(value);
                  }}
                >
                  <option value="pt-BR">{t('about_language_pt')}</option>
                  <option value="en">{t('about_language_en')}</option>
                </select>
              </div>
            </div>

            {/* Stack Técnica */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">{t('about_tech_stack')}</h4>
              <div className="bg-accent/30 space-y-2 rounded-lg p-4 text-sm">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-muted-foreground">
                    {t('about_label_framework')}
                  </span>
                  <TechLink name="Tauri" url="https://tauri.app" />
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-muted-foreground">
                    {t('about_label_languages')}
                  </span>
                  <TechLink
                    name="Rust"
                    url="https://www.rust-lang.org"
                    description={t('about_desc_backend')}
                  />
                  <span className="text-muted-foreground">•</span>
                  <TechLink
                    name="TypeScript"
                    url="https://www.typescriptlang.org"
                    description={t('about_desc_frontend')}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-muted-foreground">
                    {t('about_label_main_library')}
                  </span>
                  <TechLink
                    name="React"
                    url="https://react.dev"
                    description={t('about_desc_frontend')}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-muted-foreground">
                    {t('about_label_uiux')}
                  </span>
                  <TechLink name="Tailwind CSS" url="https://tailwindcss.com" />
                  <span className="text-muted-foreground">•</span>
                  <TechLink name="shadcn/ui" url="https://ui.shadcn.com" />
                  <span className="text-muted-foreground">•</span>
                  <TechLink name="Lucide Icons" url="https://lucide.dev" />
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-muted-foreground">
                    {t('about_label_database')}
                  </span>
                  <TechLink name="SQLite" url="https://sqlite.org/index.html" />
                </div>
              </div>
            </div>

            {/* APIs Externas */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">
                {t('about_apis_services')}
              </h4>
              <div className="bg-accent/30 text-muted-foreground grid gap-2 rounded-lg p-4 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5 text-xs">
                    •
                  </span>
                  <p>{t('about_game_metadata')}</p>
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
                  <p>{t('about_prices_promotions')}</p>
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
                  <p>{t('about_public_stats')}</p>
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
                  <p>{t('about_free_games')}</p>
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
                  <p>{t('about_search_discover_games')}</p>
                  <div className="flex-1">
                    <TechLink name="GameBrain" url="https://gamebrain.co/" />
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5 text-xs">
                    •
                  </span>
                  <p>{t('about_description_translation')}</p>
                  <div className="flex-1">
                    <TechLink
                      name="Gemini"
                      url="https://aistudio.google.com/"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5 text-xs">
                    •
                  </span>
                  <p>{t('about_technical_data_games')}</p>
                  <div className="flex-1">
                    <TechLink
                      name="PCGamingWiki"
                      url="https://www.pcgamingwiki.com/wiki/Home"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dataset de Recomendações */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">
                {t('about_recommendation_dataset')}
              </h4>
              <div className="bg-accent/30 rounded-lg p-4">
                <div className="space-y-2.5 text-sm">
                  <p className="text-muted-foreground leading-relaxed">
                    {t('about_recommendation_prefix')}
                    <span className="text-foreground font-semibold">
                      {t('about_recommendation_dataset_name')}
                    </span>
                    {t('about_recommendation_suffix')}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <TechLink
                      name={t('about_view_on_kaggle')}
                      url="https://www.kaggle.com/datasets/antonkozyriev/game-recommendations-on-steam"
                    />
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      {t('about_license_cc0')}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      {t('about_year')}
                    </span>
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
                  <span>{t('about_github')}</span>
                </a>
                <span className="text-muted-foreground">•</span>
                <a
                  href="https://github.com/Alan-oliveir/game_manager/blob/main/LICENSE"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('about_license_mit')}
                </a>
                <span className="text-muted-foreground">•</span>
                <a
                  href="https://playlite.vercel.app/en/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('about_docs_link')}
                </a>
              </div>
              <p className="text-muted-foreground text-xs">
                {t('about_developed_by')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
