import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { gotoHydrated } from './utils'

// Maquettes de l'espace enseignant (et pages étudiantes corrigées avec elles) : pages
// introuvables, accessibilité des aperçus, filtres dans l'URL, file d'évaluation, focus.

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function expectNoAxeViolation(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  expect(results.violations).toEqual([])
}

for (const path of [
  // Brouillon de Léa : jamais soumis à l'enseignant
  '/enseignant/evaluations/7',
  '/enseignant/etudiants/999',
  // Le portfolio 1 est celui de Léa, pas d'Hugo
  '/enseignant/etudiants/2/portfolios/1',
]) {
  test(`${path} renvoie une erreur 404`, async ({ request }) => {
    expect((await request.get(path)).status()).toBe(404)
  })
}

const AXE_PAGES = [
  '/enseignant/evaluations/1', // trace déjà évaluée, aperçu d'un lien
  '/enseignant/evaluations/3', // aperçu d'un PDF
  '/enseignant/evaluations/4', // aperçu d'une vidéo, trace partiellement évaluée
  '/enseignant/etudiants/3/portfolios/3',
  '/etudiant/retours?vide',
]

for (const path of AXE_PAGES) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`${path} passe axe (mode ${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme })
      await gotoHydrated(page, path)
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      await expectNoAxeViolation(page)
    })
  }
}

for (const colorScheme of ['light', 'dark'] as const) {
  test(`l’aperçu du CV s’affiche sur mobile et passe axe (mode ${colorScheme})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.emulateMedia({ colorScheme })
    await gotoHydrated(page, '/etudiant/cv')

    const apercu = page.getByRole('button', { name: 'Aperçu' })
    await apercu.click()
    await expect(apercu).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('heading', { name: /^Aperçu,/ })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Prénom' })).toBeHidden()

    await expectNoAxeViolation(page)
  })
}

test('la liste des étudiants tient en 375 px sans défilement horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await gotoHydrated(page, '/enseignant/etudiants')

  const table = page.getByRole('table', { name: 'Étudiants suivis' })
  await expect(table.getByRole('columnheader', { name: 'Travaux en attente' })).toBeVisible()
  await expect(table.getByRole('columnheader', { name: 'Année' })).toBeHidden()
  // Année et parcours repris sous le nom
  await expect(table.getByText('BUT MMI 2 · Développement web').first()).toBeVisible()

  const overflow = await table.evaluate((el) => {
    const wrapper = el.parentElement ?? el
    return wrapper.scrollWidth - wrapper.clientWidth
  })
  expect(overflow).toBeLessThanOrEqual(0)
})

test('les filtres des étudiants vivent dans l’URL', async ({ page }) => {
  await gotoHydrated(page, '/enseignant/etudiants?enAttente=1&groupe=inconnu')
  await expect(page.getByRole('checkbox', { name: /travaux en attente/ })).toBeChecked()
  await expect(page.getByRole('main').getByRole('status')).toHaveText(/^\d+ étudiants?$/)

  await page.getByRole('searchbox', { name: 'Rechercher par nom' }).fill('ines')
  await expect(page).toHaveURL(/recherche=ines/)
  await expect(page.getByRole('main').getByRole('status')).toHaveText('1 étudiant')
})

test('« Réinitialiser les filtres » garde le focus et vide l’URL', async ({ page }) => {
  await gotoHydrated(page, '/enseignant/evaluations?statut=tous&etudiant=999')

  // Étudiant inconnu : retombe sur « tous », seul le statut reste un filtre actif
  await expect(page.getByRole('combobox', { name: 'Étudiant' })).toContainText('Tous les étudiants')

  const reset = page.getByRole('button', { name: 'Réinitialiser les filtres' })
  await expect(reset).not.toHaveAttribute('aria-disabled', 'true')
  await reset.click()

  await expect(page).toHaveURL(/\/enseignant\/evaluations$/)
  await expect(reset).toBeFocused()
  await expect(reset).toHaveAttribute('aria-disabled', 'true')
})

test('la file ouverte depuis une fiche étudiant reste sur ses traces', async ({ page }) => {
  // Hugo : deux traces, toutes deux évaluées
  await gotoHydrated(page, '/enseignant/etudiants/2')
  await page.getByRole('link', { name: 'Voir l’évaluation « API d’un jeu de cartes »' }).click()

  await expect(page).toHaveURL(/etudiant=2/)
  await expect(page).toHaveURL(/statut=tous/)
  await expect(page.getByRole('navigation', { name: 'Parcourir les traces' })).toContainText(
    '2 sur 2',
  )
  await expect(page.getByText('C’est la dernière trace de la liste filtrée.')).toBeVisible()

  await page.getByRole('link', { name: 'Revenir à la liste' }).click()
  await expect(page).toHaveURL(/\/enseignant\/evaluations\?/)
  await expect(page.getByRole('main').getByRole('status')).toHaveText('2 traces')
})

test('au changement de page du portfolio, le focus va sur le titre de la page', async ({
  page,
}) => {
  await gotoHydrated(page, '/enseignant/etudiants/1/portfolios/1')
  await page.getByRole('link', { name: /^Page suivante/ }).click()

  const heading = page.getByRole('heading', { level: 2, name: 'Festival Court Toujours' })
  await expect(heading).toBeFocused()
  await expect(page).toHaveTitle(/^Festival Court Toujours/)
})
