// Préparation des tests `nuxt` : un composant y est monté seul, hors de `UApp`.
import { config } from '@vue/test-utils'

// `UTooltip` a besoin du fournisseur d'infobulles de `UApp` : dans un montage isolé, on ne garde
// que l'élément qu'elle décore (son nom accessible vient de son aria-label, pas de l'infobulle).
config.global.stubs = { ...config.global.stubs, UTooltip: { template: '<slot />' } }
