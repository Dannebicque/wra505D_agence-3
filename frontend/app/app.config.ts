// Option active d'une liste (aux flèches comme au survol) : le focus réel est sur l'option
// (tabindex="-1"), sans contour de focus (main.css). Fond plein et anneau prune, comme les
// résultats de la recherche globale : le fond seul, à 50 %, ne se voyait pas (1,1:1).
const ACTIVE_OPTION =
  'data-highlighted:not-data-disabled:before:bg-elevated data-highlighted:not-data-disabled:before:ring-2 data-highlighted:not-data-disabled:before:ring-primary'

export default defineAppConfig({
  ui: {
    // Arrondis du thème (main.css) déclarés à tailwind-merge : sans cela, `class="rounded-feuille"`
    // sur un composant ne remplaçait pas son arrondi (`rounded-full` des boutons) mais s'y ajoutait,
    // et le fond de survol gardait la forme d'une pilule dans une boîte rectangulaire.
    tv: { twMergeConfig: { extend: { theme: { radius: ['feuille', 'panneau'] } } } },
    colors: {
      // Palettes définies dans app/assets/css/main.css : prune (violet de l'IUT) pour l'action,
      // gris très légèrement teinté de prune pour tout le reste
      primary: 'prune',
      neutral: 'gris',
      // Ambre plutôt que jaune : plus lisible en texte (brouillons, alertes) ; distinct de l'accent or
      warning: 'amber',
    },
    // `viewport-fit=cover` (nuxt.config.ts) : les éléments fixés au bord évitent eux-mêmes l'encoche
    // et la barre d'accueil ; Nuxt UI ne le fait pas
    slideover: { slots: { content: 'zone-sure' } },
    toaster: {
      slots: {
        viewport:
          'mt-[env(safe-area-inset-top)] mb-[env(safe-area-inset-bottom)] ms-[env(safe-area-inset-left)] me-[env(safe-area-inset-right)]',
      },
    },
    // Contour des champs et des commandes à au moins 3:1 (WCAG 1.4.11) : `contour` (main.css) au
    // lieu de `accented` (1,55 à 1,9:1), gardé pour les contours décoratifs (boutons « outline »…)
    input: { variants: { variant: { outline: 'ring-contour', subtle: 'ring-contour' } } },
    textarea: { variants: { variant: { outline: 'ring-contour', subtle: 'ring-contour' } } },
    select: {
      slots: { item: ACTIVE_OPTION },
      variants: { variant: { outline: 'ring-contour', subtle: 'ring-contour' } },
    },
    selectMenu: {
      slots: { item: ACTIVE_OPTION },
      variants: { variant: { outline: 'ring-contour', subtle: 'ring-contour' } },
    },
    checkbox: { slots: { base: 'ring-contour' } },
    radioGroup: { slots: { base: 'ring-contour' } },
    // Interrupteur éteint : piste en contour (le curseur, bg-default, s'y détache à 3,7:1 au moins)
    switch: { slots: { base: 'data-[state=unchecked]:bg-contour' } },
    // Fil d'Ariane sous `sm` : les libellés passent à la ligne au lieu d'être tronqués (à 320 px,
    // « Mes portfolios › Portfolio… › … » ne laissait plus rien lire, WCAG 1.4.10)
    breadcrumb: {
      slots: {
        list: 'max-sm:flex-wrap',
        link: 'max-sm:items-start',
        linkLabel: 'max-sm:whitespace-normal max-sm:wrap-break-word',
      },
    },
    // Astérisque des champs requis : visuel seulement (texte de remplacement vide, `content: '*' /
    // ''`), sinon il est lu « étoile » dans le nom du champ. Le champ porte `aria-required`.
    formField: { variants: { required: { true: { label: "after:content-['*'_/_'']" } } } },
    /*
     * Hiérarchie des actions (docs/superpowers/specs/2026-11-23-passe-ui-ux-design.md) :
     * - principale : `color="primary"` plein (par défaut), une seule par écran, placée en dernier
     *   (à droite) dans `UiEnTetePage` ou en bas d'un formulaire ;
     * - secondaire : `color="neutral" variant="outline"` ;
     * - tertiaire : `color="neutral" variant="ghost"` (barres d'outils, actions de ligne) ;
     * - destructive : `color="error"`, pleine seulement dans la confirmation.
     * Relief : les boutons pleins ont un reflet en haut et une ombre portée courte (ils se lisent
     * comme des touches), le secondaire une ombre d'un pixel ; à l'appui, le bouton s'enfonce.
     * Bouton qui porte le lien étendu d'une ligne (`after:absolute after:inset-0`) : ajouter
     * `motion-safe:active:translate-none`. Le décalage ferait du bouton le bloc conteneur de son
     * `::after` : l'overlay se réduirait au bouton entre l'appui et le relâchement, et un clic sur le
     * texte de la ligne ne mènerait nulle part.
     */
    button: {
      // Style éditorial : boutons en pilule
      slots: {
        base: 'rounded-full font-semibold motion-safe:transition-[background-color,box-shadow,color,translate] motion-safe:duration-150 motion-safe:active:translate-y-px',
      },
      compoundVariants: [
        {
          // Au survol, le fond fonce (clair) ou s'éclaircit (sombre) : le texte reste lisible (AA)
          color: 'primary',
          variant: 'solid',
          class:
            'shadow-touche active:shadow-none hover:bg-(--ui-color-primary-800) active:bg-(--ui-color-primary-800) dark:hover:bg-(--ui-color-primary-300) dark:active:bg-(--ui-color-primary-300)',
        },
        {
          color: 'error',
          variant: 'solid',
          class: 'shadow-touche active:shadow-none',
        },
        {
          // Secondaire : fond de la feuille (il se détache d'un panneau gris), ombre d'un pixel,
          // contour renforcé au survol
          color: 'neutral',
          variant: 'outline',
          class:
            'bg-default shadow-xs hover:bg-muted hover:ring-contour active:shadow-none active:bg-elevated',
        },
        {
          // Bouton icône (sans libellé) sur écran tactile : zone de 44 × 44 px au moins, l'icône
          // reste centrée. Partout ailleurs, les tailles de Nuxt UI dépassent déjà 24 px (WCAG 2.5.8).
          square: true,
          class: 'pointer-coarse:min-h-11 pointer-coarse:min-w-11 pointer-coarse:justify-center',
        },
      ],
    },
  },
})
