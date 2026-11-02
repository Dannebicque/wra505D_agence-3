import { expect, test } from '@playwright/test'
import { gotoHydrated } from './utils'

const NAV_ESPACE = 'Navigation de l’espace'

test.describe('navigation au clavier', () => {
  test('le premier Tab atteint « Aller au contenu », qui mène à la zone principale', async ({
    page,
  }) => {
    await gotoHydrated(page, '/etudiant')

    await page.keyboard.press('Tab')
    const skipLink = page.getByRole('link', { name: 'Aller au contenu' })
    await expect(skipLink).toBeFocused()
    await expect(skipLink).toBeVisible()

    await page.keyboard.press('Enter')
    await expect(page.locator('main#contenu')).toBeFocused()
  })

  // Critère WCAG 1.4.11 : l'indicateur de focus doit être net (opaque, au moins 2 px)
  test('affiche un anneau de focus opaque sur chaque élément atteint au clavier', async ({
    page,
  }) => {
    await gotoHydrated(page, '/')

    for (let stop = 0; stop < 4; stop++) {
      await page.keyboard.press('Tab')
      const readOutline = () =>
        page.evaluate(() => {
          const style = getComputedStyle(document.activeElement as Element)
          return { style: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor }
        })
      // Les boutons animent la couleur du contour (transition-colors) : on attend l'état final.
      // rgb(...) est opaque ; rgba(..., a < 1) ou oklab(... / 0.25) ne le sont pas.
      await expect.poll(async () => (await readOutline()).color).toMatch(/^rgb\(/)
      const outline = await readOutline()
      expect(outline.style).not.toBe('none')
      expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(2)
    }
  })

  // Largeur de téléphone imposée : les tests valent pour les deux profils
  test.describe('menu mobile', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await gotoHydrated(page, '/etudiant')
    })

    test('s’ouvre, garde le focus, se ferme avec Échap et rend le focus', async ({ page }) => {
      const openButton = page.getByRole('button', { name: 'Ouvrir le menu' })
      const nav = page.getByRole('navigation', { name: NAV_ESPACE })
      await expect(nav).toBeHidden()

      await openButton.click()
      const menu = page.getByRole('dialog', { name: 'Menu' })
      await expect(nav).toBeVisible()
      expect(await menu.evaluate((el) => el.contains(document.activeElement))).toBe(true)

      await page.keyboard.press('Escape')
      await expect(menu).toBeHidden()
      await expect(openButton).toBeFocused()

      await openButton.click()
      await nav.getByRole('link', { name: 'Tableau de bord' }).click()
      await expect(menu).toBeHidden()
    })

    // Sur écran tactile, sans clavier ni fond cliquable, il faut un bouton de fermeture
    test('se ferme avec son bouton « Fermer le menu » et rend le focus', async ({ page }) => {
      const openButton = page.getByRole('button', { name: 'Ouvrir le menu' })
      await openButton.click()
      const menu = page.getByRole('dialog', { name: 'Menu' })

      await menu.getByRole('button', { name: 'Fermer le menu' }).click()
      await expect(menu).toBeHidden()
      await expect(openButton).toBeFocused()
    })
  })
})
