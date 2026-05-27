// https://nuxt.com/docs/api/configuration/nuxt-config
const striptagsEntry = new URL('./node_modules/striptags/src/striptags.js', import.meta.url).pathname

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/content',
    '@vueuse/nuxt'
  ],

  colorMode: {
    preference: 'light'
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

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

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

  build: {
    transpile: ['@unovis/vue', '@unovis/ts']
  },

  routeRules: {
    '/docs/**': { prerender: true }
  },

  compatibilityDate: '2024-07-11',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
