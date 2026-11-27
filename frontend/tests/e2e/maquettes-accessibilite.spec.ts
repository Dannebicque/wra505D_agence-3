import AxeBuilder from '@axe-core/playwright'
import { compteDe, expect, test } from './fixtures'
import { gotoHydrated } from './utils'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

// Pages maquettes (données de démonstration de app/demo/) : chacune s'affiche et passe axe
const PAGES = [
  '/connexion',
  '/portfolio/lea-martin-2026',
  '/etudiant/portfolios',
  '/etudiant/portfolios/nouveau',
  // Création possible (aucun portfolio cette année) : le formulaire s'affiche
  '/etudiant/portfolios/nouveau?etat=vide',
  '/etudiant/portfolios/2',
  '/etudiant/portfolios/1',
  '/etudiant/portfolios/1/pages/1',
  '/etudiant/portfolios/1/apercu',
  '/etudiant/competences',
  '/etudiant/retours',
  '/etudiant/cv',
  '/etudiant/corbeille',
  '/enseignant/evaluations',
  '/enseignant/evaluations/2',
  '/enseignant/etudiants',
  '/enseignant/etudiants/1',
  '/enseignant/etudiants/1/portfolios/1',
  '/enseignant/bilans',
]

for (const path of PAGES) {
  test.describe(path, () => {
    // Connecté au compte de l’espace visité ; en visiteur hors des espaces (connexion, lien public)
    test.use({ compte: compteDe(path) })

    for (const colorScheme of ['light', 'dark'] as const) {
      test(`${path} s’affiche sans violation WCAG A/AA (mode ${colorScheme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme })
        await gotoHydrated(page, path)
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)

        const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()

        expect(results.violations).toEqual([])
      })
    }
  })
}

test('un portfolio inconnu renvoie une erreur 404', async ({ request }) => {
  expect((await request.get('/portfolio/inconnu')).status()).toBe(404)
})

test('une page introuvable s’explique en français et passe axe', async ({ page }) => {
  await gotoHydrated(page, '/etudiant/portfolios/999')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page introuvable')
  await expect(page.getByText('Portfolio introuvable.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Revenir à l’espace étudiant' })).toBeVisible()

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  expect(results.violations).toEqual([])
})

test('E-PF-10 : la création est bloquée quand le portfolio de l’année existe', async ({ page }) => {
  await gotoHydrated(page, '/etudiant/portfolios/nouveau')
  await expect(page.getByRole('button', { name: 'Créer le portfolio' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Léa Martin, développeuse web' })).toHaveAttribute(
    'href',
    '/etudiant/portfolios/1',
  )
})

test('un portfolio privé ne peut pas être visible par les recruteurs', async ({ page }) => {
  await gotoHydrated(page, '/etudiant/portfolios/2?modifier=informations')
  const recruteurs = page.getByRole('switch', { name: 'Visible par les recruteurs' })
  await expect(recruteurs).toBeDisabled()
  await expect(recruteurs).toHaveAttribute('aria-checked', 'false')
})

test('une adresse inconnue affiche la page d’erreur en français', async ({ page }) => {
  await gotoHydrated(page, '/etudiant/adresse-inconnue')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page introuvable')
  await expect(page.getByText('Cette adresse ne correspond à aucune page.')).toBeVisible()
})
