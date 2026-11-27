import { compteByUsername } from '../data/comptes'
import { sessionStore } from '../data/sessions'

// Provisoire (phase Nitro) : imite `json_login` de l'API (204 et cookie de session ; 401 sinon,
// sans dire si l'identifiant existe). La limite de 5 essais par minute (429) n'est pas simulée.
export default defineEventHandler(async (event) => {
  const isJson = (getRequestHeader(event, 'content-type') ?? '').includes('json')
  const body: unknown = isJson ? await readBody(event).catch(() => null) : null
  const { username, password } =
    typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}

  if (typeof username !== 'string' || typeof password !== 'string') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Identifiant ou mot de passe manquant.',
    })
  }

  const compte = compteByUsername(username)
  if (!compte || compte.password !== password) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Identifiant ou mot de passe incorrect.',
    })
  }

  // Nouvel identifiant à chaque connexion : une session posée avant (fixation) ne sert à rien
  sessionStore.close(getCookie(event, SESSION_COOKIE))
  setCookie(event, SESSION_COOKIE, sessionStore.open(compte.user.username), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
  setResponseStatus(event, 204)
  return null
})
