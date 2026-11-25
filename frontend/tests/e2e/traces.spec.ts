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
    await expect(page.getByRole('region', { name: 'Où vous en êtes' })).toContainText(
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

  // Noms accessibles du formulaire : sans « étoile » d'obligation, groupe radio nommé, bouton de
  // section nommé par son titre et décrit par sa sous-ligne
  test('donne aux champs du formulaire des noms courts et justes', async ({ page }) => {
    await gotoHydrated(page, '/etudiant/traces/nouvelle')

    const titre = page.getByRole('textbox', { name: 'Titre', exact: true })
    await expect(titre).toHaveAttribute('aria-required', 'true')
    await expect(page.getByRole('group', { name: 'Type de trace' })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Vidéo' })).toBeVisible()
    const details = page.getByRole('button', { name: 'Plus de détails', exact: true })
    await expect(details).toHaveAccessibleDescription(
      'Contexte, date de réalisation, usage de l’intelligence artificielle',
    )
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

  // Divulgation progressive : champs secondaires repliés, mais une erreur ouvre la section
  test('ouvre « Plus de détails » sur une erreur qu’elle contient et y place le focus', async ({
    page,
  }) => {
    await gotoHydrated(page, '/etudiant/traces/nouvelle')
    const details = page.getByRole('button', { name: /Plus de détails/ })
    const date = page.getByLabel('Date de réalisation')
    await expect(details).toHaveAttribute('aria-expanded', 'false')
    await expect(date).toBeHidden()

    await details.click()
    await date.fill('2999-01-01')
    // Refermée par l'étudiant : l'erreur doit la rouvrir
    await details.click()
    await expect(date).toBeHidden()
    await page.getByRole('textbox', { name: /Titre/ }).fill('Trace du futur')
    await page.getByRole('button', { name: 'Enregistrer le brouillon' }).click()

    await expect(details).toHaveAttribute('aria-expanded', 'true')
    await expect(date).toBeFocused()
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

  test('garde le brouillon quand « Finaliser » est refusé puis la saisie complétée', async ({
    page,
  }) => {
    await gotoHydrated(page, '/etudiant/traces/nouvelle')
    await page.getByRole('textbox', { name: /Titre/ }).fill('Storyboard du clip')
    await saved(page)

    await page.getByRole('button', { name: 'Finaliser la trace' }).click()
    await expect(
      page.getByText('Ajoutez le contenu de la trace avant de la finaliser.'),
    ).toBeVisible()
    await page.getByRole('textbox', { name: /Adresse du lien/ }).fill('https://clip.example')
    await saved(page)

    await gotoHydrated(page, '/etudiant/traces')
    await expect(
      page.getByRole('listitem').filter({ hasText: 'Storyboard du clip' }),
    ).toContainText('Brouillon')
  })

  test('retrouve la trace créée automatiquement avec le bouton Retour', async ({
    page,
    isMobile,
  }) => {
    await gotoHydrated(page, '/etudiant/traces/nouvelle')
    await page.getByRole('textbox', { name: /Titre/ }).fill('Affiche de la soirée MMI')
    await saved(page)
    await expect(page).toHaveURL(/\/etudiant\/traces\/\d+$/)

    if (isMobile) await page.getByRole('button', { name: 'Ouvrir le menu' }).click()
    await page
      .getByRole('navigation', { name: 'Navigation de l’espace' })
      .getByRole('link', { name: 'Mes traces' })
      .click()
    await expect(page).toHaveURL(/\/etudiant\/traces$/)
    await page.goBack()

    await expect(page).toHaveURL(/\/etudiant\/traces\/\d+$/)
    await expect(page.getByRole('textbox', { name: /Titre/ })).toHaveValue(
      'Affiche de la soirée MMI',
    )
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

test.describe('rechercher et filtrer mes traces', () => {
  const liste = (page: import('@playwright/test').Page) =>
    page.getByRole('list', { name: 'Traces' }).getByRole('listitem')

  test('trouve une trace par son titre, sans les accents, et annonce le résultat', async ({
    page,
  }) => {
    await gotoHydrated(page, '/etudiant/traces')
    await expect(liste(page)).toHaveCount(8)

    await page.getByRole('searchbox', { name: 'Rechercher' }).fill('etude ux')

    await expect(liste(page)).toHaveCount(1)
    await expect(liste(page)).toContainText('Étude UX de l’appli Fil Bleu')
    await expect(page.getByRole('status').filter({ hasText: /^1 trace$/ })).toBeVisible()
  })

  test('filtre par statut et compétence, retrouve les filtres au retour d’une trace', async ({
    page,
  }) => {
    await gotoHydrated(page, '/etudiant/traces')

    await page.getByRole('combobox', { name: 'Statut' }).click()
    await page.getByRole('option', { name: 'Brouillons' }).click()
    await expect(liste(page)).toHaveCount(2)

    // Liste avec recherche (USelectMenu) : le déclencheur est un bouton, nommé par le libellé et la
    // valeur choisie ; la recherche est un combobox qui a son propre nom
    const competence = page.getByRole('button', { name: /^Compétence/ })
    await expect(competence).toHaveAccessibleName('Compétence Toutes les compétences')
    await competence.click()
    const recherche = page.getByRole('combobox', { name: 'Filtrer les compétences' })
    expect(await recherche.getAttribute('id')).not.toBe(await competence.getAttribute('id'))
    await recherche.fill('entre')
    await page.getByRole('option', { name: 'Entreprendre' }).click()
    await expect(competence).toHaveAccessibleName('Compétence Entreprendre')
    await expect(liste(page)).toHaveCount(1)
    await expect(liste(page)).toContainText('Business model d’une appli de covoiturage')
    await expect(page).toHaveURL(/statut=brouillon/)

    await liste(page).getByRole('link').click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Modifier la trace')
    await page.goBack()

    await expect(liste(page)).toHaveCount(1)
    await expect(page.getByRole('combobox', { name: 'Statut' })).toHaveText(/Brouillons/)
    await expect(competence).toHaveAccessibleName('Compétence Entreprendre')
  })

  test('retrouve la liste filtrée après avoir enregistré une trace', async ({ page }) => {
    await gotoHydrated(page, '/etudiant/traces?statut=brouillon')

    await page.getByRole('link', { name: /^Podcast/ }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Modifier la trace')
    await page.getByRole('button', { name: 'Enregistrer le brouillon' }).click()

    await expect(page).toHaveURL(/\/etudiant\/traces\?statut=brouillon$/)
    await expect(liste(page)).toHaveCount(2)
  })

  test('explique l’absence de résultat et réinitialise les filtres', async ({ page }) => {
    await gotoHydrated(page, '/etudiant/traces?recherche=introuvable')

    await expect(page.getByText('Aucune trace ne correspond à ces critères.')).toBeVisible()
    await expect(page.getByRole('list', { name: 'Traces' })).toHaveCount(0)

    await page.getByRole('button', { name: 'Réinitialiser les filtres' }).click()

    await expect(liste(page)).toHaveCount(8)
    await expect(page).toHaveURL(/\/etudiant\/traces$/)
  })

  test('garde l’espace saisi entre deux mots pendant la frappe', async ({ page }) => {
    await gotoHydrated(page, '/etudiant/traces')
    const recherche = page.getByRole('searchbox', { name: 'Rechercher' })

    await recherche.pressSequentially('fil bleu', { delay: 50 })

    await expect(recherche).toHaveValue('fil bleu')
    await expect(page).toHaveURL(/recherche=fil(\+|%20)bleu/)
    await expect(liste(page)).toHaveCount(1)
  })

  test('garde un titre très long sans espace dans la largeur de l’écran', async ({ page }) => {
    await gotoHydrated(page, '/etudiant/traces/nouvelle')
    const titre = 'a'.repeat(100)
    await page.getByRole('textbox', { name: /Titre/ }).fill(titre)
    await expect(page.getByTestId('etat-sauvegarde')).toContainText('Enregistré à', {
      timeout: 10_000,
    })

    await gotoHydrated(page, '/etudiant/traces')

    const box = await page.getByRole('link', { name: titre }).boundingBox()
    const width = page.viewportSize()?.width ?? 0
    expect((box?.x ?? Infinity) + (box?.width ?? 0)).toBeLessThanOrEqual(width)
  })

  test('ignore une compétence inconnue dans l’adresse', async ({ page }) => {
    await gotoHydrated(page, '/etudiant/traces?competence=999')

    await expect(liste(page)).toHaveCount(8)
    await expect(page.getByRole('button', { name: /^Compétence/ })).toHaveAccessibleName(
      'Compétence Toutes les compétences',
    )
  })
})

// /etudiant/traces/1 : trace lien ; /etudiant/traces/2 : trace image (fichier conservé)
for (const path of [
  '/etudiant/traces',
  '/etudiant/traces?recherche=introuvable',
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
