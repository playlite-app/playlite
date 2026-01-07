import {defineConfig} from 'vitepress'; // https://vitepress.dev/reference/site-config

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
          { text: 'Telas do app', link: '/guide/pages/home' },
          { text: 'FAQ', link: '/guide/faq' },
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
        ],
      },
      {
        text: 'Sobre o Projeto',
        items: [
          {
            text: 'Documentação Oficial (GitHub)',
            link: '/dev/project-docs',
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
            { text: 'Backup e Restore', link: '/guide/backup-restore' },
            { text: 'FAQ', link: '/guide/faq' },
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
          ],
        },
        {
          text: 'Sobre o Projeto',
          items: [
            {
              text: 'Documentação Oficial (GitHub)',
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
