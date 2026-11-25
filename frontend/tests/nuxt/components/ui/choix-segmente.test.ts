import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { UFormField } from '#components'
import ChoixSegmente from '~/components/ui/ChoixSegmente.vue'

const ITEMS = [
  { label: 'Lien', value: 'lien' },
  { label: 'Vidéo', value: 'video' },
  { label: 'Image', value: 'image' },
]

/** Le sélecteur dans un champ de formulaire, avec ou sans erreur. */
function field(initial: string, error?: string) {
  return defineComponent({
    setup() {
      const value = ref(initial)
      return () =>
        h(UFormField, { name: 'type', error }, () =>
          h(ChoixSegmente, {
            legend: 'Type de trace',
            items: ITEMS,
            modelValue: value.value,
            'onUpdate:modelValue': (v: string) => (value.value = v),
          }),
        )
    },
  })
}

describe('sélecteur segmenté', () => {
  it('est un groupe de vrais boutons radio, nommé par sa légende', async () => {
    const wrapper = await mountSuspended(field('video'))
    expect(wrapper.get('fieldset legend').text()).toBe('Type de trace')
    const radios = wrapper.findAll('input[type="radio"]')
    expect(radios).toHaveLength(3)
    expect(radios.map((r) => (r.element as HTMLInputElement).checked)).toEqual([false, true, false])
    // L'option choisie se distingue autrement que par un fond à 1,3:1 : contour et graisse
    expect(wrapper.get('span[aria-hidden="true"]').classes()).toContain('border-primary')
  })

  it('suit le choix et déplace la pastille', async () => {
    const wrapper = await mountSuspended(field('lien'))
    await wrapper.findAll('input[type="radio"]')[2]!.setValue()
    const pastille = wrapper.get('span[aria-hidden="true"]').element as HTMLElement
    expect(pastille.style.translate).toBe('200% 0')
  })

  it('relie l’erreur du champ à chaque bouton et donne l’id du champ au bouton coché', async () => {
    const wrapper = await mountSuspended(field('image', 'Choisissez un type.'))
    const radios = wrapper.findAll('input[type="radio"]')
    const errorId = wrapper.get('[data-slot="error"]').attributes('id')
    for (const radio of radios) {
      expect(radio.attributes('aria-invalid')).toBe('true')
      expect(radio.attributes('aria-describedby')).toContain(errorId)
    }
    expect(radios[2]!.attributes('id')).toBeTruthy()
    expect(radios[0]!.attributes('id')).toBeUndefined()
  })

  it('sans valeur connue, ne montre aucune pastille et garde l’id sur le premier bouton', async () => {
    const wrapper = await mountSuspended(field('inconnu'))
    expect(wrapper.find('span[aria-hidden="true"]').exists()).toBe(false)
    expect(wrapper.findAll('input:checked')).toHaveLength(0)
    expect(wrapper.findAll('input[type="radio"]')[0]!.attributes('id')).toBeTruthy()
  })
})
