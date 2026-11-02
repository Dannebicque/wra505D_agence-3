import type { TraceInput } from '#shared/types/trace'
import { createTrace, getTrace, listTraces, updateTrace } from '~/services/trace'

/** Traces de l'étudiant : lecture, création, modification. */
export const useTraceStore = defineStore('trace', () => {
  // Capturées à la création du store (dans `setup`) : le contexte Nuxt est perdu après un `await`
  const requestOptions = useApiRequestOptions()

  const list = () => listTraces(requestOptions)
  const get = (id: string) => getTrace(id, requestOptions)

  /** Crée la trace (`id` nul) ou la modifie, et renvoie la trace enregistrée. */
  const save = (id: string | null, input: TraceInput) =>
    id ? updateTrace(id, input) : createTrace(input)

  return { list, get, save }
})
