# Identité IUT, espacements réguliers et finitions d'interface (#24)

## Intention

Envie de l'équipe (pas une demande client) : donner à UniFolio les couleurs de l'IUT et une finition plus soignée, sans perdre la sobriété du style éditorial ni l'accessibilité, sur laquelle le client est très exigeant. **Les couleurs de l'IUT sont des accents, jamais majoritaires** : les neutres portent l'essentiel de l'interface.

- **Objectifs** : violet `#4D3677` et jaune `#F7B000` intégrés ; espacements réguliers partout ; finitions typographiques et d'interaction ci-dessous.
- **Non-objectifs** : nouvelles fonctionnalités, changement de police, refonte de la structure des écrans, nouvelles dépendances.
- **Anti-objectifs** (échec même si « ça marche ») : écran violet ou jaune dominant ; texte jaune sur fond clair ; contraste sous AA ; animation qui gêne ou ignore « réduire les animations » ; régression des tests E2E ou d'axe ; décalage de mise en page introduit.

## Couleurs (OKLCH)

Toutes les palettes sont écrites en `oklch()` dans `app/assets/css/main.css` (Tailwind 4 les gère nativement). Chaque gamme 50 → 950 garde la teinte (h) et fait varier la clarté (L) de façon régulière ; la chroma (C) baisse aux extrémités.

| Jeton | Ancre | Rôle | Part de la surface |
|---|---|---|---|
| `violet` (= `primary`) | `#4D3677` ≈ nuance 700 | boutons principaux, liens, élément de navigation actif, anneau de focus, cases cochées | faible |
| `or` (nouvelle couleur, accent) | `#F7B000` ≈ nuance 400 | marqueurs rares : trait de l'élément de navigation actif, pastille du nombre de notifications, `::selection`, détail du logo | très faible (< 5 %) |
| `neutral` | à choisir : `slate` ou un neutre très légèrement teinté vers le violet (C ≤ 0,01) | fonds, textes, bordures | majoritaire |

Règles de contraste (à vérifier, valeurs mesurées sur les ancres) :

- violet 700 sur blanc ≈ 10:1 → texte et boutons en mode clair. En mode sombre, violet 700 sur le fond ≈ 1,8:1 → utiliser violet 300/400 (texte foncé sur bouton plein).
- **jaune sur blanc ≈ 1,9:1 → jamais de texte jaune ni d'information portée par le jaune seul sur fond clair.** Le jaune sert de fond sous un texte très foncé (violet 950 ou neutre 900, ≈ 11:1) ou de décor non porteur d'information. Jaune sur violet ≈ 5,3:1 (AA).
- l'anneau de focus reste violet (clair) / violet clair (sombre), contraste ≥ 3:1 avec le fond.
- `warning` (ambre) reste distinct de l'accent `or` : l'ambre signale un état, l'or ne signale rien.

## Espacements

Une seule échelle, en pas Tailwind (1 pas = 4 px) : **1, 2, 3, 4, 6, 8, 12**. À bannir : `0.5`, `1.5`, `5`, `10` et toute valeur arbitraire.

| Pas | Usage |
|---|---|
| 1 (4 px) | icône ↔ texte, titre ↔ sous-ligne d'une même ligne |
| 2 (8 px) | éléments d'un groupe (badges, boutons côte à côte), lignes d'une liste compacte |
| 3 (12 px) | lignes d'une liste de cartes |
| 4 (16 px) | titre de section → contenu ; marge intérieure des cartes et panneaux sur mobile |
| 6 (24 px) | champs d'un formulaire ; marge intérieure des panneaux à partir de `sm` ; colonnes d'une grille |
| 8 (32 px) | titre de page (h1 + chapeau) → premier bloc |
| 12 (48 px) | entre deux sections d'une page |

Les panneaux (`rounded-panneau bg-muted`) : `p-4 sm:p-6`. Les cartes de liste (`rounded-feuille border`) : `p-4`.

## Typographie

- **Interlignage (leading)** : corps 1,6 ; textes courts d'interface (boutons, badges) 1,25 ; titres 1,15 à 1,25 selon la taille. En jetons dans `main.css`.
- **Longueur de ligne** : 45 à 75 caractères pour tout texte courant (descriptions, aide, chapeaux) : `max-w-prose` ou un jeton `--measure` (≈ 65ch). Les formulaires restent limités à `max-w-2xl`.
- **Veuves** : `text-wrap: pretty` sur les paragraphes, `text-wrap: balance` sur les titres (règles globales dans `main.css`).
- **Chiffres tabulaires** : retirer `font-variant-numeric: tabular-nums` du `body` ; l'appliquer (`tabular-nums`) aux nombres qui s'alignent ou changent : compteurs de caractères, tuiles de statistiques, numéros de position des listes réordonnables, colonnes de dates et de notes.
- **Approche (kerning)** : `font-kerning: normal` et `font-optical-sizing: auto` globalement ; l'interlettrage négatif des titres croît avec la taille (h1 -0,02em, h2 -0,01em, petits titres 0).
- **Hauteur d'x** : Instrument Sans est conservée ; la police de secours doit avoir des métriques ajustées (`size-adjust`, `ascent-override`… générées par `@nuxt/fonts`) pour que le texte ne bouge pas au chargement de la police : vérifier qu'elles sont bien produites.

## Interaction

- **Zones tactiles** : au moins 24 × 24 px partout (WCAG 2.5.8) ; **44 × 44 px sur écran tactile** (`@media (pointer: coarse)`) pour les boutons icône (flèches des listes réordonnables, retirer, supprimer, fermer, menu). Par le thème (`app/app.config.ts`) ou une règle CSS globale, pas bouton par bouton.
- **Zones sûres** : `viewport-fit=cover` dans le `<meta name="viewport">` (`nuxt.config.ts`) et `env(safe-area-inset-*)` sur la barre haute, le menu mobile plein écran et tout élément collé au bord.
- **Décalage de mise en page** : `scrollbar-gutter: stable` sur `html` ; squelettes de chargement (`UiAsyncState`) aux dimensions proches du contenu ; images avec dimensions ou `aspect-ratio` ; aucune zone d'alerte ou de statut qui pousse le contenu en apparaissant si on peut l'éviter.
- **Affordance** : la poignée de glisser-déposer montre `cursor-grab` (et `cursor-grabbing` pendant le glisser) ; les liens dans le texte sont soulignés ; une carte entièrement cliquable a un état de survol et de focus ; un bouton inactif se distingue d'un bouton actif sans dépendre de la seule couleur.
- **Mise à jour optimiste** : déjà en place pour l'ordre des pages et des traces (#18). Règle : toute action locale réversible sur une liste (ordre, retrait) s'affiche tout de suite et se défait en cas d'échec avec une alerte. Pas de nouveau cas imposé.
- **Combobox** : une liste de choix de plus de 7 options, ou dans laquelle on cherche (compétence dans les filtres de « Mes traces », étudiant ou groupe côté enseignant), utilise `USelectMenu` / `UInputMenu` avec recherche, au lieu d'un `USelect` simple. La recherche globale (Ctrl + K) est déjà une palette de commandes.
- **Divulgation progressive** : dans les formulaires longs, les champs secondaires sont regroupés dans une section repliable fermée par défaut, nommée clairement (ex. formulaire de trace : « Plus de détails » pour dates, contexte, déclaration d'usage de l'IA si elle reste « non renseignée »). Une section contenant une erreur s'ouvre d'elle-même et le focus y va.
- **Animations** : toutes sous `motion-safe:` ou désactivées par `prefers-reduced-motion`.
  - **Origine** : menus et fenêtres s'ouvrent depuis leur déclencheur (Nuxt UI le fait déjà pour ses menus via `--reka-*-transform-origin` ; vérifier les composants maison).
  - **Interruptibles** : transitions CSS (pas d'animation à images-clés) pour ouvrir/fermer, afin qu'une action inverse en cours reparte de l'état courant.
  - **Stagger** : non retenu (effet décoratif, retarde la lecture).
  - **Transition d'élément partagé** : amélioration progressive avec l'API View Transitions (`experimental.viewTransition` de Nuxt) sur la navigation liste → détail (portfolios, traces) : le titre de la carte devient le titre de la page. Sans support du navigateur ou avec « réduire les animations », navigation normale.
- **Centre optique** : les éléments centrés dans un cercle ou un carré (numéros de position, icônes seules, chiffres de pastille) sont ajustés à l'œil, pas seulement mathématiquement ; les fenêtres modales et états vides sont légèrement au-dessus du centre géométrique.

## Approches envisagées

1. **Un seul agent pour tout** : simple, mais long et une seule passe de regard ; risque de fatigue sur les derniers écrans.
2. **Socle d'abord, puis un agent par espace en parallèle (retenue)** : le socle (jetons, règles globales, `nuxt.config.ts`, `app.config.ts`, `main.css`, composants partagés) est posé par un seul agent ; ensuite étudiant, enseignant et commun sont traités en parallèle dans des worktrees séparés, sans fichier commun ; relecture croisée et audit d'accessibilité à la fin. Respecte AGENTS.md §5 (fichiers partagés modifiés par un seul agent).
3. **Écran par écran à la demande** : plus sûr, mais les incohérences entre écrans restent jusqu'au bout.

## Laissé au constructeur

Valeurs exactes des gammes OKLCH (dans le respect des contrastes), choix du neutre, détails d'ajustement optique, emplacement des sections repliables autres que le formulaire de trace.

## Vérifications

Lint, format, typage, Vitest, build, Playwright (dont tous les contrôles axe, clair et sombre) ; captures avant/après des écrans principaux, sur ordinateur et sur mobile ; décision consignée dans `docs/DECISIONS.md`.
