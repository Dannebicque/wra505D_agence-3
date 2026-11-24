import { describe, expect, it } from 'vitest'
import { apiProxyTarget } from '../../../server/utils/api-proxy-url'

const API = 'http://localhost:8000'

describe('adresse du relais /api/**', () => {
  it('relaie /api/** vers l’API, avec la requête', () => {
    expect(apiProxyTarget('/api/traces?page=2', API)).toBe(
      'http://localhost:8000/api/traces?page=2',
    )
    expect(apiProxyTarget('/api/fichiers/abc', `${API}/`)).toBe(
      'http://localhost:8000/api/fichiers/abc',
    )
  })

  it('ne relaie rien sans NUXT_API_PROXY (routes factices)', () => {
    expect(apiProxyTarget('/api/traces', '')).toBeNull()
  })

  it('ne sort pas de /api/, même par un chemin à normaliser', () => {
    expect(apiProxyTarget('/api', API)).toBeNull()
    expect(apiProxyTarget('/etudiant', API)).toBeNull()
    expect(apiProxyTarget('/api/../index.php', API)).toBeNull()
    expect(apiProxyTarget('/api/%2e%2e/_profiler/', API)).toBeNull()
    expect(apiProxyTarget('/api/%2e%2e/api/docs', API)).toBe('http://localhost:8000/api/docs')
  })

  it('refuse les chemins encore encodés et une cible avec un chemin', () => {
    expect(apiProxyTarget('/api/..%2f_profiler', API)).toBeNull()
    expect(apiProxyTarget('/api/a%5Cb', API)).toBeNull()
    expect(apiProxyTarget('/api/\\..\\_profiler', API)).toBe('http://localhost:8000/api/_profiler')
    expect(apiProxyTarget('/api/traces', 'http://localhost:8000/sous/')).toBeNull()
  })

  it('ne change jamais d’hôte', () => {
    expect(apiProxyTarget('//evil.example/api/x', API)).toBeNull()
    expect(apiProxyTarget('http://evil.example/api/x', API)).toBeNull()
  })
})
