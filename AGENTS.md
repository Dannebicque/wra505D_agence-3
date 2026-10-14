# AGENTS.md — UniFolio (WRA505, agence 3)

Règles communes à **tous les assistants IA de l'équipe** (Claude Code, Codex, Gemini…). `CLAUDE.md` et `GEMINI.md` ne font qu'importer ce fichier : **modifier uniquement `AGENTS.md`**. « L'utilisateur » désigne le membre de l'équipe qui pilote la session.

## 1. Contexte du projet

Refonte de **UniFolio**, l'outil de portfolio de compétences d'un IUT (approche par compétences, référentiel APC). Le client veut une version **moderne, responsive et accessible** : les étudiants **déposent des traces**, composent un **portfolio public** et sont **évalués par l'équipe enseignante**. La base fonctionnelle reste proche de l'ancienne version, avec des corrections et de nouvelles fonctionnalités.

- **Stack** : Nuxt 4 (Vue 3) + TypeScript strict + Pinia + Nuxt UI (Reka UI + Tailwind), npm, Node 24. Tests : Vitest (unitaires et intégration, via `@nuxt/test-utils`) et Playwright (E2E). Lint/format : `@nuxt/eslint` + Prettier. CI : GitHub Actions.
- **API en deux temps** : d'abord des routes **Nitro** (`server/`) avec des données factices, puis une **vraie API ApiPlatform**. Les composants et stores ne parlent jamais directement à la source : tout passe par une couche d'accès (`app/services/`) pour que la bascule ne touche qu'elle. Les réponses Nitro imitent le format ApiPlatform (JSON-LD, IRIs, collections Hydra).
- **Dépôt** : `origin` = `https://github.com/Dannebicque/wra505D_agence-3` (privé, géré par le QA). Équipe : Enzo, Mathéo, Solène ; chacun travaille avec son propre compte GitHub.
- **Référence métier en lecture seule** : l'ancienne version `https://github.com/CyndelHerolt/UniFolio` (Symfony 8 / Twig / Doctrine), à cloner à côté du dépôt dans `../unifolio_old`. **Ne jamais la modifier, y committer ni y pousser.** On la lit pour comprendre le métier et repérer les bugs à corriger.
- **Périmètre et planning** : [`docs/FONCTIONNALITES.md`](docs/FONCTIONNALITES.md) (liste de référence, identifiants `E-`/`P-`/`C-` et statuts) et [`docs/ROADMAP.md`](docs/ROADMAP.md) (sprints). **Lire la fonctionnalité concernée avant toute tâche** ; ne jamais implémenter une fonctionnalité « Retirée », ni une « À discuter » / « À questionner » sans décision du client reportée dans le fichier.
- **Acteurs** : le client ne parle qu'au **PO, Mathéo** ; le **QA** (le client lui-même) valide **toutes les PR** et peut aider si on lui explique précisément le problème. Le client est très exigeant sur l'**accessibilité, l'UX, la qualité du code et la performance**.
- **Évaluation continue** : qualité du code et tests, documentation et journal IA (`AI_PROMPT_BOOK.md`), collaboration Git (issues, PR), gestion de projet, pitches et présentation finale.

### Domaine métier (repris de `../unifolio_old/src/Entity`)

- **Users** : `ROLE_ETUDIANT`, `ROLE_ENSEIGNANT`, `ROLE_ADMIN`, liés à un `Etudiant` ou un `Enseignant`. Utilisateurs et structure (départements, diplômes, semestres, groupes) synchronisés depuis l'intranet de l'IUT.
- **Référentiel APC** : `Referentiel` → `Competence` (libellé, nom court, couleur, UE) → `Niveau` → `ApprentissageCritique` ; plus `Parcours`, `Diplome`, `Semestre`, `Annee`, `AnneeUniversitaire`.
- **Bibliotheque** : une par étudiant et par année ; contient ses traces.
- **Trace** : titre, description, contexte, légende, dates (création, modification, réalisation), type **image / pdf / vidéo / lien** (liste extensible), contenu, et déclaration de l'usage de l'IA (conception et réalisation, défaut « non renseigné »).
- **Portfolio** : intitulé, description, bannière, visibilité publique/privée, visibilité recruteurs, année, CV. Composé de **pages** ordonnées, chacune regroupant des **traces** ordonnées.
- **Validation** (évaluation d'une trace pour un niveau de compétence) : `0` en attente, `1` non acquis, `2` en cours d'acquisition, `3` acquis.
- **Commentaire** (enseignant, sur trace ou portfolio, avec visibilité et réponses), **Notification** (sur validation ou commentaire, lue/non lue), **Cv** (expériences, formations, langues, compétences, réseaux).

### Arborescence cible (Nuxt 4)

```
app/
  pages/        routes (kebab-case) — espaces /etudiant, /enseignant, /admin, portfolio public
  components/   composants Vue (PascalCase), regroupés par domaine (trace/, portfolio/…)
  composables/  logique réutilisable (useXxx)
  stores/       stores Pinia (un par domaine : trace, portfolio, auth…)
  services/     couche d'accès aux données (seul endroit qui appelle l'API)
  middleware/   garde des routes par rôle
shared/types/   types du domaine, partagés entre app/ et server/
server/api/     routes Nitro (phase 1) ; server/data/ pour les données factices
tests/          unit/, nuxt/ (intégration), e2e/ (Playwright)
docs/           FONCTIONNALITES.md, ROADMAP.md, DECISIONS.md
```

## 2. Commandes

Node 24 (`.nvmrc`). Après un `git pull` qui modifie `package-lock.json` : `npm ci`.

| Action | Commande |
|---|---|
| Installer | `npm ci` (puis `npx playwright install chromium` une fois, pour l'E2E) |
| Lancer (dev, `localhost:3000`) | `npm run dev` |
| Builder / prévisualiser le build | `npm run build` / `npm run preview` |
| Linter / corriger | `npm run lint` / `npm run lint:fix` |
| Formater / vérifier le format | `npm run format` / `npm run format:check` |
| Typage | `npm run typecheck` |
| Tests unitaires + intégration (Vitest) | `npm run test` ; en continu : `npm run test:watch` |
| Un fichier / un test Vitest | `npx vitest run tests/nuxt/index.test.ts` / `npx vitest run -t "affiche le titre"` |
| Un seul projet Vitest | `npx vitest run --project unit` (ou `nuxt`) |
| Tests E2E (Playwright, build de production) | `npm run test:e2e` ; un fichier : `npx playwright test tests/e2e/accueil.spec.ts` |

- **Tests** : `tests/unit/` pour la logique pure (environnement Node, rapide), `tests/nuxt/` pour ce qui a besoin du runtime Nuxt (composants, stores, composables : `mountSuspended`), `tests/e2e/` pour les parcours, chacun avec un contrôle axe.
- **CI** (`.github/workflows/ci.yml`) : sur chaque PR, `npm ci`, lint, format, typage, tests, build et E2E. Une PR dont la CI échoue n'est pas prête pour la relecture.

## 3. Gitflow (obligatoire, évalué)

- `main` : production uniquement. **Jamais de commit direct.**
- `develop` : intégration. **Jamais de commit direct** (exception : le commit initial de mise en place).
- Toute tâche part d'une **issue GitHub** (qui cite l'identifiant de la fonctionnalité, ex. `E-TR-01`) → branche `feature/<n°-issue>-<nom-court>` depuis `develop` → **PR vers `develop`**, liée à l'issue (`Closes #n`), validée par le QA.
- `release/<version>` depuis `develop` → fusion vers `main` **et** `develop`, tag `v<version>`.
- `hotfix/<nom>` depuis `main` → fusion vers `main` **et** `develop`.
- Commits en **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `style:`), en français, petits et atomiques.
- **Interdit sans accord explicite de l'utilisateur** : `push --force`, rebase d'une branche partagée, fusion vers `main`, push vers `origin`, création ou fusion de PR.
- Dépôt partagé à trois : toujours `git fetch` avant de créer une branche ou de fusionner, et signaler toute divergence avec `origin`.

## 4. Workflow dynamique

Avant chaque tâche, la classer et **annoncer la classe choisie** :

- **Triviale** (typo, renommage, ajustement local) : exécution directe. Pas de nouvelle branche si une feature est déjà en cours. Relecture rapide.
- **Standard** (fonctionnalité ou bug circonscrit) : branche `feature/` → plan court → implémentation → tests → relecture croisée (§6) → PR vers `develop`.
- **Complexe** (plusieurs modules, architecture, refonte) : plan détaillé **soumis à la validation de l'utilisateur avant de coder** → découpage en sous-tâches → agents en parallèle (§5) → relecture croisée → intégration → validation finale.

Si une tâche se révèle plus complexe que prévu : s'arrêter, la reclasser et prévenir l'utilisateur.

## 5. Agents en parallèle

- Découper les tâches complexes en sous-tâches **indépendantes**, avec des périmètres de fichiers qui ne se chevauchent pas.
- Chaque agent travaille dans **son propre git worktree** (`.worktrees/` ou `.claude/worktrees/`, ignorés par git) et sur **sa propre branche** `feature/`.
- Chaque sous-tâche est définie par : objectif, fichiers concernés, critères de réussite.
- Deux sous-tâches qui touchent les mêmes fichiers sont exécutées **séquentiellement**.
- Fichiers partagés à risque (`nuxt.config.ts`, `package.json`, `shared/types/`, `app/services/`, `app/app.config.ts`, CSS globaux) : un seul agent à la fois, ou modifiés par l'orchestrateur.
- L'orchestrateur intègre les résultats et résout les conflits, jamais les sous-agents entre eux.
- Si l'outil ne gère pas de sous-agents, traiter les sous-tâches séquentiellement, chacune sur sa branche ou son worktree.

## 6. Relecture croisée (obligatoire)

- Tout code est relu par un agent qui **ne l'a pas écrit**, avec un contexte neuf : il reçoit le diff et l'objectif, pas le raisonnement de l'auteur. Si l'outil ne permet pas de lancer un sous-agent, l'agent le signale et l'utilisateur lance la relecture dans une nouvelle session vierge (avec le diff et l'objectif).
- Checklist du relecteur :
  - correction fonctionnelle et cas limites (liste vide, texte long, fichier lourd ou au mauvais format, rôle non autorisé) ;
  - gestion d'erreurs (appels API, formulaires, états de chargement) ;
  - sécurité : secrets, validation des entrées côté Nitro, contrôle du rôle côté serveur, `v-html` sur du contenu utilisateur ;
  - accessibilité : sémantique, clavier, focus, contrastes AA, `alt`, labels et erreurs liés aux champs ;
  - responsive (mobile, tablette, desktop) ;
  - respect de la couche `services/` et des conventions (§8) ;
  - présence et pertinence des tests.
- Retours classés en **bloquant** / **à améliorer** / **suggestion**.
- Aucune fusion tant qu'un point bloquant reste ouvert. Les corrections sont relues à nouveau.

## 7. Portes de validation

Une tâche n'est terminée que si :

1. les tests (Vitest, et Playwright pour les parcours touchés) passent ;
2. le lint et le typage passent ;
3. le build passe ;
4. le rendu a été vérifié dans le navigateur sur les pages touchées ;
5. la relecture croisée est validée ;
6. la documentation concernée est à jour.

Ne jamais déclarer une tâche terminée sans avoir exécuté ces vérifications. Ne jamais désactiver ou contourner un test, une règle de lint ou une erreur de typage (`@ts-ignore`, `any`, `.skip`) pour la faire passer.

## 8. Conventions de code

- **Vue** : `<script setup lang="ts">`, Composition API, `defineProps<…>()` / `defineEmits<…>()` typés. Composants Nuxt UI en priorité avant d'écrire un composant maison.
- **Nommage** : composants en `PascalCase`, pages en `kebab-case`, composables `useXxx`, stores `useXxxStore` (setup stores), variables et fonctions en `camelCase`, constantes en `UPPER_SNAKE_CASE`.
- **Langue** : identifiants de code en anglais, **sauf le vocabulaire métier** gardé en français pour coller au client (`trace`, `portfolio`, `bibliotheque`, `validation`…). Interface et commentaires en français.
- **Données** : composant → store/composable → `services/` → API. Pas de `$fetch` dans les composants. Types du domaine uniquement dans `shared/types/`.
- **Erreurs** : chaque appel API gère chargement, erreur et vide ; message clair pour l'utilisateur, jamais d'erreur silencieuse. Côté Nitro, `createError` avec le bon code HTTP.
- **Styles** : classes Tailwind et thème Nuxt UI (`app.config.ts`) ; pas de couleurs ou d'espacements magiques en dur.
- **Tests** : toute logique de store, composable, service ou route Nitro est couverte par Vitest ; les parcours clés (déposer une trace, composer et publier un portfolio, évaluer une trace) ont un test Playwright avec contrôle d'accessibilité.

## 9. Documentation et décisions

- Tenir `docs/DECISIONS.md` : chaque choix technique important (date, décision, alternatives écartées, raison).
- Tenir `AI_PROMPT_BOOK.md` (journal noté) : après chaque tâche significative faite avec l'IA, **proposer** une entrée (date, auteur, outil IA utilisé, objectif, prompts, ce qui a été retenu ou corrigé à la main).
- Reporter chaque décision client dans `docs/FONCTIONNALITES.md` (statut) et `docs/ROADMAP.md` (sprint).
- Mettre à jour `README.md` et `CHANGELOG.md` lors de chaque release.
- Mettre à jour ce `AGENTS.md` quand une règle ou une commande change, et **le signaler à l'utilisateur** (la modification passe par une PR, comme le code).

## 10. Sécurité et interdits

- Jamais de secrets en dur : `.env` (ignoré) et `.env.example` (versionné). Côté Nuxt, seul `runtimeConfig.public` est exposé au client : n'y mettre rien de sensible.
- Pas de nouvelle dépendance sans justification (besoin, alternatives, poids).
- Pas de suppression de fichiers ou de données sans confirmation.
- Ne jamais toucher à `../unifolio_old`.
- En cas de doute sur une intention ou un besoin fonctionnel, demander plutôt que supposer (les questions client passent par le PO).

## 11. Communication

- Réponses en français.
- En fin de tâche, résumé court : ce qui a été fait, fichiers modifiés, résultat des vérifications (§7), points ouverts, entrée `AI_PROMPT_BOOK` proposée.
