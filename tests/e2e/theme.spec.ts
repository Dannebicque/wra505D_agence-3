import { expect, test } from '@playwright/test'
import { gotoHydrated } from './utils'

const GOOGLE_FONTS = /fonts\.(googleapis|gstatic)\.com/

test.describe('thème du style éditorial', () => {
  test('charge Instrument Sans depuis l’application, sans requête vers Google', async ({
    page,
  }) => {
    const requetesTierces: string[] = []
    page.on('request', (request) => {
      if (GOOGLE_FONTS.test(request.url())) requetesTierces.push(request.url())
    })

    await gotoHydrated(page, '/')
    const police = await page.evaluate(async () => {
      await document.fonts.ready
      return {
        chargee: document.fonts.check('16px "Instrument Sans"'),
        famille: getComputedStyle(document.body).fontFamily,
      }
    })

    expect(police.chargee).toBe(true)
    expect(police.famille.startsWith('"Instrument Sans"')).toBe(true)
    expect(requetesTierces).toEqual([])
  })

  test('colore les actions en sarcelle en mode clair', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await gotoHydrated(page, '/')

    const action = page.getByRole('link', { name: 'Espace étudiant' })
    await expect(action).toHaveCSS('background-color', 'rgb(27, 110, 102)')
  })
})
