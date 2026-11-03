import type { LocationQuery } from 'vue-router'

/**
 * Critères de filtre synchronisés avec l'URL, dans les deux sens :
 * - modifier un critère réécrit l'URL (sans nouvelle entrée d'historique à chaque frappe) ;
 * - changer l'URL (retour arrière, lien du menu vers la liste sans paramètres) met à jour les critères.
 * `parse` doit ramener toute valeur inconnue à sa valeur par défaut ; `serialize` ne garder que
 * les critères qui diffèrent des valeurs par défaut.
 */
export function useQueryCriteria<T extends object>(
  parse: (query: LocationQuery) => T,
  serialize: (criteria: T) => Record<string, string>,
): T {
  const route = useRoute()
  const router = useRouter()
  // Pendant la sortie de la page, la route change déjà : on ne touche plus à l'URL
  const path = route.path

  const criteria = reactive(parse(route.query)) as T
  const same = (a: Record<string, string>, b: Record<string, string>) =>
    JSON.stringify(a) === JSON.stringify(b)

  watch(
    () => route.query,
    (query) => {
      if (route.path !== path) return
      const next = parse(query)
      if (!same(serialize(next), serialize(criteria))) Object.assign(criteria, next)
    },
  )

  watch(
    () => serialize(criteria),
    (query) => {
      if (route.path !== path) return
      if (!same(query, serialize(parse(route.query)))) router.replace({ query })
    },
  )

  return criteria
}
