# Charpente visuelle d'UniFolio — conception

Issues : #7 (lot 1), #8 (lot 2) · Date : 2026-11-02 · Auteur : Enzo (avec Claude Code) · Référence visuelle : [`docs/design/maquette-a-editorial.png`](../../design/maquette-a-editorial.png) · Sprint 0, part front d'Enzo (voir `docs/ROADMAP.md`).
Fonctionnalités : C-01 (responsive), C-02 (mode sombre), C-08 (confirmation avant suppression), C-10 (messages d'erreur), C-11 (navigation au clavier).

## Intention

Poser la charpente visuelle de toute l'application, avant les écrans métier : le cadre (navigation, mise en page), le thème, et les briques transverses que Solène et Enzo réutiliseront dans chaque écran. Le client est très exigeant sur l'accessibilité, l'UX et la qualité : tout ce qui est posé ici sera copié partout, il doit donc être juste dès le départ.

Le style a été choisi le 2026-11-02 parmi des maquettes générées avec Taste Skill (style « editorial-greeting ») : **A, éditorial**. L'utilisateur a validé la direction et prévoit d'ajuster quelques éléments visuels plus tard ; tout ce qui est visuel doit donc passer par des jetons de thème, jamais par des valeurs en dur, pour que ces ajustements se fassent en un seul endroit.

## Objectifs

1. Un cadre unique pour les trois espaces (`/etudiant`, `/enseignant`, `/admin`), responsive du téléphone à l'ordinateur.
2. Un thème Nuxt UI complet (clair et sombre) reprenant le style A.
3. Une navigation entièrement utilisable au clavier et avec un lecteur d'écran.
4. Une confirmation avant suppression réutilisable.
5. Un affichage commun des états chargement / erreur / vide, et une page d'erreur (404, 500) en français.

## Hors périmètre (non-objectifs)

- Le contenu métier des tableaux de bord (blocs compétences, « À faire », traces) : il arrive avec les fonctionnalités des sprints 1 à 3. Les maquettes servent de référence de style, pas de cahier des charges pour cette tâche.
- L'authentification, la page de connexion et la garde des routes par rôle : tâche de Solène (Sprint 0). La charpente ne dépend pas de l'utilisateur connecté (voir « Navigation »).
- Le contenu de l'aide contextuelle (C-12), la recherche globale (C-03) : Sprint 5.

## Anti-objectifs (ce qui ferait échouer la tâche même si « ça marche »)

- Une couleur, une taille ou un espacement écrit en dur dans un composant (AGENTS.md §8).
- Un lien de navigation vers une page qui n'existe pas (404 dans la démo client).
- Un focus invisible ou piégé, un menu mobile qu'on ne peut pas fermer au clavier.
- Une erreur technique ou en anglais affichée à l'utilisateur.
- Une requête vers un service tiers en production (polices comprises).
- Les tics des interfaces générées que le style écarte : dégradés, ombres sur les éléments au repos, icônes dans des pastilles colorées, étiquettes en majuscules espacées, emoji.

## Le style A, éditorial (décidé)

Référence visuelle : maquette `A` (tableau de bord de Léa, ordinateur et téléphone). Valeurs de la fiche Taste Skill, adaptées :

| Élément | Clair | Sombre (proposé, à vérifier en contraste) |
|---|---|---|
| Cadre (barre latérale, barre haute) | gris-bleu `#eef1f4` | `#0f1214` |
| Feuille de contenu | blanc `#ffffff`, bord 1px `#e3e6ea`, rayon 16px | `#16191c`, bord `#262a2e` |
| Panneau (aplat) | `#f6f7f8`, rayon 22px, sans ombre | `#1e2226` |
| Texte | `#1f201d` | `#e8eaeb` |
| Texte secondaire | `#636361` | `#a0a6ab` |
| Action (couleur primaire) | sarcelle `#1b6e66`, texte blanc | sarcelle éclairci (de l'ordre de `#5fb8ad`), texte foncé |
| Élément actif de la navigation | pastille neutre `#e1e5ea` | `#262b30` |

- **Polices** : Instrument Sans (400, 500, 600) pour tout le texte ; Instrument Serif (400) **uniquement** pour le grand titre d'accueil (classe ou composant dédié). Chargées par `@nuxt/fonts` (déjà fourni par Nuxt UI) et servies par l'application : aucune requête vers Google en production.
- **Formes** : boutons en pilule (rayon complet), panneaux en aplat sans ombre, une seule couleur d'action.
- **Chiffres** : `font-variant-numeric: tabular-nums` dans les tableaux et les compteurs.
- Le contraste AA (4,5:1 pour le texte, 3:1 pour les composants) est obligatoire dans les deux modes ; les valeurs « proposées » du mode sombre sont à ajuster si elles n'y arrivent pas.

## Le cadre (layout)

- **Ordinateur** (≥ 1024px, à confirmer selon les points de rupture Tailwind) : barre latérale d'environ 224px sur le fond du cadre (logo UniFolio, navigation de l'espace, bouton de thème en bas) ; contenu sur une feuille blanche décalée de 8px des bords droit et bas.
- **Téléphone et tablette** : barre haute de 52px (bouton menu, logo, une action au plus) ; le menu ouvre la navigation dans un panneau plein écran ; la feuille devient tout l'écran.
- **Logo** : la marque dessinée dans les maquettes (deux pages superposées, en sarcelle) suivie du mot « UniFolio ».
- Un seul titre `h1` par page, posé par la page elle-même.

## Navigation

- La navigation dépend de **l'espace visité** (préfixe de l'URL : `/etudiant`, `/enseignant`, `/admin`), pas de l'utilisateur connecté : la charpente n'attend pas l'authentification de Solène, et sa garde de route décidera qui peut entrer dans quel espace.
- Les éléments de navigation de chaque espace sont décrits dans **une configuration unique** (libellé, route, icône Lucide facultative). **Seules les pages qui existent y figurent** : chaque fonctionnalité future ajoute sa ligne en même temps que sa page.
- Pour ce sprint, chaque espace a sa page d'accueil (`/etudiant`, `/enseignant`, `/admin`) : un `h1` et une phrase, sans faux contenu. La page `/` actuelle reste la page d'accueil publique et pointe vers les trois espaces (en attendant la connexion).
- L'élément actif est signalé visuellement **et** par `aria-current="page"`.

## Accessibilité clavier (C-11)

- Un lien « Aller au contenu » est le premier élément focalisable de chaque page ; visible quand il reçoit le focus ; il mène au `main`.
- Le focus est toujours visible (anneau de focus du thème, contraste suffisant dans les deux modes).
- Le menu mobile : ouvrable et fermable au clavier (Échap ferme), le focus reste dans le menu tant qu'il est ouvert et revient sur le bouton menu à la fermeture.
- Ordre de tabulation = ordre visuel. Repères : `nav` nommée, `main`, `header`.
- Respect de `prefers-reduced-motion` pour les transitions du menu.

## Confirmation avant suppression (C-08)

- Une fenêtre de confirmation réutilisable, appelée depuis un composant ou un store sans réécrire de fenêtre à chaque fois, et qui renvoie la réponse (confirmé ou annulé).
- Elle **nomme ce qui va être supprimé** (« Supprimer la trace « Affiche du festival Court Toujours » ? ») et ce qu'il advient (corbeille quand elle existera, C-09).
- Bouton de confirmation au libellé explicite (« Supprimer », pas « OK »), en couleur d'erreur ; bouton « Annuler ». Le focus s'ouvre sur « Annuler ». Échap et le clic hors de la fenêtre annulent.

## Messages d'erreur et états (C-10)

- **États d'un bloc de données** : un composant commun affiche, selon l'état d'un appel, le chargement (annoncé aux lecteurs d'écran), l'erreur (message de `ApiError.message`, déjà en français, avec un bouton « Réessayer » quand un nouvel essai a du sens), le vide (message fourni par l'écran, jamais un bloc qui disparaît) ou le contenu.
- **Erreur d'une action** (enregistrer, supprimer) : notification (toast Nuxt UI) avec le message de l'`ApiError`.
- **Page d'erreur** (`app/error.vue`) : 404 « Page introuvable » et erreur serveur, en français, dans le cadre visuel, avec un lien de retour à l'accueil ; jamais de trace technique.

## Contraintes

- Stack et conventions d'AGENTS.md : Nuxt UI en priorité, `<script setup lang="ts">`, composants en PascalCase regroupés par domaine (`app/components/layout/`, `app/components/ui/`…), composables `useXxx`, pas de `$fetch` dans les composants.
- Fichiers partagés touchés (`app/app.config.ts`, CSS global, `nuxt.config.ts`) : modifiés dans cette seule tâche, annoncés au groupe dans la PR.
- Pas de nouvelle dépendance sans justification ; `@nuxt/fonts` est déjà présent via Nuxt UI.
- Branche empilée sur `feature/5-socle-donnees` (la gestion d'erreur s'appuie sur `ApiError`).

## Vérification attendue

- Tests Vitest des composants et composables (navigation par espace et `aria-current`, lien d'évitement, états du bloc de données, confirmation qui renvoie vrai / faux).
- Tests Playwright : parcours clavier (lien d'évitement, menu mobile ouvert / fermé à Échap avec retour du focus), contrôle axe en clair et en sombre sur une page de chaque espace et sur la page 404, profils ordinateur et téléphone.
- Vérification visuelle dans le navigateur aux largeurs 390, 768 et 1440, en clair et en sombre.

## Choix complémentaires (faits par Claude après la relecture de la conception, à vérifier par Enzo)

1. **Référence visuelle versionnée** : `docs/design/maquette-a-editorial.png` (maquette A, ordinateur et téléphone). En cas d'écart, **le tableau « Le style A » ci-dessus fait foi**, avant la capture et avant la fiche Taste Skill. Le logo : deux rectangles arrondis (rayon 2) dans un carré de 22 : `x2 y5 12×15` en couleur primaire à 35 % d'opacité, `x7 y2 12×15` en couleur primaire pleine.
2. **Deux mises en page** :
   - `espace` pour `/etudiant`, `/enseignant`, `/admin` et leurs sous-pages : barre latérale, navigation de l'espace ;
   - `public` pour tout le reste (`/`, la future connexion, le futur portfolio public) : barre haute avec le logo et le bouton de thème, contenu sur une feuille centrée, sans navigation d'espace.
   - La page d'erreur (`app/error.vue`) prend la mise en page `espace`, avec la navigation de l'espace, si l'URL est dans un espace ; sinon la mise en page `public`.
3. **Articulation avec Solène (authentification)** :
   - la mise en page `espace` réserve une zone « compte » en bas de la barre latérale (et en bas du menu sur téléphone), rendue par un composant dédié (`app/components/layout/AccountMenu.vue`). Pour l'instant, il ne contient que le bouton de thème. Solène y ajoutera l'utilisateur connecté et la déconnexion **en ne modifiant que ce composant**, sans toucher aux mises en page.
   - La garde de route est ajoutée par Solène. **La PR qui ajoute la garde adapte les tests E2E existants** (aide de connexion de test), comme pour toute modification qui change un parcours.
4. **Découpage Git** : deux issues et deux PR empilées, plus petites à relire.
   - **Lot 1, C-01, C-02, C-11** : thème, polices, mises en page, navigation, accessibilité clavier, pages d'accueil des espaces.
   - **Lot 2, C-08, C-10** : confirmation, états des blocs de données, notifications d'erreur, page d'erreur. Empilé sur le lot 1.
   - Branches `feature/<n° issue>-<nom>`, empilées sur `feature/5-socle-donnees`, sans attendre la fusion de #5 (reciblées sur `develop` ensuite, comme #4 et #6).

## Laissé au constructeur

- Les nuances exactes des palettes (échelles 50-950) tant que les ancres ci-dessus et le contraste AA sont respectés.
- Le découpage précis en composants et les noms de fichiers, dans le respect des conventions.
- Les icônes Lucide de la navigation (facultatives).
- L'implémentation de la fenêtre de confirmation (overlay programmatique de Nuxt UI ou autre) tant que le comportement décrit est tenu.
