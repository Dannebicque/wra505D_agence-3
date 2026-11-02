# Roadmap UniFolio

Planification des fonctionnalités **retenues** de [`FONCTIONNALITES.md`](./FONCTIONNALITES.md), par sprint. Les dates seront ajoutées une fois le calendrier des séances et des pitches connu. Chaque sprint correspond à un milestone GitHub ; chaque fonctionnalité à une issue qui cite son identifiant.

Les fonctionnalités « À discuter » et « À questionner » n'entrent dans un sprint qu'après décision du client (via le PO).

## Répartition de l'équipe

Travail réparti à parts égales entre Enzo, Mathéo et Solène : le rôle de PO de Mathéo s'ajoute à sa part de code, il ne la remplace pas. Chacun porte un domaine **de bout en bout** à chaque sprint (types, route Nitro, service, store, pages, tests Vitest) et écrit le test E2E du parcours qu'il livre.

| Sprint | Enzo | Solène | Mathéo |
|---|---|---|---|
| 0 — Socle | Initialisation (#3), types du domaine, utilitaires de format ApiPlatform côté Nitro, squelette `app/services/` | Authentification simulée par rôle, middleware, contrôle du rôle côté serveur, données factices utilisateurs et structure (C-13) | Layout responsive, navigation, mode sombre, accessibilité clavier, confirmation de suppression, messages d'erreur (C-01, C-02, C-08, C-10, C-11) |
| 1 — Traces et compétences | Éditeur de trace, brouillon, sauvegarde automatique (E-TR-01, E-TR-05, E-TR-10, C-06) ; E2E « déposer une trace » | Contenus de trace et prévisualisation des fichiers (E-TR-02, E-TR-04) | Référentiel, association des compétences, critères attendus (E-CP-01, E-CP-02, E-CP-03) |
| 2 — Portfolio | Tableau de bord des traces (E-DB-02, E-DB-06, E-DB-07), portfolio public par lien (E-PF-06) | Portfolio (E-PF-01 à E-PF-05, E-PF-08, E-PF-10) ; E2E « composer et publier un portfolio » | Pages-projets et glisser-déposer avec alternative clavier (E-PG-01, E-PG-02, E-PG-04, E-TR-08) |
| 3 — Évaluation | Évaluation des traces (P-EV-01 à P-EV-04, P-EV-07, P-EV-09, P-EV-10, P-OR-03) ; E2E « évaluer une trace » | Espace enseignant : étudiants et portfolios (P-ET-01 à P-ET-06, P-PF-02 à P-PF-04, P-OR-01, P-OR-02) | Retours côté étudiant : évaluations, commentaires, notifications, progression (E-EV-01, E-EV-02, E-EV-04 à E-EV-07, P-CO-01, E-CP-04, E-CP-07) |
| 4 — Bascule ApiPlatform | Docker, mise en place d'ApiPlatform, ressources Trace et Bibliotheque, téléversement des fichiers | Ressources Portfolio, Page et Référentiel ; bascule de ses services | Authentification réelle, ressources Users, Validation, Commentaire et Notification |
| 5 — Finition | Bilans et exports (P-ST-03, P-ST-08, P-ST-09, P-ST-10), annuler / rétablir (E-TR-11) | CV (E-CV-01, E-CV-03, E-CV-05, E-CV-06) | Recherche globale, filtres, corbeille, aide contextuelle, échéances (C-03, C-04, C-09, C-12, E-DB-03, P-OR-06) |

- **Relecture tournante** (en plus du QA) : Enzo relit Solène, Solène relit Mathéo, Mathéo relit Enzo.
- **Fichiers partagés** (`shared/types/`, `nuxt.config.ts`, `package.json`, `app/app.config.ts`) : petite PR dédiée, annoncée au groupe. Au Sprint 0, les types du domaine sont fusionnés en premier : l'authentification et le layout s'appuient dessus.
- **Documentation** : chacun tient `docs/DECISIONS.md` et `AI_PROMPT_BOOK.md` pour ses propres tâches.
- Audit accessibilité et performance, release `v1.0.0` et présentation finale (Sprint 5) : toute l'équipe.

## Phase 0 — Cadrage

- Audit de l'ancien UniFolio (`../unifolio_old`) : écrans, parcours, bugs à corriger.
- Validation du périmètre avec le client et résolution des points ouverts de `FONCTIONNALITES.md`.
- Backlog : issues GitHub, labels (`étudiant`, `enseignant`, `commun`, `a11y`, `bug-legacy`), milestones.
- Wireframes mobile d'abord et direction visuelle (Miro), validés par le client.
- Création de `AI_PROMPT_BOOK.md` et organisation de la relecture des PR.

## Sprint 0 — Socle technique et fonctionnalités communes

- Nuxt 4, Nuxt UI, Pinia, ESLint + Prettier, Vitest, Playwright, CI GitHub Actions.
- Types du domaine (`shared/types/`), couche `app/services/`, API Nitro avec données factices (référentiel, étudiants, enseignants).
- Authentification simulée par rôle, gardes de route et contrôles côté serveur.
- Modèle de données et éditeurs prévus pour le **brouillon** (E-TR-05), la **sauvegarde automatique** (C-06), l'**annulation / rétablissement** (E-TR-11) et la **corbeille** (suppression douce, C-09) : choix structurants à poser dès le départ.
- Fonctionnalités : C-01, C-02, C-08, C-10, C-11, C-13 (C-13 complète au Sprint 4, avec l'authentification réelle).

## Sprint 1 — Compétences et traces (étudiant)

- Compétences : E-CP-01, E-CP-02, E-CP-03.
- Traces (dans la bibliothèque de l'étudiant) : E-TR-01, E-TR-02, E-TR-04, E-TR-05.
- Sauvegarde automatique : E-TR-10, C-06 (côté enseignant : voir point ouvert n° 7).
- E2E : déposer une trace.

## Sprint 2 — Portfolio (étudiant)

- Portfolio : E-PF-01, E-PF-02, E-PF-03, E-PF-04, E-PF-05, E-PF-06, E-PF-08, E-PF-10.
- Pages-projets (contenues dans un portfolio) : E-PG-01, E-PG-02.
- Organisation : E-PG-04, E-TR-08 (glisser-déposer avec alternative clavier).
- Tableau de bord : E-DB-02, E-DB-06, E-DB-07.
- E2E : composer et publier un portfolio.

## Sprint 3 — Évaluation (enseignant) et retours (étudiant)

- Étudiants : P-ET-01 à P-ET-06.
- Évaluation : P-EV-01, P-EV-02, P-EV-03, P-EV-04, P-EV-07, P-EV-09, P-EV-10.
- Portfolios : P-PF-02, P-PF-03, P-PF-04.
- Commentaires : P-CO-01.
- Organisation : P-OR-01, P-OR-02, P-OR-03.
- Côté étudiant : E-EV-01, E-EV-02, E-EV-04 à E-EV-07, E-CP-04, E-CP-07.
- E2E : évaluer une trace.

## Sprint 4 — Bascule ApiPlatform

- API ApiPlatform sous Docker (PHP, PostgreSQL, Caddy).
- Bascule de `app/services/` de Nitro vers ApiPlatform, authentification réelle, téléversement réel des fichiers.

## Sprint 5 — Bilans, CV et finition

- Enseignant : P-ST-03, P-ST-08, P-ST-09, P-ST-10.
- CV : E-CV-01, E-CV-03, E-CV-05, E-CV-06.
- Communs : C-03 et C-04 (étendent la recherche et les filtres de E-DB-06 / E-DB-07, sans seconde implémentation), C-09 (interface de la corbeille), C-12, E-TR-11.
- Échéances (E-DB-03, P-OR-06) : selon la décision sur le point ouvert n° 1.
- Fonctionnalités « À discuter » retenues par le client.
- Audit accessibilité et performance, release `v1.0.0`, présentation finale.

## En continu

- Démo ou pitch au client en fin de sprint (porté par le PO).
- Petites PR fréquentes, relues par le QA.
- Mise à jour de `AI_PROMPT_BOOK.md`, `docs/DECISIONS.md` et de ce fichier.
