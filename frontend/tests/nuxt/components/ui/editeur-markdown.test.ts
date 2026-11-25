import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import EditeurMarkdown from '~/components/ui/EditeurMarkdown.vue'

const TOGGLE = 'button[data-action="basculer-apercu"]'

async function mountEditor(initial: string) {
  const wrapper = await mountSuspended(EditeurMarkdown, {
    props: {
      modelValue: initial,
      'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
    },
    attachTo: document.body,
  })
  return wrapper
}

/** Éditeur en écriture : une description déjà écrite s'ouvre sur son aperçu. */
async function mountWriting(initial: string) {
  const wrapper = await mountEditor(initial)
  if (wrapper.find('[role="region"]').exists()) await wrapper.get(TOGGLE).trigger('click')
  return wrapper
}

function select(textarea: HTMLTextAreaElement, start: number, end: number) {
  textarea.focus()
  textarea.setSelectionRange(start, end)
}

describe('éditeur Markdown', () => {
  it('s’ouvre en écriture quand la description est vide', async () => {
    const wrapper = await mountEditor('')
    expect(wrapper.find('[role="region"]').exists()).toBe(false)
    expect(wrapper.get(TOGGLE).text()).toBe('Aperçu de la description')
    wrapper.unmount()
  })

  it('s’ouvre sur l’aperçu quand la description est déjà écrite', async () => {
    const wrapper = await mountEditor('# Bilan\n\n**Fort**')
    const region = wrapper.get('[role="region"]')
    expect(region.attributes('aria-label')).toBe('Aperçu de la description')
    // Titre placé sous le h1 de l'écran
    expect(region.html()).toContain('<h2 data-titre="1">Bilan</h2>')
    expect(region.html()).toContain('<strong>Fort</strong>')
    // En aperçu, pas de barre de mise en forme : « Modifier » passe à l'écriture
    expect(wrapper.find('[role="group"]').exists()).toBe(false)
    expect(wrapper.get(TOGGLE).text()).toBe('Modifier la description')
    wrapper.unmount()
  })

  it('passe à l’écriture avec « Modifier » ou un clic dans l’aperçu, curseur dans le texte', async () => {
    for (const target of [TOGGLE, '[role="region"]']) {
      const wrapper = await mountEditor('texte')
      await wrapper.get(target).trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[role="region"]').exists()).toBe(false)
      expect(document.activeElement).toBe(wrapper.get('textarea').element)
      wrapper.unmount()
    }
  })

  it('garde le champ atteignable en aperçu : le focus le rouvre en écriture', async () => {
    const wrapper = await mountEditor('**Fort**')
    const textarea = wrapper.get('textarea')
    // Masqué à l'écran seulement : libellé, consigne et erreurs restent pour les lecteurs d'écran
    expect(textarea.element.closest('.sr-only')).not.toBeNull()
    expect((textarea.element as HTMLElement).style.display).not.toBe('none')

    ;(textarea.element as HTMLTextAreaElement).focus()
    await textarea.trigger('focus')
    expect(wrapper.find('[role="region"]').exists()).toBe(false)
    expect(textarea.element.closest('.sr-only')).toBeNull()
    wrapper.unmount()
  })

  it('ne quitte pas l’aperçu quand on clique un lien', async () => {
    const wrapper = await mountEditor('[Site](https://exemple.fr)')
    await wrapper.get('[role="region"] a').trigger('click')
    expect(wrapper.find('[role="region"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('nomme chaque bouton de la barre (sans lien) et annonce les raccourcis', async () => {
    const wrapper = await mountEditor('')
    const labels = wrapper.findAll('[role="group"] button').map((b) => b.attributes('aria-label'))
    expect(labels).toEqual([
      'Titre',
      'Sous-titre',
      'Gras',
      'Italique',
      'Liste à puces',
      'Liste numérotée',
    ])
    expect(wrapper.get('button[aria-label="Gras"]').attributes('aria-keyshortcuts')).toBe(
      'Control+B Meta+B',
    )
    wrapper.unmount()
  })

  it('met la sélection en gras depuis la barre', async () => {
    const wrapper = await mountWriting('un mot ici')
    const textarea = wrapper.get('textarea').element as HTMLTextAreaElement
    select(textarea, 3, 6)
    await wrapper.get('button[aria-label="Gras"]').trigger('click')
    expect(wrapper.props('modelValue')).toBe('un **mot** ici')
    wrapper.unmount()
  })

  it('fait de la ligne du curseur un titre', async () => {
    const wrapper = await mountWriting('Bilan')
    const textarea = wrapper.get('textarea').element as HTMLTextAreaElement
    select(textarea, 2, 2)
    await wrapper.get('button[aria-label="Titre"]').trigger('click')
    expect(wrapper.props('modelValue')).toBe('# Bilan')
    wrapper.unmount()
  })

  it('met en italique avec Ctrl + I', async () => {
    const wrapper = await mountWriting('un mot')
    const textarea = wrapper.get('textarea')
    select(textarea.element as HTMLTextAreaElement, 3, 6)
    await textarea.trigger('keydown', { key: 'i', ctrlKey: true })
    expect(wrapper.props('modelValue')).toBe('un *mot*')
    wrapper.unmount()
  })

  it('ne modifie pas un champ désactivé (envoi en cours)', async () => {
    const wrapper = await mountWriting('un mot')
    const textarea = wrapper.get('textarea').element as HTMLTextAreaElement
    select(textarea, 3, 6)
    textarea.disabled = true
    await wrapper.get('button[aria-label="Gras"]').trigger('click')
    expect(wrapper.props('modelValue')).toBe('un mot')
    wrapper.unmount()
  })

  it('revient à l’écriture quand le formulaire le demande (erreur sur le champ)', async () => {
    const wrapper = await mountEditor('texte')
    expect(wrapper.find('[role="region"]').exists()).toBe(true)
    ;(wrapper.vm as unknown as { showEditor: () => void }).showEditor()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="region"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
