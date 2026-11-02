# Décisions techniques

Format : date, décision, alternatives écartées, raison.

## 2026-10-14 — Stack front : Nuxt 4, TypeScript, Pinia, Nuxt UI

- **Décision** : Nuxt 4 (TypeScript strict par défaut), Pinia (`@pinia/nuxt`) pour l'état, Nuxt UI 4 (Reka UI + Tailwind 4) pour les composants.
- **Alternatives écartées** : Vue seul (stack imposée : Vue ou Nuxt ; Nuxt apporte le SSR utile au portfolio public et Nitro pour simuler l'API) ; Tailwind seul ou CSS maison (accessibilité des composants riches à notre charge).
- **Raison** : composants accessibles prêts à l'emploi (modales, onglets, formulaires), mode sombre intégré (C-02), gain de temps sur le socle.

## 2026-10-14 — npm et Node 24

- **Décision** : npm ; Node 24 fixé par `.nvmrc` (lu aussi par la CI) et `engines` (`^24.15.0`, minimum exigé par Nuxt 4.6).
- **Alternatives écartées** : pnpm, yarn.
- **Raison** : déjà installé sur tous les postes, aucune configuration supplémentaire.

## 2026-10-14 — Outillage qualité

- **Décision** : `@nuxt/eslint` (règles stylistiques désactivées) + Prettier, avec `eslint-config-prettier` ; Vitest avec deux projets (`unit` en environnement Node, `nuxt` avec `@nuxt/test-utils`) ; Playwright pour l'E2E, avec `@axe-core/playwright` pour l'accessibilité (WCAG 2.2 A/AA, modes clair et sombre), sur un profil ordinateur et un profil mobile.
- **Alternatives écartées** : Cypress (plus lourd en CI, moins de navigateurs) ; Biome (moins bien intégré à Vue/Nuxt) ; ESLint Stylistic seul.
- **Raison** : outils officiels de l'écosystème Nuxt ; l'accessibilité est une exigence forte du client, elle est vérifiée automatiquement à chaque PR.

## 2026-10-14 — Cache disque de Vitest désactivé pour le projet `nuxt`

- **Décision** : `fsModuleCache: false` dans le projet Vitest `nuxt`.
- **Alternatives écartées** : vider le cache avant chaque lancement (`vitest --clearCache`).
- **Raison** : avec Vitest 5 et `@nuxt/test-utils` 4.3, le cache disque mémorise un chemin erroné pour l'entrée virtuelle de l'application ; dès le second lancement, `Failed to resolve import … nuxt-vitest-app-entry.js`. Invisible en CI (cache vide à chaque run). À retirer quand le correctif sera publié en amont.

## 2026-10-14 — Icônes Lucide embarquées

- **Décision** : collection `@iconify-json/lucide` installée (dépendance de développement), utilisée par Nuxt UI.
- **Alternatives écartées** : chargement des icônes à la demande depuis l'API publique Iconify (comportement par défaut sans collection locale).
- **Raison** : aucune requête vers un service tiers en production, icônes disponibles hors ligne et plus rapides.

## 2026-10-14 — CI GitHub Actions

- **Décision** : un workflow `ci.yml` sur chaque PR et chaque push sur `develop`/`main` : `npm ci`, lint, format, typage, tests, build, E2E (Chromium). Rapport Playwright publié en cas d'échec.
- **Raison** : les portes de validation d'`AGENTS.md` sont vérifiées de la même façon pour tous, quel que soit le poste ou l'assistant IA.

## 2026-10-14 — Pas de Docker pour le front

- **Décision** : pas de conteneur pour le développement du front ; Docker sera introduit avec l'API ApiPlatform (Sprint 4).
- **Alternatives écartées** : environnement de développement Nuxt sous Docker.
- **Raison** : sous Windows, montage de fichiers lent et rechargement à chaud peu fiable. L'homogénéité est assurée par `.nvmrc`, `package-lock.json` (`npm ci`), `.gitattributes` et la CI.

## 2026-10-14 — Fins de ligne LF

- **Décision** : `.gitattributes` impose LF dans le dépôt.
- **Raison** : postes Windows et autres ; évite les diffs parasites.

## 2026-10-14 — Dépendances de l'éditeur Nuxt UI non déclarées

- **Décision** : les paquets `@tiptap/*` (pairs du composant éditeur de Nuxt UI) ne sont pas déclarés dans `package.json` ; npm les installe automatiquement comme dépendances pairs.
- **Raison** : ne pas encombrer `package.json` de 17 paquets inutilisés. À déclarer si l'éditeur riche est utilisé un jour.

## 2026-10-14 — Vulnérabilités `npm audit` acceptées

- **Décision** : vulnérabilités signalées par `npm audit` acceptées en l'état, sans `overrides` : `node-forge` (via `listhen`, serveur de dev), `braces` (via `nitropack`, outillage de build), `esbuild` (via `@nuxt/fonts`, serveur de dev sous Windows).
- **Alternatives écartées** : `npm audit fix --force` (rétrograderait Nuxt en 4.1) ; `overrides` (aucune version corrigée publiée pour `node-forge` et `braces`).
- **Raison** : outils de développement et de build uniquement, rien n'est livré au navigateur. À réévaluer à chaque mise à jour de Nuxt.
