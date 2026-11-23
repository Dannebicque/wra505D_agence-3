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
