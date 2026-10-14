import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { gotoHydrated } from './utils'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

test.describe('accueil', () => {
  test('affiche la page en français avec un titre principal', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle('Accueil · UniFolio')
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
    await expect(page.getByRole('heading', { level: 1, name: 'UniFolio' })).toBeVisible()
  })

  test('propose un bouton de thème libellé en français', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await gotoHydrated(page, '/')

    await page.getByRole('button', { name: 'Passer en mode sombre' }).click()

    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.getByRole('button', { name: 'Passer en mode clair' })).toBeVisible()
  })

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`ne présente aucune violation d’accessibilité WCAG A/AA (mode ${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme })
      await gotoHydrated(page, '/')
      await expect(page.locator('html')).toContainClass(colorScheme)

      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()

      expect(results.violations).toEqual([])
    })
  }
})
