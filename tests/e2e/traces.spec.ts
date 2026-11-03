import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { gotoHydrated } from './utils'

// Chaque test a son propre navigateur, donc son propre cookie de démo : ses traces lui sont propres
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

test.describe('déposer une trace', () => {
  test('crée et finalise une trace, visible dans la liste et sur le tableau de bord', async ({
    page,
  }) => {
    await gotoHydrated(page, '/etudiant/traces')
    await page.getByRole('link', { name: 'Nouvelle trace' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nouvelle trace')

    await page.getByRole('textbox', { name: /Titre/ }).fill('Maquette de l’appli de covoiturage')
    await page
      .getByRole('textbox', { name: /Adresse du lien/ })
      .fill('https://figma.example/covoit')
    await page.getByRole('button', { name: 'Finaliser la trace' }).click()

    await expect(page).toHaveURL(/\/etudiant\/traces$/)
    const row = page
      .getByRole('list', { name: 'Traces' })
      .getByRole('listitem')
      .filter({ hasText: 'Maquette de l’appli de covoiturage' })
    await expect(row).toContainText('Finalisée')

    // Même navigateur, donc même cookie de démo : le tableau de bord compte la nouvelle trace
    await gotoHydrated(page, '/etudiant')
    await expect(page.getByRole('region', { name: 'En chiffres' })).toContainText(
      /Traces déposées\s*9/,
    )
  })

  test('refuse de finaliser une trace sans contenu et l’explique sous le champ', async ({
    page,
  }) => {
    await gotoHydrated(page, '/etudiant/traces/nouvelle')

    await page.getByRole('textbox', { name: /Titre/ }).fill('Sans contenu')
    await page.getByRole('button', { name: 'Finaliser la trace' }).click()

    await expect(
      page.getByText('Ajoutez le contenu de la trace avant de la finaliser.'),
    ).toBeVisible()
    await expect(page).toHaveURL(/\/etudiant\/traces\/nouvelle$/)
  })

  // WCAG 3.3.1 : après un envoi refusé, le focus va au premier champ en erreur
  test('place le focus sur le premier champ en erreur', async ({ page }) => {
    await gotoHydrated(page, '/etudiant/traces/nouvelle')

    await page.getByRole('button', { name: 'Finaliser la trace' }).click()

    await expect(page.getByText('Le titre est obligatoire.')).toBeVisible()
    await expect(page.getByRole('textbox', { name: /Titre/ })).toBeFocused()
  })

  // Pas de bulle native du navigateur (souvent en anglais) : le message s'affiche sous le champ
  test('explique une adresse invalide sous le champ, en français', async ({ page }) => {
    await gotoHydrated(page, '/etudiant/traces/nouvelle')

    await page.getByRole('textbox', { name: /Titre/ }).fill('Adresse invalide')
    await page.getByRole('textbox', { name: /Adresse du lien/ }).fill('pas-une-adresse')
    await page.getByRole('button', { name: 'Finaliser la trace' }).click()

    await expect(
      page.getByText('Saisissez une adresse web valide, commençant par https:// ou http://.'),
    ).toBeVisible()
  })

  test('modifie une trace existante et la repasse en brouillon', async ({ page }) => {
    await gotoHydrated(page, '/etudiant/traces')
    await page.getByRole('link', { name: 'Refonte du site du BDE' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Modifier la trace')

    const titre = page.getByRole('textbox', { name: /Titre/ })
    await expect(titre).toHaveValue('Refonte du site du BDE')
    await titre.fill('Refonte du site du BDE (v2)')
    await page.getByRole('button', { name: 'Enregistrer le brouillon' }).click()

    await expect(page).toHaveURL(/\/etudiant\/traces$/)
    await expect(
      page.getByRole('listitem').filter({ hasText: 'Refonte du site du BDE (v2)' }),
    ).toContainText('Brouillon')
  })
})

test.describe('sauvegarde automatique', () => {
  const saved = (page: import('@playwright/test').Page) =>
    expect(page.getByTestId('etat-sauvegarde')).toContainText('Enregistré à', { timeout: 10_000 })

  test('enregistre une modification sans clic, et elle survit au rechargement', async ({
    page,
  }) => {
    await gotoHydrated(page, '/etudiant/traces/1')

    await page
      .getByRole('textbox', { name: /Titre/ })
      .fill('Refonte du site du BDE, version finale')
    await saved(page)

    await gotoHydrated(page, '/etudiant/traces/1')
    await expect(page.getByRole('textbox', { name: /Titre/ })).toHaveValue(
      'Refonte du site du BDE, version finale',
    )
  })

  test('crée une nouvelle trace en brouillon dès son titre, sans doublon à la finalisation', async ({
    page,
  }) => {
    await gotoHydrated(page, '/etudiant/traces/nouvelle')

    await page.getByRole('textbox', { name: /Titre/ }).fill('Webdoc sur le tram de Tours')
    await saved(page)
    await expect(page).toHaveURL(/\/etudiant\/traces\/\d+$/)

    await page.getByRole('textbox', { name: /Adresse du lien/ }).fill('https://webdoc.example/tram')
    await page.getByRole('button', { name: 'Finaliser la trace' }).click()

    await expect(page).toHaveURL(/\/etudiant\/traces$/)
    const rows = page.getByRole('listitem').filter({ hasText: 'Webdoc sur le tram de Tours' })
    await expect(rows).toHaveCount(1)
    await expect(rows).toContainText('Finalisée')
  })

  test('ne perd rien si l’on quitte la page aussitôt après avoir écrit', async ({
    page,
    isMobile,
  }) => {
    await gotoHydrated(page, '/etudiant/traces/nouvelle')

    await page.getByRole('textbox', { name: /Titre/ }).fill('Note d’intention du court-métrage')
    // Sans attendre le délai de sauvegarde : le changement de page enregistre d'abord
    if (isMobile) await page.getByRole('button', { name: 'Ouvrir le menu' }).click()
    await page
      .getByRole('navigation', { name: 'Navigation de l’espace' })
      .getByRole('link', { name: 'Mes traces' })
      .click()

    await expect(page).toHaveURL(/\/etudiant\/traces$/)
    await expect(
      page.getByRole('listitem').filter({ hasText: 'Note d’intention du court-métrage' }),
    ).toContainText('Brouillon')
  })
})

// /etudiant/traces/1 : trace lien ; /etudiant/traces/2 : trace image (fichier conservé)
for (const path of [
  '/etudiant/traces',
  '/etudiant/traces/nouvelle',
  '/etudiant/traces/1',
  '/etudiant/traces/2',
]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`${path} ne présente aucune violation WCAG A/AA (mode ${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme })
      await gotoHydrated(page, path)

      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()

      expect(results.violations).toEqual([])
    })
  }
}
