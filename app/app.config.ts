export default defineAppConfig({
  ui: {
    colors: {
      // Palette définie dans app/assets/css/main.css
      primary: 'sarcelle',
      neutral: 'slate',
      // Ambre plutôt que jaune : plus lisible en texte (brouillons, alertes)
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
      ],
    },
  },
})
