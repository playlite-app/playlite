import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Playlite',
  description: 'Documentação do Playlite (Game Manager)',
  head: [['link', { rel: 'icon', href: '/icon.png' }]], // Ajuste o nome do ícone se necessário

  themeConfig: {
    nav: [
      { text: 'Início', link: '/' },
      {
        text: 'Guia do Usuário',
        items: [
          { text: 'Instalação', link: '/guide/installation' },
          { text: 'Primeiros passos', link: '/guide/getting-started' },
          { text: 'Funcionalidades', link: '/guide/features' },
          { text: 'Ajuda e FAQ', link: '/guide/help' },
          { text: 'Sobre o Playlite', link: '/guide/about' },
          { text: 'Telas do app', link: '/guide/pages/home' },
        ],
      },
      {
        text: 'Desenvolvimento',
        items: [
          { text: 'Quickstart', link: '/dev/quickstart' },
          { text: 'Arquitetura', link: '/dev/architecture' },
          {
            text: 'Sistema de Recomendação',
            link: '/dev/recommendation-system',
          },
          {
            text: 'Filtragem Colaborativa Offline',
            link: '/dev/filtering-collaborative',
          },
          {
            text: 'Desenvolvimento Assistido por IA',
            link: '/dev/ai-assisted-development',
          },
        ],
      },
      {
        text: 'Projeto',
        items: [
          {
            text: 'Documentação no GitHub',
            link: '/dev/project-docs',
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
      '/guide/': [
        {
          text: 'Começando',
          items: [
            { text: 'Instalação', link: '/guide/installation' },
            { text: 'Primeiros passos', link: '/guide/getting-started' },
            { text: 'Funcionalidades', link: '/guide/features' },
            { text: 'Ajuda', link: '/guide/help' },
            { text: 'Sobre o Playlite', link: '/guide/about' },
          ],
        },
        {
          text: 'Interface do App',
          items: [
            { text: 'Home e Trending', link: '/guide/pages/home' },
            { text: 'Sua Biblioteca', link: '/guide/pages/libraries' },
            { text: 'Listas (Playlist/Wishlist)', link: '/guide/pages/lists' },
            { text: 'Configurações', link: '/guide/pages/settings' },
          ],
        },
      ],

      '/dev/': [
        {
          text: 'Desenvolvimento',
          items: [
            { text: 'Quickstart', link: '/dev/quickstart' },
            { text: 'Arquitetura', link: '/dev/architecture' },
            {
              text: 'Sistema de Recomendação',
              link: '/dev/recommendation-system',
            },
            {
              text: 'Filtragem Colaborativa Offline',
              link: '/dev/filtering-collaborative',
            },
            {
              text: 'Desenvolvimento Assistido por IA',
              link: '/dev/ai-assisted-development',
            },
          ],
        },
        {
          text: 'Projeto',
          items: [
            {
              text: 'Documentação no GitHub',
              link: '/dev/project-docs',
            },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Alan-oliveir/game_manager' },
    ],
  },
});
