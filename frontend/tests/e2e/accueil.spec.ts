import AxeBuilder from '@axe-core/playwright'
import { expect, test } from './fixtures'
import { gotoHydrated } from './utils'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const TITRE = 'Vos compétences, trace après trace.'

test.describe('accueil', () => {
  // L'accueil est la porte d'entrée d'un visiteur : aucun compte ouvert
  test.use({ compte: null })

  test('affiche la page en français avec un seul titre principal et ses repères', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(page).toHaveTitle('Accueil · UniFolio')
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(TITRE)
    await expect(page.getByRole('banner')).toHaveCount(1)
    await expect(page.getByRole('contentinfo')).toHaveCount(1)
    await expect(page.locator('main#contenu')).toHaveCount(1)
    for (const section of ['Comment ça marche', 'Pour les étudiants', 'Essayer la démo']) {
      await expect(page.getByRole('region', { name: section })).toBeVisible()
    }
  })

  // Le titre se révèle en CSS : il est dans le HTML du serveur, lisible sans JavaScript
  test('sert le titre sans JavaScript', async ({ request }) => {
    const html = await (await request.get('/')).text()

    expect(html).toContain('Vos compétences,')
  })

  test('connecte au compte de démonstration de l’espace choisi, d’un seul clic', async ({
    page,
  }) => {
    await gotoHydrated(page, '/')
    const demo = page.getByRole('region', { name: 'Essayer la démo' })

    await expect(demo.getByRole('button', { name: /^Espace étudiant, / })).toBeVisible()
    await expect(demo.getByRole('button', { name: /^Administration, / })).toBeVisible()

    await demo.getByRole('button', { name: /^Espace enseignant, / }).click()
    await expect(page).toHaveURL(/\/enseignant$/)
  })

  test('propose « Se connecter » et « Essayer la démo » dans le premier écran', async ({
    page,
  }) => {
    await gotoHydrated(page, '/')
    const premierEcran = page.getByRole('region', { name: TITRE })

    await expect(premierEcran.getByRole('link', { name: 'Se connecter' })).toHaveAttribute(
      'href',
      '/connexion',
    )
    await premierEcran.getByRole('link', { name: 'Essayer la démo' }).click()
    await expect(page).toHaveURL(/#demo$/)
  })

  test('bascule l’aperçu entre la vue étudiant et la vue enseignant au clavier', async ({
    page,
  }) => {
    await gotoHydrated(page, '/')
    const apercu = page.getByRole('region', { name: 'Aperçu de l’interface' })
    const etudiant = apercu.getByRole('button', { name: 'Vue étudiant' })
    const enseignant = apercu.getByRole('button', { name: 'Vue enseignant' })

    await expect(etudiant).toHaveAttribute('aria-pressed', 'true')
    await expect(apercu.getByRole('list', { name: /Progression de Léa Martin/ })).toBeVisible()
    await expect(apercu.getByRole('heading', { name: 'Évaluations en attente' })).toBeHidden()

    await etudiant.focus()
    await page.keyboard.press('Tab')
    await expect(enseignant).toBeFocused()
    await page.keyboard.press('Enter')

    await expect(enseignant).toHaveAttribute('aria-pressed', 'true')
    await expect(etudiant).toHaveAttribute('aria-pressed', 'false')
    await expect(apercu.getByRole('heading', { name: 'Évaluations en attente' })).toBeVisible()
    await expect(apercu.getByRole('list', { name: /Progression de Léa Martin/ })).toBeHidden()

    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Space')
    await expect(etudiant).toHaveAttribute('aria-pressed', 'true')
  })

  // L'aperçu se lit mais ne se manipule pas : seule la bascule y est focalisable
  test('ne met aucun élément focalisable dans l’aperçu, hors la bascule', async ({ page }) => {
    await gotoHydrated(page, '/')
    const apercu = page.getByRole('region', { name: 'Aperçu de l’interface' })

    const focalisables = apercu.locator(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    await expect(focalisables).toHaveCount(2)
    await expect(focalisables.nth(0)).toHaveAccessibleName('Vue étudiant')
    await expect(focalisables.nth(1)).toHaveAccessibleName('Vue enseignant')
  })

  test('propose un bouton de thème libellé en français', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await gotoHydrated(page, '/')

    await page.getByRole('button', { name: 'Passer en mode sombre' }).click()

    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.getByRole('button', { name: 'Passer en mode clair' })).toBeVisible()
  })

  test('ne défile pas horizontalement à 320 px, titre sur deux lignes', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await gotoHydrated(page, '/')

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)

    const h1 = page.getByRole('heading', { level: 1 })
    const { height, lineHeight } = await h1.evaluate((el) => ({
      height: el.getBoundingClientRect().height,
      lineHeight: parseFloat(getComputedStyle(el).lineHeight),
    }))
    expect(height).toBeLessThan(lineHeight * 2.5)
  })

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`ne présente aucune violation d’accessibilité WCAG A/AA (mode ${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
      await gotoHydrated(page, '/')
      await expect(page.locator('html')).toContainClass(colorScheme)

      const etudiant = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
      expect(etudiant.violations).toEqual([])

      // Vue enseignant de l'aperçu (fondu terminé avant l'analyse)
      await page.getByRole('button', { name: 'Vue enseignant' }).click()
      await expect(page.getByRole('heading', { name: 'Évaluations en attente' })).toBeVisible()
      const enseignant = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
      expect(enseignant.violations).toEqual([])
    })
  }
})
