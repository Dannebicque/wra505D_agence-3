// Module pur (sans dépendance Nuxt) : testable dans le projet Vitest `unit`.
//
// Actions de la barre de mise en forme de l'éditeur de description (`UiEditeurMarkdown`).
// Chaque action décrit un remplacement : la plage [start, end] du texte devient `text`, puis la
// sélection est placée sur [selectionStart, selectionEnd]. L'éditeur l'applique avec
// `insertText`, qui garde l'historique d'annulation du navigateur (Ctrl + Z).

export type MarkdownAction = 'bold' | 'italic' | 'bullets' | 'numbers' | 'link'

export interface Selection {
  value: string
  start: number
  end: number
}

export interface Edition {
  start: number
  end: number
  text: string
  selectionStart: number
  selectionEnd: number
}

const PLACEHOLDERS = {
  bold: 'texte en gras',
  italic: 'texte en italique',
  link: 'texte du lien',
} as const

const LINK_URL = 'https://'
const URL_LIKE = /^(?:https?:\/\/|mailto:|www\.)\S+$/i

/**
 * Sélection sans ses espaces de bord : un double-clic sous Windows prend l'espace qui suit le mot,
 * et `**mot **` ne serait pas du gras.
 */
function trimmed({ value, start, end }: Selection): Selection {
  while (start < end && /\s/.test(value[start]!)) start++
  while (end > start && /\s/.test(value[end - 1]!)) end--
  return { value, start, end }
}

/** Lettre ou chiffre : un astérisque qui en touche un n'est pas en bord de mot. */
const WORD_CHAR = /[\p{L}\p{N}]/u

/** Nombre d'astérisques consécutifs à partir de `from`, vers la droite (1) ou la gauche (-1). */
function countStars(text: string, from: number, step: 1 | -1): number {
  let count = 0
  for (let i = from; text[i] === '*'; i += step) count++
  return count
}

/**
 * Une suite d'astérisques porte le gras si elle en compte 2 ou plus, l'italique si elle en compte
 * un nombre impair : `***mot***` est en gras et en italique.
 */
function carries(stars: number, size: 1 | 2): boolean {
  return size === 2 ? stars >= 2 : stars % 2 === 1
}

/**
 * Gras (`size` 2) ou italique (`size` 1) : ajoute les astérisques, ou retire seulement ceux de
 * l'action s'ils entourent déjà la sélection. L'italique d'un texte en gras donne donc `***mot***`,
 * et retirer l'italique de `***mot***` laisse `**mot**`.
 */
function toggleEmphasis(selection: Selection, size: 1 | 2, placeholder: string): Edition {
  const { value, start, end } = trimmed(selection)
  const inner = value.slice(start, end)
  // Marques comprises dans la sélection : `**mot**` choisi en entier
  const lead = countStars(inner, 0, 1)
  const trail = countStars(inner, inner.length - 1, -1)
  if (lead < inner.length && carries(lead, size) && carries(trail, size)) {
    const middle = inner.slice(lead, inner.length - trail)
    // Pas d'autre marque au milieu : `*a* et *b*` n'est pas un seul italique
    if (!middle.includes('*')) {
      const bare = '*'.repeat(lead - size) + middle + '*'.repeat(trail - size)
      return { start, end, text: bare, selectionStart: start, selectionEnd: start + bare.length }
    }
  }
  // Marques autour de la sélection : `mot` choisi dans `**mot**`. Seulement en bord de mot : dans
  // `**gras**mot` ou `2*3*4`, ces astérisques ne sont pas ceux de la sélection
  const before = countStars(value, start - 1, -1)
  const after = countStars(value, end, 1)
  // La sélection est déjà entourée d'une mise en forme (gras, italique ou les deux)
  const emphasized =
    start !== end &&
    !inner.includes('*') &&
    before > 0 &&
    after > 0 &&
    !WORD_CHAR.test(value[start - before - 1] ?? '') &&
    !WORD_CHAR.test(value[end + after] ?? '')
  if (emphasized && carries(before, size) && carries(after, size)) {
    return {
      start: start - size,
      end: end + size,
      text: inner,
      selectionStart: start - size,
      selectionEnd: end - size,
    }
  }
  // Déjà en gras ou en italique : les astérisques s'ajoutent (`**mot**` → `***mot***`). Sinon,
  // des astérisques dans la sélection ou collés à elle sont d'autres marques ou des signes : on
  // entoure de `_` ou `__`, qui ne s'y mêlent pas (`*a* et *b*` ne devient pas du gras, `2*3*4`
  // garde ses signes de multiplication)
  const touchesStars = !emphasized && (inner.includes('*') || before > 0 || after > 0)
  const mark = (touchesStars ? '_' : '*').repeat(size)
  const content = start === end ? placeholder : inner
  return {
    start,
    end,
    text: `${mark}${content}${mark}`,
    selectionStart: start + size,
    selectionEnd: start + size + content.length,
  }
}

const BULLET = /^(\s*)- /
const NUMBER = /^(\s*)\d+\. /

/**
 * Préfixe chaque ligne non vide touchée par la sélection (ou retire le préfixe s'il y est
 * partout). Une sélection qui finit au début d'une ligne (ligne choisie avec son saut de ligne)
 * ne prend pas la ligne suivante. Le retrait d'une ligne (liste imbriquée) est gardé.
 */
function toggleList({ value, start, end }: Selection, ordered: boolean): Edition {
  const last = end > start && value[end - 1] === '\n' ? end - 1 : end
  const lineStart = start === 0 ? 0 : value.lastIndexOf('\n', start - 1) + 1
  const nextBreak = value.indexOf('\n', last)
  const lineEnd = nextBreak === -1 ? value.length : nextBreak
  const lines = value.slice(lineStart, lineEnd).split('\n')
  const filled = lines.filter((line) => line.trim() !== '')
  // Ligne vide (« je commence une liste ») : le préfixe est posé, le curseur le suit
  if (filled.length === 0) {
    const firstBreak = value.indexOf('\n', lineStart)
    const prefix = ordered ? '1. ' : '- '
    return {
      start: lineStart,
      end: firstBreak === -1 ? value.length : firstBreak,
      text: prefix,
      selectionStart: lineStart + prefix.length,
      selectionEnd: lineStart + prefix.length,
    }
  }
  const marker = ordered ? NUMBER : BULLET
  const allMarked = filled.length > 0 && filled.every((line) => marker.test(line))
  let rank = 0
  const text = lines
    .map((line) => {
      if (line.trim() === '') return line
      const indent = /^\s*/.exec(line)![0]
      const bare = line.replace(BULLET, '$1').replace(NUMBER, '$1').slice(indent.length)
      if (allMarked) return `${indent}${bare}`
      rank++
      return `${indent}${ordered ? `${rank}.` : '-'} ${bare}`
    })
    .join('\n')
  return {
    start: lineStart,
    end: lineEnd,
    text,
    selectionStart: lineStart,
    selectionEnd: lineStart + text.length,
  }
}

/** Lien : le texte choisi devient le libellé, l'adresse est sélectionnée pour être tapée. */
function link(selection: Selection): Edition {
  const { value, start, end } = trimmed(selection)
  const selected = value.slice(start, end)
  if (selected && URL_LIKE.test(selected)) {
    const href = /^www\./i.test(selected) ? `https://${selected}` : selected
    const text = `[${PLACEHOLDERS.link}](${href})`
    return {
      start,
      end,
      text,
      selectionStart: start + 1,
      selectionEnd: start + 1 + PLACEHOLDERS.link.length,
    }
  }
  const label = selected.replace(/[[\]]/g, '') || PLACEHOLDERS.link
  const text = `[${label}](${LINK_URL})`
  const urlStart = start + label.length + 3
  // Sans texte choisi, on sélectionne le libellé à remplacer ; sinon l'adresse à taper
  return selected
    ? { start, end, text, selectionStart: urlStart, selectionEnd: urlStart + LINK_URL.length }
    : { start, end, text, selectionStart: start + 1, selectionEnd: start + 1 + label.length }
}

export function applyMarkdownAction(selection: Selection, action: MarkdownAction): Edition {
  switch (action) {
    case 'bold':
      return toggleEmphasis(selection, 2, PLACEHOLDERS.bold)
    case 'italic':
      // `*` plutôt que `_` : `m_ot_clé` n'est pas de l'italique au milieu d'un mot
      return toggleEmphasis(selection, 1, PLACEHOLDERS.italic)
    case 'bullets':
      return toggleList(selection, false)
    case 'numbers':
      return toggleList(selection, true)
    case 'link':
      return link(selection)
  }
}
