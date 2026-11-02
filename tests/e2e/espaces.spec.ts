import { expect, test } from '@playwright/test'
import { gotoHydrated } from './utils'

const NAV_ESPACE = 'Navigation de l’espace'

test.describe('espaces', () => {
  // La mise en page est choisie dès le rendu serveur : pas de saut visuel au chargement
  test('sert la navigation de l’espace dans le HTML initial, et seulement dans un espace', async ({
    request,
  }) => {
    expect(await (await request.get('/enseignant')).text()).toContain(NAV_ESPACE)
    expect(await (await request.get('/')).text()).not.toContain(NAV_ESPACE)
  })

  test('signale la page courante dans la navigation de l’administration', async ({
    page,
    isMobile,
  }) => {
    await gotoHydrated(page, '/admin')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Administration')

    // Sur téléphone, la navigation est dans le menu (qui masque la page tant qu'il est ouvert)
    if (isMobile) await page.getByRole('button', { name: 'Ouvrir la barre latérale' }).click()
    const nav = page.getByRole('navigation', { name: NAV_ESPACE })
    await expect(nav.getByRole('link', { name: 'Tableau de bord' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})
