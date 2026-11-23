import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { gotoHydrated } from './utils'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

// Maquettes du portfolio et outils communs des espaces (données de app/demo/)

test.describe('adresses introuvables', () => {
  for (const path of [
    // Portfolio privé : même réponse qu'un portfolio inconnu (on ne révèle pas qu'il existe)
    '/portfolio/lea-martin-2025',
    '/etudiant/portfolios/999',
    '/etudiant/portfolios/abc',
    // Page qui appartient à un autre portfolio
    '/etudiant/portfolios/1/pages/3',
  ]) {
    test(`${path} renvoie une erreur 404`, async ({ request }) => {
      expect((await request.get(path)).status()).toBe(404)
    })
  }
})

test.describe('modifier une page-projet', () => {
  test('signale l’oubli de sélection sur le groupe de cases et y place le focus', async ({
    page,
  }) => {
    await gotoHydrated(page, '/etudiant/portfolios/1/pages/1')

    await page.getByRole('button', { name: 'Ajouter la sélection' }).click()

    const group = page.getByRole('group', { name: 'Traces disponibles' })
    await expect(group).toHaveAttribute('aria-invalid', 'true')
    await expect(group).toHaveAccessibleDescription(/Cochez au moins une trace/)
    await expect(group.getByRole('checkbox').first()).toBeFocused()
  })

  test('après l’ajout de toutes les traces, le focus va au titre « Traces de la page »', async ({
    page,
  }) => {
    await gotoHydrated(page, '/etudiant/portfolios/1/pages/1')

    const checkboxes = page.getByRole('group', { name: 'Traces disponibles' }).getByRole('checkbox')
    for (const checkbox of await checkboxes.all()) await checkbox.check()
    await page.getByRole('button', { name: /Ajouter la sélection/ }).click()

    // Les autres traces finalisées de l'étudiante sont dans les autres pages du portfolio
    await expect(
      page.getByText(
        'Vos autres traces finalisées sont déjà dans cette page ou dans une autre page du portfolio.',
      ),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Traces de la page' })).toBeFocused()
  })
})

test.describe('publication d’un portfolio', () => {
  test('un portfolio privé ne peut pas être publié, et le bouton dit pourquoi', async ({
    page,
  }) => {
    await gotoHydrated(page, '/etudiant/portfolios/2')

    const publish = page.getByRole('button', { name: 'Publier', exact: true })
    await expect(publish).toHaveAttribute('aria-disabled', 'true')
    await expect(publish).toHaveAccessibleDescription(/ne peut pas être publié/)

    // Inactif mais focalisable (aria-disabled) : on l'atteint et on l'active au clavier
    await publish.focus()
    await expect(publish).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(
      page.getByRole('status').filter({ hasText: 'Publication impossible' }),
    ).toHaveCount(1)
  })

  test('supprimer une page passe par une confirmation et rend le focus au titre de la section', async ({
    page,
  }) => {
    await gotoHydrated(page, '/etudiant/portfolios/1')

    await page
      .getByRole('button', { name: 'Supprimer la page « Festival Court Toujours »' })
      .click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Annuler' })).toBeFocused()

    await dialog.getByRole('button', { name: 'Supprimer la page' }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Pages-projets' })).toBeFocused()
    await expect(
      page.getByRole('list', { name: 'Pages du portfolio' }).getByText('Festival Court Toujours'),
    ).toHaveCount(0)
    await expect(page.getByRole('status').filter({ hasText: 'supprimée' })).toHaveCount(1)
  })
})

test('la corbeille demande confirmation avant une suppression définitive', async ({ page }) => {
  await gotoHydrated(page, '/etudiant/corbeille')

  const trigger = page.getByRole('button', { name: /^Supprimer définitivement « / }).first()
  const label = (await trigger.getAttribute('aria-label')) ?? ''
  const titre = label.replace(/^Supprimer définitivement « (.*) »$/, '$1')

  // Annuler : rien ne change, le focus revient au bouton
  await trigger.click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Annuler' }).click()
  await expect(trigger).toBeFocused()

  await trigger.click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Supprimer définitivement' })
    .click()

  await expect(page.getByRole('heading', { name: 'Corbeille', level: 1 })).toBeFocused()
  await expect(page.getByRole('heading', { name: titre, level: 2 })).toHaveCount(0)
  await expect(page.getByRole('status').filter({ hasText: titre })).toHaveCount(1)
})

test.describe('outils communs des espaces', () => {
  test('Ctrl + K ouvre la recherche, accessible, et Échap rend le focus au bouton', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await gotoHydrated(page, '/etudiant')

    const searchButton = page.getByRole('button', { name: /Rechercher/ })
    await expect(searchButton).toHaveAttribute('aria-keyshortcuts', 'Control+K')

    await page.keyboard.press('Control+k')
    const dialog = page.getByRole('dialog', { name: 'Recherche globale' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('Rechercher dans UniFolio')).toBeFocused()

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
    expect(results.violations).toEqual([])

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(searchButton).toBeFocused()
  })

  test('le panneau d’aide ouvert ne présente aucune violation WCAG', async ({ page }) => {
    await gotoHydrated(page, '/etudiant/portfolios')

    await page.getByRole('button', { name: 'Aide' }).click()
    const panel = page.getByRole('dialog', { name: 'Composer un portfolio' })
    await expect(panel).toBeVisible()

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
    expect(results.violations).toEqual([])
  })
})
