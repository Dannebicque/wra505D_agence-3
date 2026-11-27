import { sessionStore } from '../data/sessions'

// Provisoire (phase Nitro) : ferme la session simulée ; 204, même sans session (comme l'API).
export default defineEventHandler((event) => {
  sessionStore.close(getCookie(event, SESSION_COOKIE))
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
  setResponseStatus(event, 204)
  return null
})
