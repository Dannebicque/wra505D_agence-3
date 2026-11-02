import { expect, test } from '@playwright/test'
import { gotoHydrated } from './utils'

const NAV_ESPACE = 'Navigation de l’espace'

test.describe('espaces', () => {
  // La mise en page est choisie dès le rendu serveur : pas de saut visuel au chargement
  test('sert la navigation de l’espace dans le HTML initial, et seulement dans un espace', async ({
    request,
  }) => {
    expect(await (await request.get('/enseignant')).text()).toContain(NAV_ESPACE)
    expect(await (await request.get('/')).text()).not.toContain(NAV_ESPACE)
  })

  test('signale la page courante dans la navigation de l’administration', async ({
    page,
    isMobile,
  }) => {
    await gotoHydrated(page, '/admin')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Administration')

    // Sur téléphone, la navigation est dans le menu (qui masque la page tant qu'il est ouvert)
    if (isMobile) await page.getByRole('button', { name: 'Ouvrir le menu' }).click()
    const nav = page.getByRole('navigation', { name: NAV_ESPACE })
    await expect(nav.getByRole('link', { name: 'Tableau de bord' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  test('change de mise en page en naviguant côté client, dans les deux sens', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await gotoHydrated(page, '/')

    await page.getByRole('link', { name: 'Espace étudiant' }).click()
    await expect(page.getByRole('navigation', { name: NAV_ESPACE })).toBeVisible()
    await expect(page.locator('main')).toHaveCount(1)

    await page.goBack()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('UniFolio')
    await expect(page.getByRole('navigation', { name: NAV_ESPACE })).toHaveCount(0)
    await expect(page.locator('main')).toHaveCount(1)
  })
})

test.describe('cadre sur ordinateur', () => {
  test('garde une barre latérale d’environ 224 px dès 1024 px de large', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await gotoHydrated(page, '/etudiant')

    const box = await page.getByRole('navigation', { name: NAV_ESPACE }).boundingBox()
    expect(box).not.toBeNull()
    // La navigation occupe la largeur de la barre, moins ses marges intérieures
    expect(box!.x + box!.width).toBeGreaterThanOrEqual(190)
  })

  test('décolle la feuille de contenu du bas de la fenêtre', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await gotoHydrated(page, '/etudiant')

    const sheet = await page.locator('[class*="rounded-feuille"]').first().boundingBox()
    expect(sheet).not.toBeNull()
    expect(sheet!.y + sheet!.height).toBeLessThanOrEqual(900 - 7)
  })
})
