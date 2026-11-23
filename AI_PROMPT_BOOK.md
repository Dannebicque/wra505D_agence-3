# Journal IA — UniFolio

Usage de l'IA sur le projet (voir `AGENTS.md` §9) : une entrée par tâche significative, avec la date, l'auteur, l'outil, l'objectif, ce que l'IA a produit et ce qui a été retenu ou corrigé.

## 2026-11-23 — Pages-projets enregistrées, partie front (#18)

- **Auteur** : Enzo
- **Outil** : Claude Code (Claude Opus 5.5)
- **Objectif** : brancher sur l'API les pages-projets d'un portfolio (E-PG-01, E-PG-02, E-PG-04, E-TR-08) : création, renommage et suppression des pages, ordre des pages et des traces au glisser-déposer et au clavier, ajout et retrait des traces.
- **Produit par l'IA** :
  - service et store `portfolio`, file d'envois un par un (`app/utils/serial-queue.ts`) ;
  - composables `usePagesProjets` et `usePageProjet` : enregistrement immédiat, retour au dernier état enregistré en cas d'échec ;
  - branchement des deux écrans, en gardant la maquette pour les informations et la publication du portfolio (lot de Solène) ;
  - tests Vitest (file, service, composables, écrans) et E2E « réordonner, recharger » au clavier et à la souris, avec contrôle axe.
- **Relecture et corrections** : deux relectures croisées par un agent neuf (§6).
  - Point bloquant corrigé : un changement mis en file derrière un envoi refusé était perdu sans message, et l'écran pouvait annoncer une réussite.
  - Autres corrections : focus rendu à une flèche active après un retour en arrière, alertes d'erreur (informations, suppression), « Annuler » inactif pendant la création, sélection de traces gardée après un échec, suppression déjà faite (404) comptée comme réussie.
- **Laissé ouvert** (voir `docs/DECISIONS.md`) : nombre de traces d'une page incluant celles à la corbeille (back) ; existence du portfolio encore vérifiée sur les données de maquette (lot de Solène).

## 2026-11-23 — Identité IUT, espacements réguliers et finitions d'interface (#24)

- **Auteur** : Enzo
- **Outil** : Claude Code (Claude Opus 5.5) en orchestrateur ; agents en parallèle dans des worktrees séparés ; skills `dataviz`, `taste-skill:design-taste-frontend` et `design:accessibility-review`
- **Objectif** : couleurs de l'IUT (prune `#4D3677`, or `#F7B000`) en accents seulement, échelle d'espacement unique, finitions typographiques et d'interaction (OKLCH, interlignage, longueur de ligne, veuves, chiffres tabulaires, zones tactiles et sûres, décalage de mise en page, affordance, combobox, divulgation progressive, transitions), puis tableaux de bord plus lisibles avec une dataviz plus marquée.
- **Déroulé** : design écrit d'abord (`docs/superpowers/specs/2026-11-23-identite-iut-design.md`) ; un agent pose le socle (thème, règles globales) ; trois agents appliquent le socle en parallèle (espace étudiant, espace enseignant, écrans communs) ; un agent refait les tableaux de bord ; un audit WCAG 2.2 AA et trois relectures croisées par des agents neufs.
- **Retenu** : palettes OKLCH calculées et contrastes mesurés par script ; gris teinté prune ; police de secours aux métriques ajustées (elle n'était pas générée) ; taux d'acquisition et barres segmentées à la même échelle, valeurs écrites à côté de la couleur ; filtres longs avec recherche ; section « Plus de détails » dans le formulaire de trace.
- **Corrigé grâce aux relectures et à l'audit** : interlignage qui écrasait celui des grands nombres ; icône de chargement figée sous « réduire les animations » ; valeur des filtres non annoncée (bloquant) ; contours des champs à 1,4:1 portés à 4,8:1 ; option active des listes invisible au clavier ; groupe « Type de trace » sans nom ; page courante peu visible ; astérisque lu « étoile » ; « acquis » moins marqué que « en cours » en mode sombre ; taux étudiant faussé par les évaluations en attente ; squelettes de chargement qui ne correspondaient plus au contenu.
- **Écarté** : stagger (retarde la lecture) ; replier la déclaration d'IA à l'évaluation ; couleur par compétence dans les graphiques.
- **Laissé ouvert** (voir `docs/DECISIONS.md`) : panneau de répartition ajouté au tableau de bord enseignant, brouillons devenus des liens et définition du taux, à confirmer par le PO ; zones sûres non testées sur un vrai iPhone ; lecture avec un vrai lecteur d'écran.

## 2026-11-23 — Passe UI/UX : landing, hiérarchie des actions et profondeur (#32)

- **Auteur** : Enzo
- **Outil** : Claude Code (Claude Opus 5.5) en orchestrateur, avec deux agents en parallèle (page d'accueil dans un worktree séparé, écrans des espaces) et un agent neuf pour la relecture croisée. Skill `taste-skill:design-taste-frontend` pour la direction de l'accueil (« Type and nothing else », adaptée pour garder les couleurs minoritaires) et les règles des écrans d'application.
- **Objectif** : une interface moins plate, des actions compréhensibles et ordonnées, des boutons travaillés, une vraie page d'accueil, des tableaux de bord qui disent quoi faire.
- **Déroulé** :
  - captures « avant » sur le build de production ;
  - design écrit (`docs/superpowers/specs/2026-11-23-passe-ui-ux-design.md`) ;
  - socle (boutons, relief, en-tête de page, états vides) ;
  - tableaux de bord par l'orchestrateur, en parallèle de l'accueil et des autres écrans par les agents ;
  - intégration, puis vérification sur le build de production.
- **Retenu** :
  - hiérarchie des boutons et en-tête de page commun ;
  - bloc « À faire maintenant » en aplat prune, avec le bouton or sur l'action la plus pressante ;
  - indicateur en compte plutôt qu'en pourcentage nu ;
  - accueil avec aperçu à bascule de la vraie interface et parcours d'une trace en bordereau ;
  - cartes de trace avec type, compétences et chevron.
- **Corrigé à l'intégration** :
  - nom de transition et focus du titre déplacés dans `UiEnTetePage` (les écrans passaient par un `span` et par `querySelector`) ;
  - actions empilées sur téléphone ;
  - tests de l'accueil et du thème mis à jour ;
  - lignes d'action qui écrasaient leur texte sur téléphone ;
  - taille fluide du titre de l'accueil, pour tenir à 320 px.
- **Corrigé grâce à la relecture croisée** :
  - **bloquant** : un clic sur le texte d'une ligne d'action ne menait nulle part. Le décalage du bouton à l'appui faisait de lui le bloc conteneur du lien étendu. Reproduit dans un navigateur, puis corrigé ;
  - « Aucune trace pour Entreprendre » s'affichait alors qu'un brouillon visait cette compétence ;
  - noms accessibles des boutons d'action ;
  - contraste de l'état choisi de la bascule de l'accueil (1,4:1) ;
  - focus après un lien d'ancre ;
  - ordre de lecture des échéances ;
  - aperçu enseignant aligné sur la démo ;
  - dates à l'heure de Paris ;
  - commentaires périmés.
- **Écarté** : aplats pleine page sur l'accueil (couleurs devenues majoritaires) ; animations au défilement.
- **Laissé ouvert** (voir `docs/DECISIONS.md`) :
  - actions à confirmer par le PO ;
  - données de démo incohérentes entre `app/demo/base.ts` et `server/data/validations.ts` ;
  - rendu serveur sans données de la page-projet (déjà présent avant cette passe).
