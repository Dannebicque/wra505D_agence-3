import { expect, test } from '@playwright/test'
import { gotoHydrated } from './utils'

// Données factices de l'étudiante de démo (server/data) : 8 traces dont 2 brouillons,
// 8 validations soumises = 3 acquis, 2 en cours, 1 non acquis, 2 en attente
test.describe('tableau de bord étudiant', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHydrated(page, '/etudiant')
  })

  test('accueille l’étudiante avec le fait du jour', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Bonjour Léa. Deux traces attendent leur évaluation.',
    )
  })

  test('met en avant le taux d’acquisition', async ({ page }) => {
    // 8 évaluations demandées, dont 2 en attente : 3 acquises sur 6 rendues, 50 %
    await expect(page.getByRole('region', { name: 'Vos compétences' })).toContainText(
      /50\s*%\s*de vos évaluations rendues sont acquises\s*\(3 sur 6\)/,
    )
  })

  test('affiche les chiffres secondaires', async ({ page }) => {
    const counters = page.getByRole('region', { name: 'En chiffres' })
    await expect(counters).toContainText(/Traces déposées\s*8/)
    await expect(counters).toContainText(/En cours d’acquisition\s*2/)
    await expect(counters).toContainText(/En attente d’évaluation\s*2/)
  })

  test('affiche la progression de chaque compétence', async ({ page }) => {
    const rows = page
      .getByRole('region', { name: 'Vos compétences' })
      .getByRole('list', { name: 'Progression par compétence' })
      .getByRole('listitem')
    await expect(rows).toHaveCount(5)
    await expect(rows.filter({ hasText: 'Développer' })).toContainText('1 acquis · 1 non acquis')
    await expect(rows.filter({ hasText: 'Entreprendre' })).toContainText('aucune trace associée')
  })

  test('liste les brouillons à terminer', async ({ page }) => {
    const drafts = page.getByRole('region', { name: 'À terminer' })
    await expect(drafts.getByRole('listitem')).toHaveCount(2)
    await expect(drafts).toContainText('Business model d’une appli de covoiturage')
  })

  test('un brouillon pris au clavier se voit sur toute sa carte', async ({ page }) => {
    const card = page
      .getByRole('region', { name: 'À terminer' })
      .getByRole('listitem')
      .filter({ hasText: 'Business model d’une appli de covoiturage' })
    const before = await card.evaluate((el) => getComputedStyle(el).backgroundColor)
    const link = card.getByRole('link')
    await link.focus()
    await expect
      .poll(() => card.evaluate((el) => getComputedStyle(el).backgroundColor))
      .not.toBe(before)
    // Comme au survol, le titre se souligne
    expect(await link.evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe('underline')
  })

  test('tient en 320 px sans défilement horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    const overflow = await page
      .getByRole('main')
      .evaluate((main) => main.scrollWidth - main.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
