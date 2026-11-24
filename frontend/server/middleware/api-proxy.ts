// Bascule vers ApiPlatform (Sprint 4) : si NUXT_API_PROXY est renseigné (ex. http://localhost:8000), toute requête
// /api/** est relayée vers l'API au lieu des routes Nitro factices de server/api/ : tout ou rien. Le navigateur et le
// rendu serveur restent sur la même origine : cookie de session, fichiers (/api/fichiers/…) et erreurs passent tels
// quels, sans CORS. Vide : routes factices, comme avant. Voir docs/BASCULE-API.md.
export default defineEventHandler((event) => {
  const cible = apiProxyTarget(event.path, useRuntimeConfig(event).apiProxy)
  if (!cible) return

  // Corps relayé au fil de l'eau, jamais entièrement en mémoire. Taille annoncée au-delà de ce que l'API accepte :
  // refus immédiat ; envoi sans taille annoncée (chunked) : la limite PHP de l'API (post_max_size) s'applique
  if (Number(getRequestHeader(event, 'content-length') ?? 0) > API_PROXY_MAX_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Payload Too Large',
      message: 'Le fichier dépasse la taille maximale (10 Mo).',
    })
  }

  // L'API compte les essais de connexion par adresse IP : elle doit voir celle du visiteur, pas celle de Nuxt
  // (le serveur Nuxt doit être déclaré dans TRUSTED_PROXIES de l'API, et exposé sans autre proxy devant lui).
  // Les X-Forwarded-* envoyés par le client sont remplacés.
  return proxyRequest(event, cible, {
    streamRequest: true,
    headers: {
      // h3 retire Accept par défaut : l'API choisit son format (JSON-LD, JSON) d'après lui
      accept: getRequestHeader(event, 'accept') ?? '*/*',
      'x-forwarded-for': getRequestIP(event, { xForwardedFor: false }) ?? '',
      'x-forwarded-proto': getRequestProtocol(event, { xForwardedProto: false }),
      'x-forwarded-host': getRequestHost(event, { xForwardedHost: false }),
    },
  })
})
