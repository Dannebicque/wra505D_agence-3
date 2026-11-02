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

  test('affiche les compteurs', async ({ page }) => {
    const counters = page.getByRole('region', { name: 'En chiffres' })
    await expect(counters).toContainText(/Traces déposées\s*8/)
    await expect(counters).toContainText(/Évaluations acquises\s*3\s*sur 8/)
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
})
