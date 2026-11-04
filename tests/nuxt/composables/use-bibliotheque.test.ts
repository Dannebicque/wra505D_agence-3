import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { useBibliotheque } from '~/composables/useBibliotheque'

const collection = (path: string, member: unknown[]) => ({
  '@id': path,
  '@type': 'Collection',
  totalItems: member.length,
  member,
})

const NIVEAU = {
  '@id': '/api/niveaux/8',
  '@type': 'Niveau',
  libelle: 'Niveau 2',
  ordre: 2,
  annee: null,
  parcours: [],
  apprentissagesCritiques: [],
}
const EXPRIMER = {
  '@id': '/api/competences/3',
  '@type': 'Competence',
  libelle: 'Exprimer un message',
  nomCourt: 'Exprimer',
  couleur: 'c3',
  niveaux: [NIVEAU],
}

registerEndpoint('/api/traces', () =>
  collection('/api/traces', [
    {
      '@id': '/api/traces/1',
      '@type': 'Trace',
      titre: 'Affiche',
      statut: 'finalisee',
      dateCreation: '2026-10-01',
      dateModification: null,
      dateSuppression: null,
    },
  ]),
)
registerEndpoint('/api/validations', () =>
  collection('/api/validations', [
    {
      '@id': '/api/validations/1',
      '@type': 'Validation',
      trace: '/api/traces/1',
      niveau: '/api/niveaux/8',
      etat: 0,
    },
  ]),
)
registerEndpoint('/api/referentiels', () =>
  collection('/api/referentiels', [
    {
      '@id': '/api/referentiels/1',
      '@type': 'Referentiel',
      libelle: 'B.U.T. MMI',
      departement: null,
      competences: [EXPRIMER],
    },
  ]),
)

describe('useBibliotheque', () => {
  it('relie les traces à leurs compétences à partir des trois sources', async () => {
    let result!: ReturnType<typeof useBibliotheque>
    await mountSuspended(
      defineComponent({
        async setup() {
          result = useBibliotheque()
          await result.refresh()
          return () => h('div')
        },
      }),
    )

    expect(result.items.value.map((i) => i.trace.titre)).toEqual(['Affiche'])
    expect(result.items.value[0]?.competences.map((c) => c.nomCourt)).toEqual(['Exprimer'])
    expect(result.competences.value.map((c) => c.nomCourt)).toEqual(['Exprimer'])
  })
})
