import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ProgressionBar from '~/components/tableau-de-bord/ProgressionBar.vue'
import ProgressionList from '~/components/tableau-de-bord/ProgressionList.vue'
import ProgressionValues from '~/components/tableau-de-bord/ProgressionValues.vue'

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim()

describe('ProgressionValues', () => {
  it('se lit comme le résumé en texte, chaque valeur à côté de sa couleur', async () => {
    const wrapper = await mountSuspended(ProgressionValues, {
      props: { acquired: 2, inProgress: 0, notAcquired: 1, pending: 3 },
    })

    expect(normalize(wrapper.text())).toBe('2 acquis · 1 non acquis · 3 en attente')
    // Une pastille par valeur, de la couleur de son segment
    const swatches = wrapper.findAll('.size-2')
    expect(swatches).toHaveLength(3)
    expect(swatches[0]?.classes()).toContain('bg-primary')
    expect(swatches[1]?.classes()).toContain('bg-error')
  })

  it('signale une compétence sans évaluation', async () => {
    const wrapper = await mountSuspended(ProgressionValues, {
      props: { acquired: 0, inProgress: 0, notAcquired: 0, pending: 0 },
    })

    expect(normalize(wrapper.text())).toBe('aucune trace associée')
  })
})

describe('ProgressionBar', () => {
  it('est décorative et garde l’échelle commune', async () => {
    const wrapper = await mountSuspended(ProgressionBar, {
      props: { acquired: 1, inProgress: 0, notAcquired: 1, pending: 0, max: 4 },
    })

    const bar = wrapper.get('[aria-hidden="true"]')
    const segments = bar.findAll('span')
    // Acquis, non acquis, puis le reste de l'échelle (piste)
    expect(segments).toHaveLength(3)
    expect(segments[2]?.classes()).toContain('bg-elevated')
    expect(segments[2]?.attributes('style')).toContain('flex-grow: 2')
  })

  it('« acquis » prend le prune le plus contrasté dans les deux modes', async () => {
    const wrapper = await mountSuspended(ProgressionBar, {
      props: { acquired: 1, inProgress: 1, notAcquired: 0, pending: 0, max: 2 },
    })

    const [acquired, inProgress] = wrapper.findAll('span')
    expect(acquired?.classes()).toEqual(
      expect.arrayContaining(['bg-primary', 'dark:bg-(--ui-color-primary-200)']),
    )
    expect(inProgress?.classes()).toContain('bg-(--ui-color-primary-500)')
  })
})

describe('ProgressionList', () => {
  it('liste chaque compétence avec ses valeurs', async () => {
    const wrapper = await mountSuspended(ProgressionList, {
      props: {
        label: 'Progression par compétence',
        rows: [
          { id: 1, label: 'Comprendre', acquired: 0, inProgress: 0, notAcquired: 0, pending: 1 },
          { id: 2, label: 'Développer', acquired: 1, inProgress: 0, notAcquired: 1, pending: 0 },
        ],
      },
    })

    expect(wrapper.get('ul').attributes('aria-label')).toBe('Progression par compétence')
    const items = wrapper.findAll('li')
    expect(items).toHaveLength(2)
    expect(items[1]?.text()).toContain('Développer')
    expect(normalize(items[1]?.get('p').text() ?? '')).toBe('1 acquis · 1 non acquis')
  })
})
