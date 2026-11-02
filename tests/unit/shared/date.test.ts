import { describe, expect, it } from 'vitest'
import { todayInParis } from '../../../shared/utils/date'

describe('todayInParis', () => {
  it('donne la date du jour à Paris, même quand il est encore la veille en UTC', () => {
    // 23 h 30 UTC le 1er novembre = 0 h 30 le 2 novembre à Paris (heure d'hiver)
    expect(todayInParis(new Date('2026-11-01T23:30:00Z'))).toBe('2026-11-02')
  })

  it('renvoie le format AAAA-MM-JJ', () => {
    expect(todayInParis(new Date('2026-03-05T12:00:00Z'))).toBe('2026-03-05')
  })
})
