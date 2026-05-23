import { defineConfig } from 'vitepress'; // https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Playlite',
  description: 'Documentação do Playlite (Game Manager)',
  lang: 'pt-BR',
  head: [['link', { rel: 'icon', href: '/icon.png' }]],
  locales: {
    'pt-BR': {
      label: 'Português',
      lang: 'pt-BR',
      link: '/pt-BR/',
      title: 'Playlite',
      description: 'Documentação do Playlite (Game Manager)',
      themeConfig: {
        nav: [
          { text: 'Início', link: '/pt-BR/' },
          {
            text: 'Guia do Usuário',
            items: [
              { text: 'Instalação', link: '/pt-BR/guide/installation' },
              {
                text: 'Primeiros passos',
                link: '/pt-BR/guide/getting-started',
              },
              { text: 'Funcionalidades', link: '/pt-BR/guide/features' },
              { text: 'Ajuda e FAQ', link: '/pt-BR/guide/help' },
              { text: 'Sobre o Playlite', link: '/pt-BR/guide/about' },
              { text: 'Telas do app', link: '/pt-BR/guide/pages/home' },
            ],
          },
          {
            text: 'Desenvolvimento',
            items: [
              { text: 'Quickstart', link: '/pt-BR/dev/quickstart' },
              { text: 'Arquitetura', link: '/pt-BR/dev/architecture' },
              {
                text: 'Sistema de Recomendação',
                link: '/pt-BR/dev/recommendation-system',
              },
              {
                text: 'Filtragem Colaborativa Offline',
                link: '/pt-BR/dev/collaborative-filtering',
              },
              {
                text: 'Desenvolvimento Assistido por IA',
                link: '/pt-BR/dev/ai-assisted-development',
              },
            ],
          },
          {
            text: 'Projeto',
            items: [
              {
                text: 'Documentação no GitHub',
                link: '/pt-BR/dev/project-docs',
              },
            ],
          },
          {
            text: 'API Reference',
            items: [
              {
                text: 'Backend (Rust Docs)',
                link: '/api/rust/game_manager_lib/index.html',
                target: '_blank',
              },
              {
                text: 'Frontend (TypeDoc)',
                link: '/api/frontend/index.html',
                target: '_blank',
              },
            ],
          },
          {
            text: 'Releases',
            link: 'https://github.com/Alan-oliveir/game_manager/releases',
          },
        ],
        sidebar: {
          '/pt-BR/guide/': [
            {
              text: 'Começando',
              items: [
                { text: 'Instalação', link: '/pt-BR/guide/installation' },
                {
                  text: 'Primeiros passos',
                  link: '/pt-BR/guide/getting-started',
                },
                { text: 'Funcionalidades', link: '/pt-BR/guide/features' },
                { text: 'Ajuda', link: '/pt-BR/guide/help' },
                { text: 'Sobre o Playlite', link: '/pt-BR/guide/about' },
              ],
            },
            {
              text: 'Interface do App',
              items: [
                { text: 'Home e Trending', link: '/pt-BR/guide/pages/home' },
                {
                  text: 'Sua Biblioteca',
                  link: '/pt-BR/guide/pages/libraries',
                },
                {
                  text: 'Detalhes do Jogo',
                  link: '/pt-BR/guide/pages/details',
                },
                {
                  text: 'Listas (Playlist/Wishlist)',
                  link: '/pt-BR/guide/pages/lists',
                },
                { text: 'Configurações', link: '/pt-BR/guide/pages/settings' },
              ],
            },
          ],
          '/pt-BR/dev/': [
            {
              text: 'Desenvolvimento',
              items: [
                { text: 'Quickstart', link: '/pt-BR/dev/quickstart' },
                { text: 'Arquitetura', link: '/pt-BR/dev/architecture' },
                {
                  text: 'Sistema de Recomendação',
                  link: '/pt-BR/dev/recommendation-system',
                },
                {
                  text: 'Filtragem Colaborativa Offline',
                  link: '/pt-BR/dev/collaborative-filtering',
                },
                {
                  text: 'Desenvolvimento Assistido por IA',
                  link: '/pt-BR/dev/ai-assisted-development',
                },
              ],
            },
            {
              text: 'Projeto',
              items: [
                {
                  text: 'Documentação no GitHub',
                  link: '/pt-BR/dev/project-docs',
                },
              ],
            },
          ],
        },
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      title: 'Playlite',
      description: 'Playlite documentation (Game Manager)',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          {
            text: 'User Guide',
            items: [
              { text: 'Installation', link: '/en/guide/installation' },
              { text: 'Getting Started', link: '/en/guide/getting-started' },
              { text: 'Features', link: '/en/guide/features' },
              { text: 'Help and FAQ', link: '/en/guide/help' },
              { text: 'About Playlite', link: '/en/guide/about' },
              { text: 'App Screens', link: '/en/guide/pages/home' },
            ],
          },
          {
            text: 'Development',
            items: [
              { text: 'Quickstart', link: '/en/dev/quickstart' },
              { text: 'Architecture', link: '/en/dev/architecture' },
              {
                text: 'Recommendation System',
                link: '/en/dev/recommendation-system',
              },
              {
                text: 'Offline Collaborative Filtering',
                link: '/en/dev/collaborative-filtering',
              },
              {
                text: 'AI-Assisted Development',
                link: '/en/dev/ai-assisted-development',
              },
            ],
          },
          {
            text: 'Project',
            items: [
              { text: 'Project Documentation', link: '/en/dev/project-docs' },
            ],
          },
          {
            text: 'API Reference',
            items: [
              {
                text: 'Backend (Rust Docs)',
                link: '/api/rust/game_manager_lib/index.html',
                target: '_blank',
              },
              {
                text: 'Frontend (TypeDoc)',
                link: '/api/frontend/index.html',
                target: '_blank',
              },
            ],
          },
          {
            text: 'Releases',
            link: 'https://github.com/Alan-oliveir/game_manager/releases',
          },
        ],
        sidebar: {
          '/en/guide/': [
            {
              text: 'Getting Started',
              items: [
                { text: 'Installation', link: '/en/guide/installation' },
                { text: 'Getting Started', link: '/en/guide/getting-started' },
                { text: 'Features', link: '/en/guide/features' },
                { text: 'Help', link: '/en/guide/help' },
                { text: 'About Playlite', link: '/en/guide/about' },
              ],
            },
            {
              text: 'App Interface',
              items: [
                { text: 'Home and Trending', link: '/en/guide/pages/home' },
                { text: 'Your Library', link: '/en/guide/pages/libraries' },
                { text: 'Game Details', link: '/en/guide/pages/details' },
                {
                  text: 'Lists (Playlist/Wishlist)',
                  link: '/en/guide/pages/lists',
                },
                { text: 'Settings', link: '/en/guide/pages/settings' },
              ],
            },
          ],
          '/en/dev/': [
            {
              text: 'Development',
              items: [
                { text: 'Quickstart', link: '/en/dev/quickstart' },
                { text: 'Architecture', link: '/en/dev/architecture' },
                {
                  text: 'Recommendation System',
                  link: '/en/dev/recommendation-system',
                },
                {
                  text: 'Offline Collaborative Filtering',
                  link: '/en/dev/collaborative-filtering',
                },
                {
                  text: 'AI-Assisted Development',
                  link: '/en/dev/ai-assisted-development',
                },
              ],
            },
            {
              text: 'Project',
              items: [
                { text: 'Project Documentation', link: '/en/dev/project-docs' },
              ],
            },
          ],
        },
      },
    },
  },
  themeConfig: {
    nav: [
      { text: 'Início', link: '/pt-BR/' },
      {
        text: 'Guia do Usuário',
        items: [
          { text: 'Instalação', link: '/pt-BR/guide/installation' },
          {
            text: 'Primeiros passos',
            link: '/pt-BR/guide/getting-started',
          },
          { text: 'Funcionalidades', link: '/pt-BR/guide/features' },
          { text: 'Ajuda e FAQ', link: '/pt-BR/guide/help' },
          { text: 'Sobre o Playlite', link: '/pt-BR/guide/about' },
          { text: 'Telas do app', link: '/pt-BR/guide/pages/home' },
        ],
      },
      {
        text: 'Desenvolvimento',
        items: [
          { text: 'Quickstart', link: '/pt-BR/dev/quickstart' },
          { text: 'Arquitetura', link: '/pt-BR/dev/architecture' },
          {
            text: 'Sistema de Recomendação',
            link: '/pt-BR/dev/recommendation-system',
          },
          {
            text: 'Filtragem Colaborativa Offline',
            link: '/pt-BR/dev/collaborative-filtering',
          },
          {
            text: 'Desenvolvimento Assistido por IA',
            link: '/pt-BR/dev/ai-assisted-development',
          },
        ],
      },
      {
        text: 'Projeto',
        items: [
          {
            text: 'Documentação no GitHub',
            link: '/pt-BR/dev/project-docs',
          },
        ],
      },
      {
        text: 'API Reference',
        items: [
          {
            text: 'Backend (Rust Docs)',
            link: '/api/rust/game_manager_lib/index.html',
            target: '_blank',
          },
          {
            text: 'Frontend (TypeDoc)',
            link: '/api/frontend/index.html',
            target: '_blank',
          },
        ],
      },
      {
        text: 'Releases',
        link: 'https://github.com/Alan-oliveir/game_manager/releases',
      },
    ],
    sidebar: {
      '/pt-BR/guide/': [
        {
          text: 'Começando',
          items: [
            { text: 'Instalação', link: '/pt-BR/guide/installation' },
            {
              text: 'Primeiros passos',
              link: '/pt-BR/guide/getting-started',
            },
            { text: 'Funcionalidades', link: '/pt-BR/guide/features' },
            { text: 'Ajuda', link: '/pt-BR/guide/help' },
            { text: 'Sobre o Playlite', link: '/pt-BR/guide/about' },
          ],
        },
        {
          text: 'Interface do App',
          items: [
            { text: 'Home e Trending', link: '/pt-BR/guide/pages/home' },
            { text: 'Sua Biblioteca', link: '/pt-BR/guide/pages/libraries' },
            { text: 'Detalhes do Jogo', link: '/pt-BR/guide/pages/details' },
            {
              text: 'Listas (Playlist/Wishlist)',
              link: '/pt-BR/guide/pages/lists',
            },
            { text: 'Configurações', link: '/pt-BR/guide/pages/settings' },
          ],
        },
      ],
      '/pt-BR/dev/': [
        {
          text: 'Desenvolvimento',
          items: [
            { text: 'Quickstart', link: '/pt-BR/dev/quickstart' },
            { text: 'Arquitetura', link: '/pt-BR/dev/architecture' },
            {
              text: 'Sistema de Recomendação',
              link: '/pt-BR/dev/recommendation-system',
            },
            {
              text: 'Filtragem Colaborativa Offline',
              link: '/pt-BR/dev/collaborative-filtering',
            },
            {
              text: 'Desenvolvimento Assistido por IA',
              link: '/pt-BR/dev/ai-assisted-development',
            },
          ],
        },
        {
          text: 'Projeto',
          items: [
            {
              text: 'Documentação no GitHub',
              link: '/pt-BR/dev/project-docs',
            },
          ],
        },
      ],
    },
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/Alan-oliveir/game_manager',
      },
    ],
  },
});
