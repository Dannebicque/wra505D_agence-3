# Passe UI/UX : landing, hiérarchie des actions et profondeur (#32)

Suite de `2026-11-23-identite-iut-design.md` : les couleurs, l'échelle d'espacement et les règles typographiques restent celles-là. Cette passe s'attaque à ce qui a été jugé faible après #24 : une interface plate, des actions sans ordre lisible, des boutons sans caractère, un accueil qui ne ressemble pas à une page d'accueil et des tableaux de bord qui affichent des chiffres plutôt que ce qu'il faut faire.

## Objectifs

- Chaque écran dit ce qu'on peut y faire, et l'action principale est trouvée sans chercher.
- Les actions ont un ordre et une forme fixes dans toute l'application.
- L'interface a des niveaux : on voit ce qui est posé, ce qui se presse, ce qui flotte.
- `/` est une vraie page d'accueil : ce qu'est UniFolio, pour qui, comment ça marche, essayer.
- Les tableaux de bord répondent d'abord à « que dois-je faire maintenant ? ».

Non-objectifs : changer de palette, de police ou de bibliothèque ; ajouter une dépendance ; toucher au back.
Anti-objectifs : prune ou or majoritaires ; dégradés, verre dépoli, ombres décoratives, icônes dans des carrés teintés ; chiffres, témoignages ou logos inventés sur l'accueil ; animation qui retarde la lecture (le stagger reste écarté, voir #24).

## Hiérarchie des actions

| Niveau | Bouton | Usage |
|---|---|---|
| Principale | `UButton` plein, couleur par défaut (prune) | une par écran ; en dernier dans le groupe d'actions (à droite, en bas sur téléphone) |
| Secondaire | `color="neutral" variant="outline"` | autres actions de la page ; fond de la feuille, ombre d'un pixel |
| Tertiaire | `color="neutral" variant="ghost"` | barres d'outils, actions répétées sur chaque ligne |
| Destructive | `color="error"` | `outline` ou `ghost` dans la page, pleine seulement dans la confirmation |
| Dans l'aplat prune | `color="neutral"` + `bg-or-400 text-prune-950` | l'action principale du bloc « À faire maintenant » |

Tous les boutons : pilule, texte en demi-gras, icône à gauche (une flèche à droite seulement pour « aller vers »), enfoncement d'un pixel à l'appui (`translate-y-px`, coupé sous « réduire les animations »), état de chargement avec un libellé qui dit ce qui se passe.

## Relief

- Rien n'a d'ombre au repos, sauf ce qui se presse (`shadow-touche` : reflet en haut, ombre courte) et ce qui flotte (`shadow-flottant` : menus, fenêtres, aperçu de l'accueil).
- Trois surfaces nettes : cadre (`bg-cadre`), feuille (`bg-default`), panneau (`bg-muted`).
- Un aplat prune (`champ-fort`, prune 900, texte blanc) par écran au plus, pour le bloc à lire en premier. Les jetons `--ui-*` sont redéfinis dedans : les composants posés dessus suivent.

## En-tête de page

`UiEnTetePage` : fil d'Ariane (slot `avant`), titre, phrase (`chapeau`), actions (slot `actions`, secondaires puis principale). Sous `sm`, les actions prennent toute la largeur, la principale en bas.

## États vides

`UiAsyncState` accepte `empty-title` et un slot `empty-action` : l'état vide devient un panneau qui dit ce qui manque et propose l'étape suivante.

## Accueil (`/`)

Direction tirée avec taste-skill (« Type and nothing else », seed 555257017), adaptée : la couleur reste minoritaire, donc pas d'aplats pleine page ; la typographie porte la page.

Idée : sur cette page, **le parcours d'une trace** (brouillon → reliée à une compétence → rangée dans le portfolio → évaluée) devient **le fil de lecture**.

1. Barre : logo, liens d'ancre (Comment ça marche, Pour qui, Démo), « Se connecter ».
2. Premier écran : titre très grand sur deux lignes, une phrase qui dit ce qu'est UniFolio, action principale « Se connecter », secondaire « Essayer la démo ». En dessous, un grand aperçu de la vraie interface en HTML, avec une bascule **Vue étudiant / Vue enseignant** : l'élément vivant de la page.
3. Comment ça marche : titre et phrase à gauche, le parcours d'une trace imprimé comme un bordereau (étapes en liste ordonnée, dernière ligne inversée : « Compétence acquise, preuve à l'appui »).
4. Pour qui : la section en aplat prune (`champ-fort`), étudiants et enseignants côte à côte, chacun avec ce qu'il y fait.
5. Démo : les trois accès en grandes lignes cliquables (espace, personne de démo, flèche).
6. Pied : « UniFolio » en grand, IUT de Troyes, projet WRA505.

Animation : titre révélé ligne par ligne au chargement, bascule de l'aperçu en fondu ; rien d'autre ne bouge seul. Tout est coupé sous « réduire les animations ».

## Tableaux de bord

Question de l'écran : « que dois-je faire maintenant, et où j'en suis ? ».

- En-tête : bonjour, le fait du jour en phrase, actions (étudiant : « Mon portfolio » secondaire, « Nouvelle trace » principale ; enseignant : « Évaluer à la suite » principale).
- Bloc « À faire maintenant » en `champ-fort` : de vraies lignes d'action avec un verbe (reprendre un brouillon, lire les retours, associer une compétence sans trace ; enseignant : les évaluations les plus anciennes, l'échéance la plus proche).
- Progression ensuite, chiffre rendu concret.

## Laissé à l'exécution

Libellés exacts, nombre de lignes du bloc « À faire » (3 à 5), répartition des colonnes à chaque largeur, détail des transitions.
