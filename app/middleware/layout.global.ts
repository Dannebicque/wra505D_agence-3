// Choisit la mise en page selon l'espace visité, au rendu serveur comme côté client :
// aucune page n'a besoin de déclarer sa mise en page, et il n'y a pas de saut visuel au chargement.
export default defineNuxtRouteMiddleware((to) => {
  setPageLayout(espaceFromPath(to.path) ? 'espace' : 'default')
})
