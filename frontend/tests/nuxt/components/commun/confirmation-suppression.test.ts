import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import ConfirmationSuppression from '~/components/commun/ConfirmationSuppression.vue'

// La fenêtre (une « alertdialog » : elle demande une décision) est téléportée dans <body>
const dialog = () => document.body.querySelector<HTMLElement>('[role="alertdialog"]')
const button = (name: string) =>
  [...document.body.querySelectorAll<HTMLButtonElement>('button')].find(
    (b) => b.textContent?.trim() === name,
  )

async function mountOpen() {
  const wrapper = await mountSuspended(ConfirmationSuppression, {
    props: {
      open: true,
      title: 'Supprimer cette trace ?',
      description: 'La trace et ses évaluations seront supprimées.',
      confirmLabel: 'Supprimer la trace',
    },
    attachTo: document.body,
  })
  await flushPromises()
  return wrapper
}

describe('ConfirmationSuppression', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('affiche le titre, la description et le libellé du bouton de confirmation', async () => {
    await mountOpen()

    expect(dialog()?.textContent).toContain('Supprimer cette trace ?')
    expect(dialog()?.textContent).toContain('La trace et ses évaluations seront supprimées.')
    expect(button('Supprimer la trace')).toBeDefined()
  })

  it('émet confirm et se ferme au clic sur le bouton de confirmation', async () => {
    const wrapper = await mountOpen()

    button('Supprimer la trace')?.click()
    await flushPromises()

    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('cancel')).toBeUndefined()
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('émet cancel et se ferme au clic sur « Annuler »', async () => {
    const wrapper = await mountOpen()

    button('Annuler')?.click()
    await flushPromises()

    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('traite la fermeture par Échap comme une annulation', async () => {
    const wrapper = await mountOpen()

    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await flushPromises()

    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('place le focus sur « Annuler » à l’ouverture', async () => {
    await mountOpen()

    await expect.poll(() => document.activeElement).toBe(button('Annuler'))
  })

  describe('focus à la fermeture', () => {
    // La fenêtre se ferme vraiment : le parent répercute `update:open` sur la prop
    async function mountControlled(returnFocus?: (reason: 'confirm' | 'cancel') => HTMLElement) {
      const wrapper = await mountSuspended(ConfirmationSuppression, {
        props: {
          open: true,
          title: 'Supprimer cette trace ?',
          description: 'La trace et ses évaluations seront supprimées.',
          returnFocus,
          'onUpdate:open': (value: boolean) => wrapper.setProps({ open: value }),
        },
        attachTo: document.body,
      })
      await flushPromises()
      return wrapper
    }

    function stableTarget() {
      const heading = document.createElement('h2')
      heading.tabIndex = -1
      heading.textContent = 'Traces de la page'
      document.body.append(heading)
      return heading
    }

    it('envoie le focus sur l’élément choisi par le parent après confirmation', async () => {
      const heading = stableTarget()
      const reasons: string[] = []
      await mountControlled((reason) => {
        reasons.push(reason)
        return heading
      })

      button('Supprimer')?.click()
      await flushPromises()

      await expect.poll(() => document.activeElement).toBe(heading)
      expect(reasons).toEqual(['confirm'])
    })

    it('indique au parent une fermeture par annulation', async () => {
      const heading = stableTarget()
      const reasons: string[] = []
      await mountControlled((reason) => {
        reasons.push(reason)
        return heading
      })

      button('Annuler')?.click()
      await flushPromises()

      await expect.poll(() => reasons).toEqual(['cancel'])
    })
  })
})
