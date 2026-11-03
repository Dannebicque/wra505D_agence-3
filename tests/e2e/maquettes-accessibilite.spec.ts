import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
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
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`${path} s’affiche sans violation WCAG A/AA (mode ${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme })
      await gotoHydrated(page, path)
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)

      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()

      expect(results.violations).toEqual([])
    })
  }
}

test('un portfolio inconnu renvoie une erreur 404', async ({ request }) => {
  expect((await request.get('/portfolio/inconnu')).status()).toBe(404)
})
