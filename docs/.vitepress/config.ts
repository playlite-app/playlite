import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Playlite',
  description: 'Documentação do Playlite (Game Manager)',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Início', link: '/' },
      {
        text: 'Guia',
        items: [
          { text: 'Primeiros passos', link: '/guide/getting-started' },
          { text: 'Instalação', link: '/guide/installation' },
          { text: 'Funcionalidades', link: '/guide/features' },
          { text: 'Fluxos (how-to)', link: '/guide/flows/' },
          { text: 'Telas do app', link: '/guide/pages/' },
          { text: 'FAQ', link: '/guide/faq' },
        ],
      },
      {
        text: 'Dev',
        items: [
          { text: 'Quickstart', link: '/dev/quickstart' },
          { text: 'Arquitetura', link: '/dev/architecture' },
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
          text: 'Guia do usuário',
          items: [
            { text: 'Primeiros passos', link: '/guide/getting-started' },
            { text: 'Instalação', link: '/guide/installation' },
            { text: 'Funcionalidades', link: '/guide/features' },
            { text: 'FAQ', link: '/guide/faq' },
          ],
        },
        {
          text: 'Fluxos (how-to)',
          items: [
            { text: 'Visão geral', link: '/guide/flows/' },
            { text: 'Importar Steam', link: '/guide/flows/import-steam' },
            { text: 'Adicionar jogo', link: '/guide/flows/add-game' },
            { text: 'Favoritar jogo', link: '/guide/flows/favorite-game' },
            { text: 'Criar playlist', link: '/guide/flows/create-playlist' },
            {
              text: 'Adicionar na wishlist',
              link: '/guide/flows/add-to-wishlist',
            },
            { text: 'Backup e restore', link: '/guide/flows/backup-restore' },
          ],
        },
        {
          text: 'Telas do app',
          items: [
            { text: 'Visão geral', link: '/guide/pages/' },
            { text: 'Home', link: '/guide/pages/home' },
            { text: 'Libraries', link: '/guide/pages/libraries' },
            { text: 'Settings', link: '/guide/pages/settings' },
            { text: 'Wishlist', link: '/guide/pages/wishlist' },
            { text: 'Favorites', link: '/guide/pages/favorites' },
            { text: 'Playlist', link: '/guide/pages/playlist' },
            { text: 'Trending', link: '/guide/pages/trending' },
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
              text: 'Sistema de recomendação',
              link: '/dev/recommendation-system',
            },
          ],
        },
      ],
      // fallback
      '/': [
        {
          text: 'Docs',
          items: [
            { text: 'Início', link: '/' },
            { text: 'Primeiros passos', link: '/guide/getting-started' },
            { text: 'Instalação', link: '/guide/installation' },
            { text: 'Funcionalidades', link: '/guide/features' },
            { text: 'Fluxos (how-to)', link: '/guide/flows/' },
            { text: 'Telas do app', link: '/guide/pages/' },
            { text: 'FAQ', link: '/guide/faq' },
            { text: 'Quickstart (Dev)', link: '/dev/quickstart' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Alan-oliveir/game_manager' },
    ],
  },
});
