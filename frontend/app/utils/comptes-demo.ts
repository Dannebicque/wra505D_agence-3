// Module pur (sans dépendance Nuxt) : testable dans le projet Vitest `unit`.

/**
 * Comptes de démonstration, un par espace : ceux des fixtures de l'API et de la doublure Nitro
 * (`server/data/comptes.ts`), tous avec le mot de passe `test`. Ils n'existent pas sur une base
 * réelle : la connexion y répondrait « identifiant ou mot de passe incorrect ».
 */
export const COMPTES_DEMO = [
  {
    username: 'etudiant',
    espace: 'Espace étudiant',
    description: 'Déposer des traces, composer un portfolio',
    icon: 'i-lucide-graduation-cap',
  },
  {
    username: 'enseignant',
    espace: 'Espace enseignant',
    description: 'Évaluer les traces, suivre les étudiants',
    icon: 'i-lucide-presentation',
  },
  {
    username: 'admin',
    espace: 'Administration',
    description: 'Gestion de la structure',
    icon: 'i-lucide-shield',
  },
] as const
