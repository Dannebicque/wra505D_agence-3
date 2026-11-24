// Bascule vers ApiPlatform (Sprint 4) : si NUXT_API_PROXY est renseigné (ex. http://localhost:8000), toute requête
// /api/** est relayée vers l'API, au lieu des routes Nitro factices de server/api/. Le navigateur et le rendu serveur
// restent sur la même origine : le cookie de session, les fichiers (/api/fichiers/…) et les erreurs passent tels quels,
// sans CORS. Vide : routes factices, comme avant (chaque écran peut basculer à son rythme, voir docs/BASCULE-API.md).
export default defineEventHandler((event) => {
  const cible = useRuntimeConfig(event).apiProxy
  if (!cible || !event.path.startsWith('/api/')) return

  // L'API compte les essais de connexion par adresse IP : elle doit voir celle du visiteur, pas celle de Nuxt
  // (le serveur Nuxt doit être déclaré dans TRUSTED_PROXIES de l'API)
  const ip = getRequestIP(event, { xForwardedFor: false })
  return proxyRequest(event, `${cible.replace(/\/$/, '')}${event.path}`, {
    headers: {
      'x-forwarded-for': ip ?? '',
      'x-forwarded-proto': getRequestProtocol(event, { xForwardedProto: false }),
      'x-forwarded-host': getRequestHost(event, { xForwardedHost: false }),
    },
  })
})
