import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from './fixtures'
import { gotoHydrated } from './utils'

// Pages-projets d'un portfolio (E-PG-01, E-PG-04, E-TR-08) : ce qui est fait survit au rechargement.
// Chaque test a son propre navigateur, donc son propre cookie de démo et ses propres données.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const pagesList = (page: Page) => page.getByRole('list', { name: 'Pages du portfolio' })
const pageTitles = (page: Page) => pagesList(page).getByRole('listitem').locator('p.font-medium')
const tracesList = (page: Page) => page.getByRole('list', { name: 'Traces de la page' })
const traceTitles = (page: Page) => tracesList(page).getByRole('listitem').locator('p.font-medium')

/** Attend l'enregistrement (PATCH) déclenché par `action`. */
async function saved(page: Page, path: string, action: () => Promise<void>) {
  const response = page.waitForResponse(
    (r) => r.url().endsWith(path) && r.request().method() === 'PATCH',
  )
  await action()
  expect((await response).status()).toBe(200)
}

test.describe('organiser les pages d’un portfolio', () => {
  test('au clavier : le nouvel ordre est annoncé, enregistré et gardé au rechargement', async ({
    page,
  }) => {
    await gotoHydrated(page, '/etudiant/portfolios/1')
    await expect(pageTitles(page)).toHaveText([
      'Refonte du site du BDE',
      'Festival Court Toujours',
      'Étude UX de l’appli Fil Bleu',
    ])

    const down = page.getByRole('button', { name: 'Descendre « Refonte du site du BDE »' })
    await down.focus()
    await saved(page, '/api/portfolios/1', () => page.keyboard.press('Enter'))

    // Le focus suit la page déplacée, et sa nouvelle position est annoncée
    await expect(down).toBeFocused()
    await expect(
      page
        .getByRole('status')
        .filter({ hasText: '« Refonte du site du BDE » : position 2 sur 3.' }),
    ).toHaveCount(1)

    await page.reload()
    await expect(pageTitles(page)).toHaveText([
      'Festival Court Toujours',
      'Refonte du site du BDE',
      'Étude UX de l’appli Fil Bleu',
    ])
  })

  test('à la souris : une page glissée en tête y reste au rechargement', async ({
    page,
    isMobile,
  }) => {
    // Le glisser-déposer est réservé à la souris ; sur écran tactile, les flèches le remplacent
    test.skip(isMobile, 'glisser-déposer à la souris uniquement')
    await gotoHydrated(page, '/etudiant/portfolios/1')

    const rows = pagesList(page).getByRole('listitem')
    await saved(page, '/api/portfolios/1', () => rows.nth(2).dragTo(rows.nth(0)))

    await page.reload()
    await expect(pageTitles(page).first()).toHaveText('Étude UX de l’appli Fil Bleu')
  })

  test('crée une page, la retrouve au rechargement, puis la supprime', async ({ page }) => {
    await gotoHydrated(page, '/etudiant/portfolios/1')

    await page.getByRole('button', { name: 'Ajouter une page' }).click()
    await page.getByRole('textbox', { name: /Intitulé de la nouvelle page/ }).fill('Jeu sérieux')
    await page.getByRole('button', { name: 'Ajouter la page' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'ajoutée' })).toHaveCount(1)
    // Le formulaire se ferme et le focus revient au bouton qui l'a ouvert
    await expect(page.getByRole('button', { name: 'Ajouter une page' })).toBeFocused()

    await page.reload()
    await expect(pageTitles(page).last()).toHaveText('Jeu sérieux')

    await page.getByRole('button', { name: 'Supprimer la page « Jeu sérieux »' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Supprimer la page' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'supprimée' })).toHaveCount(1)

    await page.reload()
    await expect(pagesList(page)).not.toContainText('Jeu sérieux')
  })

  test('refuse une page sans intitulé et l’explique sous le champ', async ({ page }) => {
    await gotoHydrated(page, '/etudiant/portfolios/1')

    await page.getByRole('button', { name: 'Ajouter une page' }).click()
    await page.getByRole('button', { name: 'Ajouter la page' }).click()

    const field = page.getByRole('textbox', { name: /Intitulé de la nouvelle page/ })
    await expect(field).toBeFocused()
    await expect(field).toHaveAccessibleDescription(/L’intitulé est obligatoire/)

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
    expect(results.violations).toEqual([])
  })
})

test.describe('organiser les traces d’une page', () => {
  test('ajoute une trace, la remonte au clavier, et retrouve l’ordre au rechargement', async ({
    page,
  }) => {
    await gotoHydrated(page, '/etudiant/portfolios/1/pages/1')
    await expect(traceTitles(page)).toHaveText([
      'Refonte du site du BDE',
      'API de réservation de salles',
    ])

    // Les traces des autres pages du portfolio ne sont pas proposées (E-TR-06 retirée)
    const available = page.getByRole('group', { name: 'Traces disponibles' })
    await expect(available.getByRole('checkbox')).toHaveCount(2)
    await expect(available).not.toContainText('Affiche du festival Court Toujours')

    await available.getByRole('checkbox', { name: /Générique des portes ouvertes/ }).check()
    await saved(page, '/api/pages/1', () =>
      page.getByRole('button', { name: /Ajouter la sélection/ }).click(),
    )
    await expect(
      page.getByRole('status').filter({ hasText: 'ajoutée en fin de page' }),
    ).toHaveCount(1)

    const up = page.getByRole('button', { name: 'Monter « Générique des portes ouvertes »' })
    await up.focus()
    await saved(page, '/api/pages/1', () => page.keyboard.press('Enter'))

    await page.reload()
    await expect(traceTitles(page)).toHaveText([
      'Refonte du site du BDE',
      'Générique des portes ouvertes',
      'API de réservation de salles',
    ])

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
    expect(results.violations).toEqual([])
  })

  test('retire une trace de la page : elle redevient disponible, même après rechargement', async ({
    page,
  }) => {
    await gotoHydrated(page, '/etudiant/portfolios/1/pages/1')

    await saved(page, '/api/pages/1', () =>
      page
        .getByRole('button', { name: 'Retirer « API de réservation de salles » de la page' })
        .click(),
    )
    await expect(page.getByRole('heading', { name: 'Traces de la page' })).toBeFocused()

    await page.reload()
    await expect(traceTitles(page)).toHaveText(['Refonte du site du BDE'])
    await expect(
      page
        .getByRole('group', { name: 'Traces disponibles' })
        .getByRole('checkbox', { name: /API de réservation de salles/ }),
    ).toBeVisible()
  })

  test('renomme la page : le fil d’Ariane et la liste du portfolio suivent', async ({ page }) => {
    await gotoHydrated(page, '/etudiant/portfolios/1/pages/2')

    const title = page.getByRole('textbox', { name: /Intitulé/ })
    await title.fill('Festival Court Toujours 2026')
    await saved(page, '/api/pages/2', () =>
      page.getByRole('button', { name: 'Enregistrer la page' }).click(),
    )
    await expect(page.getByRole('status').filter({ hasText: 'Page enregistrée.' })).toHaveCount(1)
    await expect(page.getByRole('navigation', { name: 'Fil d’Ariane' })).toContainText(
      'Festival Court Toujours 2026',
    )

    await gotoHydrated(page, '/etudiant/portfolios/1')
    await expect(pagesList(page)).toContainText('Festival Court Toujours 2026')
  })
})
