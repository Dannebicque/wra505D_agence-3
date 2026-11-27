import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from './fixtures'
import { gotoHydrated } from './utils'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
// Signature PNG suivie de quelques octets : reconnu comme une image PNG par le serveur
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4, 5, 6, 7, 8])

async function startImageTrace(page: Page, titre: string) {
  await gotoHydrated(page, '/etudiant/traces/nouvelle')
  await page.getByRole('textbox', { name: /Titre/ }).fill(titre)
  await page.getByRole('radio', { name: 'Image' }).check()
}

async function chooseFile(page: Page, name: string, mimeType: string, buffer: Buffer) {
  await page.locator('input[type="file"]').setInputFiles({ name, mimeType, buffer })
}

test.describe('fichiers image et PDF', () => {
  test('dépose une image, la décrit et finalise la trace', async ({ page }) => {
    await startImageTrace(page, 'Affiche de la nuit de l’info')
    await chooseFile(page, 'affiche.png', 'image/png', PNG)
    await expect(page.getByText('affiche.png', { exact: true })).toBeVisible()
    await page
      .getByRole('textbox', { name: /Légende/ })
      .fill('Affiche violette, un hibou au centre')

    await page.getByRole('button', { name: 'Finaliser la trace' }).click()

    await expect(page).toHaveURL(/\/etudiant\/traces$/)
    const row = page.getByRole('listitem').filter({ hasText: 'Affiche de la nuit de l’info' })
    await expect(row).toContainText('Image')
    await expect(row).toContainText('Finalisée')
  })

  test('réserve le fichier au visiteur qui l’a déposé', async ({ page, browser }) => {
    await startImageTrace(page, 'Photo du tournage')
    await chooseFile(page, 'tournage.png', 'image/png', PNG)
    const href = await page.getByRole('link', { name: /Ouvrir/ }).getAttribute('href')
    expect(href).toMatch(/^\/api\/fichiers\/[0-9a-f-]{36}$/)

    const own = await page.request.get(href ?? '')
    expect(own.status()).toBe(200)
    expect(own.headers()['content-type']).toBe('image/png')
    expect(own.headers()['x-content-type-options']).toBe('nosniff')

    const stranger = await browser.newContext()
    const other = await stranger.request.get(new URL(href ?? '', page.url()).toString())
    expect(other.status()).toBe(404)
    await stranger.close()
  })

  test('refuse un faux fichier image, sans l’envoyer, et l’explique', async ({ page }) => {
    await startImageTrace(page, 'Logo')
    await chooseFile(page, 'logo.png', 'image/png', Buffer.from('<svg onload="alert(1)"></svg>'))

    // Message visible sous le champ (et répété dans la zone annoncée aux lecteurs d'écran)
    await expect(
      page.getByText('Choisissez une image JPEG, PNG, WebP ou GIF.').first(),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: /Ouvrir/ })).toHaveCount(0)
  })

  test('exige une légende pour finaliser une image', async ({ page }) => {
    await startImageTrace(page, 'Affiche sans légende')
    await chooseFile(page, 'affiche.png', 'image/png', PNG)
    await expect(page.getByText('affiche.png', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Finaliser la trace' }).click()

    await expect(
      page.getByText('Ajoutez une légende décrivant l’image avant de finaliser.'),
    ).toBeVisible()
    await expect(page.getByRole('textbox', { name: /Légende/ })).toBeFocused()
  })

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`le formulaire d’une trace image ne présente aucune violation WCAG A/AA (mode ${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme })
      await startImageTrace(page, 'Accessibilité')

      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()

      expect(results.violations).toEqual([])
    })
  }

  test('place le focus sur le bouton du fichier après « Finaliser » sans fichier', async ({
    page,
  }) => {
    await startImageTrace(page, 'Sans fichier')
    await page.getByRole('textbox', { name: /Légende/ }).fill('Une affiche')

    await page.getByRole('button', { name: 'Finaliser la trace' }).click()

    await expect(
      page.getByText('Ajoutez le contenu de la trace avant de la finaliser.').first(),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Image Choisir un fichier' })).toBeFocused()
  })
})

// Contrôles du serveur, sans passer par le formulaire (une requête peut être forgée)
test.describe('routes des fichiers', () => {
  test('refuse un faux fichier envoyé directement', async ({ page }) => {
    await gotoHydrated(page, '/etudiant/traces')

    const response = await page.request.post('/api/fichiers', {
      multipart: {
        type: 'image',
        fichier: { name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from('<svg></svg>') },
      },
    })

    expect(response.status()).toBe(422)
    expect(JSON.stringify(await response.json())).toContain(
      'Choisissez une image JPEG, PNG, WebP ou GIF.',
    )
  })

  test('refuse un envoi sans type de trace', async ({ page }) => {
    await gotoHydrated(page, '/etudiant/traces')

    const response = await page.request.post('/api/fichiers', {
      multipart: { fichier: { name: 'a.png', mimeType: 'image/png', buffer: PNG } },
    })

    expect(response.status()).toBe(422)
  })

  test('refuse une trace qui référence le fichier d’un autre visiteur', async ({
    page,
    browser,
  }) => {
    await gotoHydrated(page, '/etudiant/traces')
    const upload = await page.request.post('/api/fichiers', {
      multipart: { type: 'image', fichier: { name: 'a.png', mimeType: 'image/png', buffer: PNG } },
    })
    const fichier = (await upload.json()) as { '@id': string }

    const stranger = await browser.newContext({ baseURL: new URL(page.url()).origin })
    const response = await stranger.request.post('/api/traces', {
      data: {
        titre: 'Vol',
        type: 'image',
        contenu: [fichier['@id']],
        legende: 'Image volée',
        statut: 'brouillon',
      },
    })
    const body = JSON.stringify(await response.json())
    await stranger.close()

    expect(response.status()).toBe(422)
    expect(body).toContain('Déposez un fichier du bon format avant de l’associer.')
  })
})
