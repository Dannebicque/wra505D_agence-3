// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@nuxt/ui', '@nuxt/eslint', '@nuxt/test-utils/module'],
  devtools: { enabled: true },
  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      // viewport-fit=cover : la page occupe tout l'écran (encoche comprise) ; les mises en page
      // gardent leur contenu dans la zone sûre (utilitaire `zone-sure` de main.css)
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      titleTemplate: '%s %separator %siteName',
      templateParams: { separator: '·', siteName: 'UniFolio' },
    },
  },
  css: ['~/assets/css/main.css'],
  fonts: {
    // Polices téléchargées au build et servies par l'application : aucune requête vers Google en production.
    // Pas de `global` : la famille est lue dans main.css (`--font-instrument`), ce qui produit aussi la
    // police de secours aux métriques ajustées (sans elle, le texte bouge à l'arrivée de la police).
    families: [{ name: 'Instrument Sans', weights: [400, 500, 600] }],
  },
  // Mise en page des espaces (une page peut toujours déclarer la sienne avec definePageMeta)
  routeRules: {
    '/etudiant': { appLayout: 'espace' },
    '/etudiant/**': { appLayout: 'espace' },
    '/enseignant': { appLayout: 'espace' },
    '/enseignant/**': { appLayout: 'espace' },
    '/admin': { appLayout: 'espace' },
    '/admin/**': { appLayout: 'espace' },
  },
  runtimeConfig: {
    public: {
      // Origine de l'API : vide = routes Nitro locales ; URL d'ApiPlatform via NUXT_PUBLIC_API_BASE
      apiBase: '',
    },
  },
  experimental: {
    // Fondu entre les pages (API View Transitions) ; Nuxt s'en passe si l'utilisateur a demandé
    // de réduire les animations, et les navigateurs sans l'API naviguent normalement
    viewTransition: true,
  },
  compatibilityDate: '2026-10-14',
  typescript: {
    // Les fichiers de test hors runtime Nuxt sont aussi couverts par `npm run typecheck`
    nodeTsConfig: {
      include: ['../playwright.config.ts', '../tests/e2e/**/*', '../tests/unit/**/*'],
    },
  },
  eslint: {
    // Le formatage est délégué à Prettier
    config: { stylistic: false },
  },
})
