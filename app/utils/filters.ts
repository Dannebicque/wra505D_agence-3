// Briques des filtres de liste gardés dans l'URL. Module pur (sans dépendance Nuxt) : testable
// dans le projet `unit`.

/** Valeur « pas de filtre » des listes déroulantes (une option ne peut pas avoir une valeur vide). */
export const ALL = 'tous'

/** Requête d'URL telle que la donne le routeur : valeur seule, tableau (paramètre répété) ou absente. */
export type RawQuery = Record<string, unknown>

/**
 * Texte comparable sans casse ni accents (« lea » trouve « Léa »), quelle que soit l'apostrophe
 * (« l'appli » trouve « l’appli ») et sans ligature (« coeur » trouve « cœur »).
 */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .trim()
}

/** Valeur texte d'un paramètre ; un paramètre absent ou répété (tableau) n'en a pas. */
export function queryText(query: RawQuery, key: string): string | undefined {
  const value = query[key]
  return typeof value === 'string' ? value : undefined
}

/** Valeur d'un paramètre si elle fait partie des valeurs connues, sinon `fallback` (« tous »). */
export function queryChoice<T extends string>(
  query: RawQuery,
  key: string,
  known: readonly T[],
  fallback: T,
): T {
  const value = queryText(query, key)
  return known.find((k) => k === value) ?? fallback
}

/** Une case cochée s'écrit `1` dans l'URL. */
export function queryFlag(query: RawQuery, key: string): boolean {
  return queryText(query, key) === '1'
}

/** Paramètres d'URL des seuls critères qui diffèrent des valeurs par défaut (URL courte et lisible). */
export function criteriaDiff<T extends { [K in keyof T]: string | boolean }>(
  criteria: T,
  defaults: T,
): Record<string, string> {
  const query: Record<string, string> = {}
  for (const key of Object.keys(defaults) as (keyof T & string)[]) {
    const value = criteria[key]
    if (value === defaults[key]) continue
    query[key] = typeof value === 'boolean' ? (value ? '1' : '0') : value
  }
  return query
}
