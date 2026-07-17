// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    'nuxt-auth-utils'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    databaseUrl: '', // NUXT_DATABASE_URL or set via DATABASE_URL in nitro (see server)
    session: {
      // NUXT_SESSION_PASSWORD (≥32). CI may inject a non-production value.
      password: '',
      cookie: {
        sameSite: 'lax'
      }
    }
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
