// Provisoire (phase Nitro) : identifie chaque visiteur par un cookie de démonstration, pour que
// ses traces factices lui soient propres. Remplacé par l'utilisateur connecté (authentification).
const COOKIE = 'uf_demo'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export default defineEventHandler((event) => {
  let session = getCookie(event, COOKIE)
  if (!session || !UUID.test(session)) {
    session = crypto.randomUUID()
    setCookie(event, COOKIE, session, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
  }
  event.context.demoSession = session
})
