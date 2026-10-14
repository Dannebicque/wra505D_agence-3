# Roadmap UniFolio

Planification des fonctionnalités **retenues** de [`FONCTIONNALITES.md`](./FONCTIONNALITES.md), par sprint. Les dates seront ajoutées une fois le calendrier des séances et des pitches connu. Chaque sprint correspond à un milestone GitHub ; chaque fonctionnalité à une issue qui cite son identifiant.

Les fonctionnalités « À discuter » et « À questionner » n'entrent dans un sprint qu'après décision du client (via le PO).

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
