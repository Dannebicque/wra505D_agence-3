import type { ApiFetchOptions } from '~/services/api'

/**
 * Options des appels faits pendant le rendu serveur : transmet le cookie du visiteur
 * (session de démonstration, puis authentification). Sans lui, le serveur répondrait comme
 * à un inconnu. Côté navigateur, le cookie part tout seul. À appeler dans `setup`.
 */
export function useApiRequestOptions(): ApiFetchOptions {
  return { headers: useRequestHeaders(['cookie']) }
}
