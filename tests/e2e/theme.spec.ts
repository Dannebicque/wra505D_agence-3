import { expect, test } from '@playwright/test'
import { gotoHydrated } from './utils'

const GOOGLE_FONTS = /fonts\.(googleapis|gstatic)\.com/

test.describe('thème du style éditorial', () => {
  test('charge Instrument Sans depuis l’application, sans requête vers Google', async ({
    page,
  }) => {
    const thirdPartyRequests: string[] = []
    const localFontResponses: number[] = []
    page.on('request', (request) => {
      if (GOOGLE_FONTS.test(request.url())) thirdPartyRequests.push(request.url())
    })
    page.on('response', (response) => {
      if (response.url().includes('/_fonts/')) localFontResponses.push(response.status())
    })

    await gotoHydrated(page, '/')
    // `document.fonts.check` renvoie vrai pour une police absente : on lit l'état réel des fontes
    const loadedFamilies = await page.evaluate(async () => {
      await document.fonts.ready
      return [...document.fonts].filter((font) => font.status === 'loaded').map((f) => f.family)
    })

    expect(loadedFamilies.some((family) => family.includes('Instrument Sans'))).toBe(true)
    expect(localFontResponses.length).toBeGreaterThan(0)
    expect(localFontResponses.every((status) => status === 200)).toBe(true)
    expect(thirdPartyRequests).toEqual([])
  })

  test.describe('bouton d’action en mode clair', () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await gotoHydrated(page, '/')
    })

    test('est sarcelle et en forme de pilule', async ({ page }) => {
      const action = page.getByRole('link', { name: 'Espace étudiant' })

      await expect(action).toHaveCSS('background-color', 'rgb(27, 110, 102)')
      const radius = await action.evaluate((el) =>
        parseFloat(getComputedStyle(el).borderTopLeftRadius),
      )
      expect(radius).toBeGreaterThanOrEqual(100)
    })

    // Au survol, le texte blanc doit rester lisible (contraste AA) : sarcelle 800.
    // Un écran tactile n'a pas de survol (Tailwind le réserve à `@media (hover: hover)`) : le fond ne change pas.
    test('fonce au survol au lieu de s’éclaircir', async ({ page, isMobile }) => {
      const action = page.getByRole('link', { name: 'Espace étudiant' })

      await action.hover()
      await expect(action).toHaveCSS(
        'background-color',
        isMobile ? 'rgb(27, 110, 102)' : 'rgb(24, 88, 82)',
      )
    })
  })

  test('compose les titres en Instrument Sans, en gras', async ({ page }) => {
    await gotoHydrated(page, '/etudiant')

    const titre = page.getByRole('heading', { level: 1 })
    await expect(titre).toHaveCSS('font-weight', '600')
    expect(await titre.evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(
      /^"Instrument Sans"/,
    )
  })
})
