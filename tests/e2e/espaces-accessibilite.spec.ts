import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { gotoHydrated } from './utils'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

for (const espace of ['/etudiant', '/enseignant', '/admin']) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`${espace} ne présente aucune violation WCAG A/AA (mode ${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme })
      await gotoHydrated(page, espace)
      await expect(page.locator('html')).toContainClass(colorScheme)

      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()

      expect(results.violations).toEqual([])
    })
  }
}
