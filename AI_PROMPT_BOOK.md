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
