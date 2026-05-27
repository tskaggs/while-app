// https://nuxt.com/docs/api/configuration/nuxt-config
const striptagsEntry = new URL('./node_modules/striptags/src/striptags.js', import.meta.url).pathname

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/content',
    '@vueuse/nuxt'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    storage: 'localStorage',
    storageKey: 'while-color-mode'
  },

  content: {
    build: {
      markdown: {
        toc: {
          depth: 2
        }
      }
    }
  },

  build: {
    transpile: ['@unovis/vue', '@unovis/ts']
  },

  routeRules: {
    '/docs/**': { prerender: true }
  },

  icon: {
    serverBundle: {
      collections: ['iconoir', 'simple-icons']
    }
  },

  compatibilityDate: '2024-07-11',

  vite: {
    resolve: {
      alias: [
        {
          find: /^striptags$/,
          replacement: striptagsEntry
        }
      ]
    },
    optimizeDeps: {
      include: [
        '@unovis/ts',
        '@unovis/vue',
        'striptags',
        'zod'
      ],
      needsInterop: ['striptags']
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
