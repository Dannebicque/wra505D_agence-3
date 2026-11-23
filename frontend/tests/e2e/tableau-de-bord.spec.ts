import { expect, test } from '@playwright/test'
import { gotoHydrated } from './utils'

// Données factices de l'étudiante de démo (server/data) : 8 traces dont 2 brouillons,
// 8 validations soumises = 3 acquis, 2 en cours, 1 non acquis, 2 en attente
test.describe('tableau de bord étudiant', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHydrated(page, '/etudiant')
  })

  test('accueille l’étudiante avec le fait du jour et ses deux actions', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bonjour Léa')
    await expect(page.getByText(/Deux traces attendent leur évaluation\./)).toBeVisible()
    // Secondaire puis principale, dans cet ordre
    const actions = page.getByRole('link', { name: /^(Mes portfolios|Nouvelle trace)$/ })
    await expect(actions).toHaveText(['Mes portfolios', 'Nouvelle trace'])
  })

  test('commence par ce qu’il y a à faire, le plus pressant d’abord', async ({ page }) => {
    const todo = page.getByRole('region', { name: 'À faire maintenant' }).getByRole('listitem')
    // 2 retours non lus (démo), 2 brouillons du plus récent au plus ancien ; Entreprendre n'a pas
    // de trace finalisée, mais un brouillon la vise déjà : rien à déposer
    await expect(todo).toHaveCount(3)
    await expect(todo.nth(0)).toContainText('2 nouveaux retours de vos enseignants')
    await expect(todo.nth(1)).toContainText(
      'Terminer « Business model d’une appli de covoiturage »',
    )
    await expect(
      todo.nth(1).getByRole('link', { name: /^Reprendre le brouillon « Business model/ }),
    ).toHaveAttribute('href', /\/etudiant\/traces\/\d+$/)
  })

  test('une ligne prise au clavier se lit comme au survol', async ({ page }) => {
    const row = page
      .getByRole('region', { name: 'À faire maintenant' })
      .getByRole('listitem')
      .nth(1)
    await row.getByRole('link').focus()
    const title = row.getByText(/^Terminer « Business model/)
    await expect
      .poll(() => title.evaluate((el) => getComputedStyle(el).textDecorationLine))
      .toBe('underline')
  })

  test('donne le compte des évaluations acquises', async ({ page }) => {
    // 8 évaluations demandées, dont 2 en attente : 3 acquises sur 6 rendues, 50 %
    const summary = page.getByRole('region', { name: 'Où vous en êtes' })
    await expect(summary).toContainText(
      /3\s*sur 6\s*évaluations rendues sont acquises, soit 50\s*%/,
    )
    await expect(summary).toContainText(/Traces déposées\s*8/)
    await expect(summary).toContainText(/Traces en attente d’évaluation\s*2/)
  })

  test('affiche la progression de chaque compétence', async ({ page }) => {
    const rows = page
      .getByRole('region', { name: 'Progression par compétence' })
      .getByRole('list', { name: 'Progression par compétence' })
      .getByRole('listitem')
    await expect(rows).toHaveCount(5)
    await expect(rows.filter({ hasText: 'Développer' })).toContainText('1 acquis · 1 non acquis')
    await expect(rows.filter({ hasText: 'Entreprendre' })).toContainText('aucune trace associée')
  })

  test('tient en 320 px sans défilement horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    const overflow = await page
      .getByRole('main')
      .evaluate((main) => main.scrollWidth - main.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
