import { setApiBase } from '~/services/api'

/** Transmet l'origine de l'API à la couche services, une fois au démarrage. */
export default defineNuxtPlugin(() => {
  setApiBase(useRuntimeConfig().public.apiBase)
})
