import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig({
  test: {
    // Aucun test unitaire tant qu'il n'y a pas de logique métier
    passWithNoTests: true,
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['tests/nuxt/**/*.{test,spec}.ts'],
          environment: 'nuxt',
          environmentOptions: { nuxt: { rootDir: fileURLToPath(new URL('.', import.meta.url)) } },
          // Le cache disque de Vitest 5 mémorise un chemin erroné pour l'entrée virtuelle
          // de @nuxt/test-utils : le second lancement échoue (voir docs/DECISIONS.md)
          fsModuleCache: false,
          // Le démarrage de l'environnement Nuxt (hook beforeAll de @nuxt/test-utils) dépasse
          // parfois les 10 s par défaut sous Windows (voir docs/DECISIONS.md)
          hookTimeout: 60_000,
        },
      }),
    ],
  },
})
