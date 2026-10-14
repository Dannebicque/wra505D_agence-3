# Fonctionnalités UniFolio

Périmètre fonctionnel de la refonte, issu de la page Notion « [Ajout des fonctionnalités](https://app.notion.com/p/3f9f659ee96e80bdb0fce7fefc4ceca5) » (version du 2026-10-14). **Ce fichier est la référence pour l'équipe et les agents IA** : toute évolution du périmètre décidée avec le client (via le PO, Mathéo) y est reportée par une PR.

## Statuts

| Statut | Signification | Règle |
|---|---|---|
| **Retenue** | Fonctionnalité gardée | À livrer (voir `ROADMAP.md`) |
| **À discuter** | À arbitrer avec le client | Ne pas implémenter avant décision |
| **À questionner** | Besoin à clarifier | Ne pas implémenter avant décision |
| **Retirée** | Hors périmètre | Ne jamais implémenter |

Chaque fonctionnalité a un identifiant stable (`E-` étudiant, `P-` professeur, `C-` commun) à citer dans les issues, branches et PR.

---

## Côté étudiants

### Gestion du portfolio (E-PF)

| ID | Fonctionnalité | Statut |
|---|---|---|
| E-PF-01 | Créer un portfolio | Retenue |
| E-PF-02 | Modifier le titre, la bannière et l'introduction | Retenue |
| E-PF-03 | Choisir entre un portfolio public et privé | Retenue |
| E-PF-04 | Prévisualiser le portfolio avant publication | Retenue |
| E-PF-05 | Publier et dépublier le portfolio | Retenue |
| E-PF-06 | Partager le portfolio avec un lien public | Retenue |
| E-PF-07 | Générer un QR code pour accéder au portfolio | Retirée |
| E-PF-08 | Consulter tous ses portfolios depuis un tableau de bord | Retenue |
| E-PF-09 | Dupliquer un portfolio pour réutiliser sa structure | Retirée |
| E-PF-10 | Limiter à 1 portfolio par année | Retenue |

### Gestion des pages (E-PG)

Une page correspond *a priori* à un **projet** (note Notion sur E-PG-01 : « trier par projet ? », voir point ouvert n° 6).

| ID | Fonctionnalité | Statut |
|---|---|---|
| E-PG-01 | Créer, modifier et supprimer des pages (note Notion : « trier par projet ? ») | Retenue |
| E-PG-02 | Organiser les pages par projet | Retenue |
| E-PG-03 | Organiser les pages par compétence ou matière | Retirée |
| E-PG-04 | Réorganiser les pages par glisser-déposer | Retenue |
| E-PG-05 | Dupliquer une page | Retirée |
| E-PG-06 | Utiliser des modèles de pages prédéfinis | À discuter |
| E-PG-07 | Prévisualiser une page avant publication | Retirée |

### Gestion des traces (E-TR)

| ID | Fonctionnalité | Statut |
|---|---|---|
| E-TR-01 | Créer, modifier et supprimer des traces | Retenue |
| E-TR-02 | Ajouter du texte, des images, des PDF, des vidéos et des liens | Retenue |
| E-TR-03 | Joindre plusieurs fichiers à une trace (note Notion : « sauf même type (images) », à clarifier) | Retirée |
| E-TR-04 | Prévisualiser les fichiers joints | Retenue |
| E-TR-05 | Enregistrer une trace en brouillon | Retenue |
| E-TR-06 | Réutiliser une trace dans plusieurs pages | Retirée |
| E-TR-07 | Dupliquer une trace | Retirée |
| E-TR-08 | Réorganiser les traces dans une page (un projet) | Retenue |
| E-TR-09 | Consulter une bibliothèque regroupant toutes ses traces | À discuter |
| E-TR-10 | Enregistrer automatiquement les modifications | Retenue |
| E-TR-11 | Annuler ou rétablir les dernières modifications | Retenue |

### Gestion des compétences (E-CP)

| ID | Fonctionnalité | Statut |
|---|---|---|
| E-CP-01 | Consulter le référentiel de compétences de sa formation | Retenue |
| E-CP-02 | Associer une ou plusieurs compétences à une trace | Retenue |
| E-CP-03 | Consulter les critères attendus pour chaque compétence (raccourci) | Retenue |
| E-CP-04 | Visualiser les compétences évaluées, en cours d'acquisition ou non évaluées | Retenue |
| E-CP-05 | Identifier les compétences sans preuve associée | Retirée |
| E-CP-06 | Identifier les traces qui doivent être complétées (brouillon) | À discuter |
| E-CP-07 | Suivre sa progression globale | Retenue |
| E-CP-08 | Recevoir des suggestions de traces à améliorer (feedback prof) | À discuter |

### Évaluations et commentaires (E-EV)

| ID | Fonctionnalité | Statut |
|---|---|---|
| E-EV-01 | Consulter les évaluations de ses traces | Retenue |
| E-EV-02 | Lire les commentaires des professeurs | Retenue |
| E-EV-03 | Répondre aux commentaires lorsque cette possibilité est autorisée | Retirée |
| E-EV-04 | Recevoir une notification lorsqu'une trace est évaluée | Retenue |
| E-EV-05 | Recevoir une notification lorsqu'un professeur ajoute un commentaire | Retenue |
| E-EV-06 | Retrouver tous les commentaires dans une boîte de réception | Retenue |
| E-EV-07 | Accéder directement à une trace depuis une notification | Retenue |

### Tableau de bord et organisation (E-DB)

| ID | Fonctionnalité | Statut |
|---|---|---|
| E-DB-01 | Consulter les dernières modifications | À discuter |
| E-DB-02 | Voir les traces en brouillon, à compléter et évaluées | Retenue |
| E-DB-03 | Afficher les prochaines échéances | Retenue |
| E-DB-04 | Identifier les actions à réaliser en priorité | Retirée |
| E-DB-05 | Reprendre rapidement le dernier travail commencé | À discuter |
| E-DB-06 | Rechercher une page, une trace ou une compétence (dashboard traces) | Retenue |
| E-DB-07 | Filtrer les traces par portfolio, compétence ou statut | Retenue |

### Outils professionnels (E-CV)

| ID | Fonctionnalité | Statut |
|---|---|---|
| E-CV-01 | Créer un CV à partir des informations du portfolio | Retenue |
| E-CV-02 | Réutiliser les compétences et projets dans son CV | Retirée |
| E-CV-03 | Télécharger son CV au format PDF | Retenue |
| E-CV-04 | Ajouter des liens vers GitHub, LinkedIn ou un site personnel | Retirée |
| E-CV-05 | Prévisualiser son CV avant téléchargement | Retenue |
| E-CV-06 | Adapter son CV à une candidature de stage ou d'alternance | Retenue |

---

## Communes aux deux espaces (C)

| ID | Fonctionnalité | Statut |
|---|---|---|
| C-01 | Interface adaptée aux ordinateurs, tablettes et téléphones | Retenue |
| C-02 | Mode sombre et mode clair | Retenue |
| C-03 | Recherche globale | Retenue |
| C-04 | Filtres de recherche | Retenue |
| C-05 | Notifications personnalisables | Retirée |
| C-06 | Sauvegarde automatique | Retenue |
| C-07 | Historique des modifications | Retirée |
| C-08 | Confirmation avant suppression | Retenue |
| C-09 | Corbeille permettant de restaurer les éléments supprimés | Retenue |
| C-10 | Gestion des erreurs avec des messages compréhensibles | Retenue |
| C-11 | Navigation accessible au clavier | Retenue |
| C-12 | Aide contextuelle intégrée | Retenue |
| C-13 | Gestion sécurisée des accès et des données personnelles | Retenue |

---

## Côté professeurs

### Gestion des étudiants (P-ET)

| ID | Fonctionnalité | Statut |
|---|---|---|
| P-ET-01 | Consulter la liste des étudiants | Retenue |
| P-ET-02 | Rechercher un étudiant par son nom | Retenue |
| P-ET-03 | Filtrer les étudiants par groupe, année ou formation | Retenue |
| P-ET-04 | Accéder directement au portfolio d'un étudiant | Retenue |
| P-ET-05 | Consulter les portfolios et les traces déposées | Retenue |
| P-ET-06 | Identifier les étudiants ayant des travaux en attente | Retenue |
| P-ET-07 | Visualiser les dernières traces ajoutées | À discuter |

### Évaluation des traces (P-EV)

| ID | Fonctionnalité | Statut |
|---|---|---|
| P-EV-01 | Consulter le contenu d'une trace et ses pièces jointes | Retenue |
| P-EV-02 | Visualiser les compétences associées à une trace | Retenue |
| P-EV-03 | Évaluer une compétence selon trois niveaux : non acquis, en cours d'acquisition, acquis | Retenue |
| P-EV-04 | Ajouter un commentaire général à une trace | Retenue |
| P-EV-05 | Ajouter un commentaire lié à une compétence précise | Retirée |
| P-EV-06 | Enregistrer une évaluation en brouillon | Retirée |
| P-EV-07 | Modifier une évaluation | Retenue |
| P-EV-08 | Consulter l'historique des évaluations | À discuter |
| P-EV-09 | Passer à la trace suivante sans revenir au tableau de bord | Retenue |
| P-EV-10 | Filtrer les traces non évaluées | Retenue |
| P-EV-11 | Identifier les évaluations commencées mais non terminées | Retirée |
| P-EV-12 | Utiliser des commentaires types personnalisables | Retirée |

### Évaluation des portfolios (P-PF)

| ID | Fonctionnalité | Statut |
|---|---|---|
| P-PF-01 | Consulter un portfolio dans son intégralité | À discuter |
| P-PF-02 | Parcourir ses pages et ses traces | Retenue |
| P-PF-03 | Visualiser les compétences associées aux traces | Retenue |
| P-PF-04 | Consulter le niveau d'acquisition des compétences | Retenue |
| P-PF-05 | Rédiger un bilan général du portfolio | Retirée |
| P-PF-06 | Identifier les compétences insuffisamment documentées | Retirée |
| P-PF-07 | Repérer les traces manquantes ou à compléter | Retirée |
| P-PF-08 | Consulter l'historique des retours pédagogiques | À discuter |

### Gestion des commentaires (P-CO)

| ID | Fonctionnalité | Statut |
|---|---|---|
| P-CO-01 | Ajouter des commentaires visibles par l'étudiant | Retenue |
| P-CO-02 | Ajouter des notes privées réservées aux enseignants autorisés | À discuter |
| P-CO-03 | Répondre aux commentaires des autres enseignants | Retirée |
| P-CO-04 | Mentionner un collègue dans une discussion | Retirée |
| P-CO-05 | Recevoir une notification lorsqu'un étudiant répond | Retirée |
| P-CO-06 | Consulter l'historique des échanges | Retirée |
| P-CO-07 | Identifier clairement les destinataires de chaque commentaire | Retirée |

### Suivi pédagogique et statistiques (P-ST)

| ID | Fonctionnalité | Statut |
|---|---|---|
| P-ST-01 | Consulter le nombre de traces déposées par étudiant | À discuter |
| P-ST-02 | Visualiser le nombre de traces évaluées et restantes | À discuter |
| P-ST-03 | Afficher la progression des compétences par étudiant | Retenue |
| P-ST-04 | Comparer les résultats d'une même compétence au sein d'un groupe | Retirée |
| P-ST-05 | Visualiser une matrice compétences × étudiants | Retirée |
| P-ST-06 | Identifier les compétences les moins maîtrisées | À discuter |
| P-ST-07 | Identifier les étudiants qui manquent de preuves | À discuter |
| P-ST-08 | Générer un bilan individuel | Retenue |
| P-ST-09 | Générer un bilan collectif | Retenue |
| P-ST-10 | Exporter les résultats au format CSV ou PDF | Retenue |

### Gestion des consignes et des échéances (P-CS)

| ID | Fonctionnalité | Statut |
|---|---|---|
| P-CS-01 | Créer une consigne de travail | Retirée |
| P-CS-02 | Associer une consigne à une ou plusieurs compétences | Retirée |
| P-CS-03 | Attribuer une consigne à un groupe ou à des étudiants précis | Retirée |
| P-CS-04 | Définir une date limite | À questionner |
| P-CS-05 | Préciser les éléments attendus dans une trace | Retirée |
| P-CS-06 | Suivre les dépôts des étudiants | À discuter |
| P-CS-07 | Identifier les retards | À discuter |
| P-CS-08 | Envoyer des rappels aux étudiants concernés | Retirée |
| P-CS-09 | Consulter toutes les traces associées à une consigne | Retirée |

### Organisation du travail (P-OR)

| ID | Fonctionnalité | Statut |
|---|---|---|
| P-OR-01 | Consulter les évaluations en attente depuis un tableau de bord | Retenue |
| P-OR-02 | Filtrer les traces par étudiant, groupe, compétence et statut | Retenue |
| P-OR-03 | Évaluer plusieurs traces successivement | Retenue |
| P-OR-04 | Enregistrer automatiquement les évaluations | Retirée |
| P-OR-05 | Reprendre la dernière évaluation consultée | Retirée |
| P-OR-06 | Visualiser les échéances à venir | Retenue |
| P-OR-07 | Organiser les évaluations par priorité | Retirée |

---

## Points ouverts (à trancher par le PO avec le client)

1. **Échéances** : E-DB-03 et P-OR-06 sont retenues, mais les consignes (P-CS) sont retirées et la date limite (P-CS-04) est à questionner. D'où viennent les échéances : date limite saisie par l'enseignant, calendrier fixe, autre ?
2. **Plusieurs fichiers par trace** (E-TR-03) : retirée « sauf même type (images) ». Faut-il comprendre : une galerie de plusieurs images autorisée, pas de mélange de types ?
3. **CV** : E-CV-01 (CV à partir du portfolio) est retenue mais E-CV-02 (réutiliser compétences et projets) est retirée. Quelles informations du portfolio alimentent le CV ? Le retrait des liens GitHub/LinkedIn (E-CV-04), présents dans l'ancienne version, est-il voulu ?
4. **Bibliothèque de traces** (E-TR-09) : la recherche et le filtrage des traces (E-DB-06, E-DB-07) sont retenus, ce qui implique déjà une vue de toutes les traces. La valider comme écran à part entière ?
5. **Annuler / rétablir** (E-TR-11) : sur tous les éditeurs ou seulement l'éditeur de trace ?
6. **Pages = projets** (E-PG-01, E-PG-02) : confirmer qu'une page correspond toujours à un projet.
7. **Sauvegarde automatique** : C-06 (commune aux deux espaces) est retenue, mais l'enregistrement automatique des évaluations (P-OR-04) est retiré. Côté enseignant, la sauvegarde automatique s'applique-t-elle à autre chose ?
8. **Consultation d'un portfolio par l'enseignant** : P-PF-01 (en intégralité) est à discuter, alors que P-ET-04, P-ET-05 et P-PF-02 (accéder au portfolio, le parcourir) sont retenues. Quelle différence attend le client ?
9. **Traces à compléter** : E-CP-06 est à discuter, mais E-DB-02 (voir les traces en brouillon, à compléter et évaluées) est retenue. Qu'est-ce qu'une trace « à compléter », par rapport à un brouillon ?
10. **Suivi des dépôts** : P-ST-02 et P-CS-06 sont à discuter, mais P-OR-01 et P-ET-06 (évaluations en attente, étudiants ayant des travaux en attente) sont retenues. Le comptage des traces restantes est-il attendu en plus ?

**Proposition de l'équipe** : 17 fonctionnalités sont « À discuter » ; en retenir deux ou trois au maximum, planifiées au dernier sprint.
