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
})
