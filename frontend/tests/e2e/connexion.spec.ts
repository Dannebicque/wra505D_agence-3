import AxeBuilder from '@axe-core/playwright'
import { expect, loginAs, test } from './fixtures'
import { gotoHydrated } from './utils'

// Connexion réelle (C-13) sur la doublure Nitro : mêmes comptes, mêmes réponses que l'API

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

/** Page de connexion qui ramènera à `redirect` : `/` y est encodé ou non selon le côté du rendu. */
function connexionVers(redirect: string) {
  return (url: URL) =>
    url.pathname === '/connexion' && url.searchParams.get('redirect') === redirect
}

test.describe('connexion', () => {
  test.use({ compte: null })

  test('mène à la page demandée après la connexion, puis déconnecte', async ({
    page,
    isMobile,
  }) => {
    await gotoHydrated(page, '/etudiant/traces')
    await expect(page).toHaveURL(connexionVers('/etudiant/traces'))

    await page.getByRole('textbox', { name: 'Identifiant universitaire' }).fill('etudiant')
    await page.getByLabel('Mot de passe', { exact: true }).fill('mauvais')
    await page.getByRole('button', { name: 'Se connecter' }).click()
    await expect(page.getByRole('alert')).toContainText('Identifiant ou mot de passe incorrect.')

    await page.getByLabel('Mot de passe', { exact: true }).fill('test')
    await page.getByRole('button', { name: 'Se connecter' }).click()
    await expect(page).toHaveURL(/\/etudiant\/traces$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mes traces')

    // Sur téléphone, le compte est au bas du menu
    if (isMobile) await page.getByRole('button', { name: 'Ouvrir le menu' }).click()
    const compte = isMobile ? page.getByRole('dialog') : page
    await expect(compte.getByText('Léa Martin', { exact: true })).toBeVisible()
    await compte.getByRole('button', { name: 'Se déconnecter' }).click()
    await expect(page).toHaveURL(/\/connexion$/)

    // La session est bien fermée : l'espace renvoie de nouveau à la connexion
    await gotoHydrated(page, '/etudiant')
    await expect(page).toHaveURL(connexionVers('/etudiant'))
  })

  test('renvoie vers son espace un utilisateur qui n’a pas le rôle demandé', async ({ page }) => {
    await loginAs(page, 'etudiant')
    await gotoHydrated(page, '/enseignant/evaluations')
    await expect(page).toHaveURL(/\/etudiant$/)
  })

  test('renvoie un utilisateur déjà connecté de la connexion vers son espace', async ({ page }) => {
    await loginAs(page, 'enseignant')
    await gotoHydrated(page, '/connexion')
    await expect(page).toHaveURL(/\/enseignant$/)
  })

  test('l’API refuse tout appel sans session, sauf la connexion', async ({ request }) => {
    expect((await request.get('/api/traces')).status()).toBe(401)
    expect((await request.get('/api/me')).status()).toBe(401)
    const refus = await request.post('/api/login', {
      data: { username: 'etudiant', password: 'mauvais' },
    })
    expect(refus.status()).toBe(401)
  })

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`l’erreur de connexion passe axe (mode ${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme })
      await gotoHydrated(page, '/connexion')
      await page.getByRole('textbox', { name: 'Identifiant universitaire' }).fill('inconnu')
      await page.getByLabel('Mot de passe', { exact: true }).fill('x')
      await page.getByRole('button', { name: 'Se connecter' }).click()
      await expect(page.getByRole('alert')).toContainText('Identifiant ou mot de passe incorrect.')

      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
      expect(results.violations).toEqual([])
    })
  }
})
