import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import PortfolioOrderedList from '~/components/portfolio/PortfolioOrderedList.vue'

interface Item {
  id: number
  titre: string
}

const ITEMS: Item[] = [
  { id: 1, titre: 'Alpha' },
  { id: 2, titre: 'Bêta' },
  { id: 3, titre: 'Gamma' },
]

async function mountList() {
  const wrapper = await mountSuspended(PortfolioOrderedList<Item>, {
    props: {
      modelValue: [...ITEMS],
      label: 'Pages du portfolio',
      itemLabel: (item: Item) => item.titre,
      // Le parent répercute le nouvel ordre (v-model)
      'onUpdate:modelValue': (value: Item[]) => wrapper.setProps({ modelValue: value }),
    },
    slots: { item: ({ item }: { item: Item }) => h('p', item.titre) },
    attachTo: document.body,
  })
  return wrapper
}

const order = (wrapper: Awaited<ReturnType<typeof mountList>>) =>
  wrapper.findAll('li p').map((p) => p.text())
const arrow = (wrapper: Awaited<ReturnType<typeof mountList>>, label: string) =>
  wrapper.get<HTMLButtonElement>(`button[aria-label="${label}"]`)

describe('PortfolioOrderedList', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('affiche les éléments dans l’ordre, dans une liste nommée', async () => {
    const wrapper = await mountList()

    expect(wrapper.get('ol').attributes('aria-label')).toBe('Pages du portfolio')
    expect(order(wrapper)).toEqual(['Alpha', 'Bêta', 'Gamma'])
  })

  it('désactive « Monter » pour le premier et « Descendre » pour le dernier', async () => {
    const wrapper = await mountList()

    expect(arrow(wrapper, 'Monter « Alpha »').element.disabled).toBe(true)
    expect(arrow(wrapper, 'Descendre « Alpha »').element.disabled).toBe(false)
    expect(arrow(wrapper, 'Monter « Gamma »').element.disabled).toBe(false)
    expect(arrow(wrapper, 'Descendre « Gamma »').element.disabled).toBe(true)
  })

  it('descend un élément, garde le focus sur son bouton et annonce sa position', async () => {
    const wrapper = await mountList()

    await arrow(wrapper, 'Descendre « Alpha »').trigger('click')
    await flushPromises()

    expect(order(wrapper)).toEqual(['Bêta', 'Alpha', 'Gamma'])
    expect(document.activeElement).toBe(arrow(wrapper, 'Descendre « Alpha »').element)
    await expect
      .poll(() => wrapper.get('[role="status"]').text())
      .toBe('« Alpha » : position 2 sur 3.')
  })

  it('monte un élément jusqu’en tête : le focus passe sur « Descendre », désormais seul actif', async () => {
    const wrapper = await mountList()

    await arrow(wrapper, 'Monter « Bêta »').trigger('click')
    await flushPromises()

    expect(order(wrapper)).toEqual(['Bêta', 'Alpha', 'Gamma'])
    expect(arrow(wrapper, 'Monter « Bêta »').element.disabled).toBe(true)
    expect(document.activeElement).toBe(arrow(wrapper, 'Descendre « Bêta »').element)
    await expect
      .poll(() => wrapper.get('[role="status"]').text())
      .toBe('« Bêta » : position 1 sur 3.')
  })

  it('ne déplace rien au-delà des bornes', async () => {
    const wrapper = await mountList()

    // Un bouton désactivé ignore le clic : on vérifie que l'ordre ne bouge pas
    await arrow(wrapper, 'Descendre « Gamma »').trigger('click')
    await flushPromises()

    expect(order(wrapper)).toEqual(['Alpha', 'Bêta', 'Gamma'])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('quand le parent annule un déplacement, le focus passe sur la flèche restée active', async () => {
    const wrapper = await mountList()

    // Alpha descend en 2ᵉ position ; l'étudiant se place sur « Monter « Alpha » »
    await arrow(wrapper, 'Descendre « Alpha »').trigger('click')
    await flushPromises()
    arrow(wrapper, 'Monter « Alpha »').element.focus()

    // Envoi refusé : le parent remet l'ordre initial, Alpha revient en tête et « Monter » devient inactif
    await wrapper.setProps({ modelValue: [...ITEMS] })
    await flushPromises()

    expect(order(wrapper)).toEqual(['Alpha', 'Bêta', 'Gamma'])
    expect(arrow(wrapper, 'Monter « Alpha »').element.disabled).toBe(true)
    expect(document.activeElement).toBe(arrow(wrapper, 'Descendre « Alpha »').element)
  })

  it('quand le parent annule un déplacement et que le focus est perdu, il revient sur la même flèche', async () => {
    const wrapper = await mountList()

    await arrow(wrapper, 'Descendre « Alpha »').trigger('click')
    await flushPromises()
    expect(document.activeElement).toBe(arrow(wrapper, 'Descendre « Alpha »').element)

    // Chrome fait perdre le focus à une ligne déplacée dans le DOM : on le simule
    ;(document.activeElement as HTMLElement).blur()
    await wrapper.setProps({ modelValue: [...ITEMS] })
    await flushPromises()

    expect(order(wrapper)).toEqual(['Alpha', 'Bêta', 'Gamma'])
    expect(document.activeElement).toBe(arrow(wrapper, 'Descendre « Alpha »').element)
  })

  it('ne reprend pas le focus parti vers un autre élément de la page', async () => {
    const wrapper = await mountList()
    const outside = document.createElement('button')
    document.body.append(outside)

    await arrow(wrapper, 'Descendre « Alpha »').trigger('click')
    await flushPromises()
    outside.focus()
    await wrapper.setProps({ modelValue: [...ITEMS] })
    await flushPromises()

    expect(document.activeElement).toBe(outside)
  })
})
