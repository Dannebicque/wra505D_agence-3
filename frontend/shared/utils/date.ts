/** Date du jour à Paris (AAAA-MM-JJ), quel que soit le fuseau de la machine (serveur souvent en UTC). */
export function todayInParis(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(now)
}
