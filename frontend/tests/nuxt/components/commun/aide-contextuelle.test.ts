import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import AideContextuelle from '~/components/commun/AideContextuelle.vue'
import { simulerConnexion } from '../../utils/auth'

// Pages d’espace : le garde de route lit l’utilisateur connecté
simulerConnexion()

// Le panneau est téléporté dans <body>
const panel = () => document.body.querySelector<HTMLElement>('[role="dialog"]')
const button = (name: string) =>
  [...document.body.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
    b.textContent?.includes(name),
  )

async function openAide() {
  await mountSuspended(AideContextuelle, { route: '/etudiant/portfolios', attachTo: document.body })
  button('Aide')?.click()
  await flushPromises()
}

describe('AideContextuelle', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('montre d’abord l’introduction et le pas à pas de la page affichée', async () => {
    await openAide()

    expect(panel()?.textContent).toContain('Composer un portfolio')
    expect(panel()?.querySelectorAll('ol > li').length).toBeGreaterThan(0)
  })

  it('garde le détail replié, puis l’affiche à la demande', async () => {
    await openAide()

    const toggle = button('Besoin d’aller plus loin ?')
    expect(toggle?.getAttribute('aria-expanded')).toBe('false')
    expect(panel()?.textContent).not.toContain('responsable de formation')

    toggle?.click()
    await flushPromises()

    expect(toggle?.getAttribute('aria-expanded')).toBe('true')
    expect(panel()?.textContent).toContain('responsable de formation')
  })
})
