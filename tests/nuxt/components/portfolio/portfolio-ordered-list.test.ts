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
})
