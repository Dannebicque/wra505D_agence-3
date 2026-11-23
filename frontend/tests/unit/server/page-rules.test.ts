import { describe, expect, it } from 'vitest'
import type { Iri } from '../../../shared/types/api'
import type { Page } from '../../../shared/types/portfolio'
import type { Trace } from '../../../shared/types/trace'
import {
  checkPageOrder,
  checkPageTraces,
  mergePagePatch,
  type PageTracesContext,
} from '../../../server/utils/page-rules'

function trace(id: number, overrides: Partial<Trace> = {}): Trace {
  return {
    '@id': `/api/traces/${id}`,
    '@type': 'Trace',
    bibliotheque: '/api/bibliotheques/1',
    titre: `Trace ${id}`,
    description: null,
    contexte: null,
    legende: null,
    type: 'lien',
    contenu: ['https://a.example'],
    statut: 'finalisee',
    conceptionIa: 'non_renseigne',
    realisationIa: 'non_renseigne',
    dateRealisation: null,
    dateCreation: '2026-10-01',
    dateModification: null,
    dateSuppression: null,
    ...overrides,
  }
}

function page(id: number, traces: Iri[]): Page {
  return {
    '@id': `/api/pages/${id}`,
    '@type': 'Page',
    portfolio: '/api/portfolios/1',
    intitule: `Page ${id}`,
    description: null,
    traces,
    dateSuppression: null,
  }
}

describe('checkPageOrder', () => {
  const current: Iri[] = ['/api/pages/1', '/api/pages/2']

  it('accepte le même ensemble de pages dans un autre ordre', () => {
    expect(checkPageOrder(current, ['/api/pages/2', '/api/pages/1'])).toEqual({
      ok: true,
      value: ['/api/pages/2', '/api/pages/1'],
    })
  })

  it.each([
    ['une valeur qui n’est pas une liste', 'pages'],
    ['une page manquante', ['/api/pages/1']],
    ['une page en double', ['/api/pages/1', '/api/pages/1']],
    ['une page d’un autre portfolio', ['/api/pages/1', '/api/pages/9']],
    ['une page en trop', ['/api/pages/1', '/api/pages/2', '/api/pages/9']],
    ['un élément qui n’est pas une IRI', ['/api/pages/1', 2]],
    ['un champ absent', undefined],
  ])('refuse %s', (_, next) => {
    expect(checkPageOrder(current, next)).toMatchObject({
      ok: false,
      violations: [{ propertyPath: 'pages' }],
    })
  })
})

describe('checkPageTraces', () => {
  const context: PageTracesContext = {
    existing: ['/api/traces/1'],
    available: [
      trace(1),
      trace(2),
      trace(3, { statut: 'brouillon' }),
      trace(4, { dateSuppression: '2026-10-10' }),
      trace(5),
    ],
    otherPages: [page(2, ['/api/traces/5'])],
  }

  it('accepte une trace finalisée, libre et à l’étudiant', () => {
    expect(checkPageTraces(['/api/traces/2', '/api/traces/1'], context)).toEqual({
      ok: true,
      value: ['/api/traces/2', '/api/traces/1'],
    })
  })

  it('accepte de retirer toutes les traces', () => {
    expect(checkPageTraces([], context)).toEqual({ ok: true, value: [] })
  })

  it('garde une trace déjà dans la page, même repassée en brouillon entre-temps', () => {
    expect(
      checkPageTraces(['/api/traces/1'], {
        ...context,
        available: [trace(1, { statut: 'brouillon' })],
      }),
    ).toEqual({ ok: true, value: ['/api/traces/1'] })
  })

  it.each([
    ['une valeur qui n’est pas une liste', '/api/traces/2'],
    ['une trace en double', ['/api/traces/2', '/api/traces/2']],
    ['une trace inconnue ou d’un autre étudiant', ['/api/traces/999']],
    ['un brouillon', ['/api/traces/3']],
    ['une trace dans la corbeille', ['/api/traces/4']],
    ['une trace déjà dans une autre page du portfolio', ['/api/traces/5']],
  ])('refuse %s', (_, next) => {
    expect(checkPageTraces(next, context)).toMatchObject({
      ok: false,
      violations: [{ propertyPath: 'traces' }],
    })
  })
})

describe('mergePagePatch', () => {
  it('garde les champs absents du corps et ignore les autres', () => {
    const existing = { ...page(1, []), description: 'Avant' }

    expect(mergePagePatch(existing, { intitule: 'Après', portfolio: '/api/portfolios/9' })).toEqual(
      { intitule: 'Après', description: 'Avant' },
    )
  })

  it('accepte de vider la description', () => {
    const existing = { ...page(1, []), description: 'Avant' }

    expect(mergePagePatch(existing, { description: null })).toEqual({
      intitule: 'Page 1',
      description: null,
    })
  })
})
