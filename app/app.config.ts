// Option active d'une liste (aux flèches comme au survol) : le focus réel est sur l'option
// (tabindex="-1"), sans contour de focus (main.css). Fond plein et anneau prune, comme les
// résultats de la recherche globale : le fond seul, à 50 %, ne se voyait pas (1,1:1).
const ACTIVE_OPTION =
  'data-highlighted:not-data-disabled:before:bg-elevated data-highlighted:not-data-disabled:before:ring-2 data-highlighted:not-data-disabled:before:ring-primary'

export default defineAppConfig({
  ui: {
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
    // lieu de `accented` (1,4 à 1,7:1), gardé pour les contours décoratifs (boutons « outline »…)
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
    button: {
      // Style éditorial : boutons en pilule
      slots: { base: 'rounded-full' },
      compoundVariants: [
        {
          // Au survol, le fond fonce (clair) ou s'éclaircit (sombre) : le texte reste lisible (AA)
          color: 'primary',
          variant: 'solid',
          class:
            'hover:bg-(--ui-color-primary-800) active:bg-(--ui-color-primary-800) dark:hover:bg-(--ui-color-primary-300) dark:active:bg-(--ui-color-primary-300)',
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
