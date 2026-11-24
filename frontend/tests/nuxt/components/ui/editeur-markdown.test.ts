import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import EditeurMarkdown from '~/components/ui/EditeurMarkdown.vue'

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

function select(textarea: HTMLTextAreaElement, start: number, end: number) {
  textarea.focus()
  textarea.setSelectionRange(start, end)
}

describe('éditeur Markdown', () => {
  it('nomme chaque bouton de la barre et annonce les raccourcis', async () => {
    const wrapper = await mountEditor('')
    const labels = wrapper.findAll('[role="group"] button').map((b) => b.attributes('aria-label'))
    expect(labels).toEqual(['Gras', 'Italique', 'Liste à puces', 'Liste numérotée', 'Lien'])
    expect(wrapper.get('button[aria-label="Gras"]').attributes('aria-keyshortcuts')).toBe(
      'Control+B Meta+B',
    )
    wrapper.unmount()
  })

  it('met la sélection en gras depuis la barre', async () => {
    const wrapper = await mountEditor('un mot ici')
    const textarea = wrapper.get('textarea').element as HTMLTextAreaElement
    select(textarea, 3, 6)
    await wrapper.get('button[aria-label="Gras"]').trigger('click')
    expect(wrapper.props('modelValue')).toBe('un **mot** ici')
    wrapper.unmount()
  })

  it('met en italique avec Ctrl + I', async () => {
    const wrapper = await mountEditor('un mot')
    const textarea = wrapper.get('textarea')
    select(textarea.element as HTMLTextAreaElement, 3, 6)
    await textarea.trigger('keydown', { key: 'i', ctrlKey: true })
    expect(wrapper.props('modelValue')).toBe('un *mot*')
    wrapper.unmount()
  })

  it('ne modifie pas un champ désactivé (envoi en cours)', async () => {
    const wrapper = await mountEditor('un mot')
    const textarea = wrapper.get('textarea').element as HTMLTextAreaElement
    select(textarea, 3, 6)
    textarea.disabled = true
    await wrapper.get('button[aria-label="Gras"]').trigger('click')
    expect(wrapper.props('modelValue')).toBe('un mot')
    wrapper.unmount()
  })

  it('montre l’aperçu dans une région nommée, puis rend le focus au texte', async () => {
    const wrapper = await mountEditor('**Fort**')
    const toggle = wrapper.get('button[aria-pressed]')
    expect(toggle.attributes('aria-pressed')).toBe('false')

    await toggle.trigger('click')
    expect(toggle.attributes('aria-pressed')).toBe('true')
    const region = wrapper.get('[role="region"]')
    expect(region.attributes('aria-label')).toBe('Aperçu de la description')
    expect(region.html()).toContain('<strong>Fort</strong>')
    expect(wrapper.get('button[aria-label="Gras"]').attributes('disabled')).toBeDefined()

    await toggle.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="region"]').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.get('textarea').element)
    wrapper.unmount()
  })

  it('revient à l’écriture quand le formulaire le demande (erreur sur le champ)', async () => {
    const wrapper = await mountEditor('texte')
    await wrapper.get('button[aria-pressed]').trigger('click')
    ;(wrapper.vm as unknown as { showEditor: () => void }).showEditor()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="region"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
