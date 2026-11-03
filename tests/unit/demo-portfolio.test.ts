import { describe, expect, it } from 'vitest'
import { PORTFOLIOS } from '../../app/demo/base'
import {
  isPubliclyVisible,
  numericParam,
  pageProjetById,
  portfolioById,
  portfolioBySlug,
  publicPath,
} from '../../app/demo/portfolio'

describe('isPubliclyVisible', () => {
  it.each([
    ['publique', true, true],
    ['publique', false, false],
    ['privee', true, false],
    ['privee', false, false],
  ] as const)('visibilité %s, publié %s : %s', (visibilite, publie, expected) => {
    expect(isPubliclyVisible({ visibilite, publie })).toBe(expected)
  })
})

describe('numericParam', () => {
  it.each([
    ['1', 1],
    ['42', 42],
    [['7', '8'], 7],
  ])('lit l’identifiant de %j', (value, expected) => {
    expect(numericParam(value)).toBe(expected)
  })

  it.each([['abc'], ['1.5'], ['-1'], [''], [' 1'], [[]], [undefined]])(
    'refuse %j (NaN, donc aucun élément trouvé)',
    (value) => {
      expect(numericParam(value)).toBeNaN()
    },
  )
})

describe('recherche des portfolios et des pages', () => {
  it('trouve un portfolio par identifiant ou par slug, et rien pour un identifiant invalide', () => {
    expect(portfolioById(1)?.slug).toBe('lea-martin-2026')
    expect(portfolioBySlug('lea-martin-2026')?.id).toBe(1)
    expect(portfolioById(999)).toBeUndefined()
    expect(portfolioById(numericParam('abc'))).toBeUndefined()
    expect(portfolioBySlug('inconnu')).toBeUndefined()
  })

  it('ne trouve une page que dans son propre portfolio', () => {
    const premier = portfolioById(1)
    const second = portfolioById(2)
    if (!premier || !second) throw new Error('Portfolios de démonstration manquants')
    const pageDuSecond = second.pages[0]
    if (!pageDuSecond) throw new Error('Page de démonstration manquante')

    expect(pageProjetById(second, pageDuSecond.id)).toBe(pageDuSecond)
    expect(pageProjetById(premier, pageDuSecond.id)).toBeUndefined()
  })

  it('construit le chemin public à partir du slug', () => {
    expect(publicPath({ slug: 'lea-martin-2026' })).toBe('/portfolio/lea-martin-2026')
  })

  it('n’utilise chaque identifiant de page qu’une fois dans les données de démonstration', () => {
    const ids = PORTFOLIOS.flatMap((portfolio) => portfolio.pages.map((page) => page.id))
    expect(new Set(ids).size).toBe(ids.length)
  })
})
