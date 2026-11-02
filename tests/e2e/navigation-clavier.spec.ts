import { expect, test } from '@playwright/test'
import { gotoHydrated } from './utils'

const NAV_ESPACE = 'Navigation de l’espace'

test.describe('navigation au clavier', () => {
  test('le premier Tab atteint « Aller au contenu », qui mène à la zone principale', async ({
    page,
  }) => {
    await gotoHydrated(page, '/etudiant')

    await page.keyboard.press('Tab')
    const lien = page.getByRole('link', { name: 'Aller au contenu' })
    await expect(lien).toBeFocused()
    await expect(lien).toBeVisible()

    await page.keyboard.press('Enter')
    await expect(page.locator('main#contenu')).toBeFocused()
  })

  // Largeur de téléphone imposée : le test vaut pour les deux profils
  test('le menu mobile s’ouvre, garde le focus, se ferme avec Échap et rend le focus', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoHydrated(page, '/etudiant')
    const ouvrir = page.getByRole('button', { name: 'Ouvrir la barre latérale' })
    const nav = page.getByRole('navigation', { name: NAV_ESPACE })
    await expect(nav).toBeHidden()

    await ouvrir.click()
    const menu = page.getByRole('dialog')
    await expect(nav).toBeVisible()
    expect(await menu.evaluate((el) => el.contains(document.activeElement))).toBe(true)

    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(ouvrir).toBeFocused()

    await ouvrir.click()
    await nav.getByRole('link', { name: 'Tableau de bord' }).click()
    await expect(menu).toBeHidden()
  })
})
