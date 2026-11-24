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

type Marker = '*' | '_'

/** Lettre ou chiffre : un `_` qui en touche un est dans un mot, où il ne met rien en forme. */
const WORD_CHAR = /[\p{L}\p{N}]/u

/** Nombre de `marker` consécutifs à partir de `from`, vers la droite (1) ou la gauche (-1). */
function countRun(text: string, from: number, step: 1 | -1, marker: Marker): number {
  let count = 0
  for (let i = from; text[i] === marker; i += step) count++
  return count
}

/**
 * Une suite de marques porte le gras si elle en compte 2 ou plus, l'italique si elle en compte un
 * nombre impair : `***mot***` (ou `___mot___`) est en gras et en italique.
 */
function carries(run: number, size: 1 | 2): boolean {
  return size === 2 ? run >= 2 : run % 2 === 1
}

/**
 * Gras (`size` 2) ou italique (`size` 1). Retire la mise en forme si une paire de marques
 * identiques (`*` ou `_`) entoure la sélection ou la borde de l'intérieur, en ne retirant que les
 * marques de l'action (`***mot***` moins l'italique donne `**mot**`). Sinon l'ajoute, en `*` ; en
 * `_` si la sélection contient des astérisques ou les touche (`*a* et *b*`, `**gras**mot`), pour
 * ne pas s'y mêler. Une même action appliquée deux fois revient au texte de départ.
 */
function toggleEmphasis(selection: Selection, size: 1 | 2, placeholder: string): Edition {
  const { value, start, end } = trimmed(selection)
  const inner = value.slice(start, end)
  for (const marker of ['*', '_'] as const) {
    // Marques comprises dans la sélection : `**mot**` choisi en entier
    const lead = countRun(inner, 0, 1, marker)
    const trail = countRun(inner, inner.length - 1, -1, marker)
    const middle = inner.slice(lead, inner.length - trail)
    // Pas d'autre marque de ce type au milieu : `*a* et *b*` n'est pas un seul italique
    if (
      lead < inner.length &&
      carries(lead, size) &&
      carries(trail, size) &&
      !middle.includes(marker)
    ) {
      const bare = marker.repeat(lead - size) + middle + marker.repeat(trail - size)
      return { start, end, text: bare, selectionStart: start, selectionEnd: start + bare.length }
    }
    // Marques autour de la sélection : `mot` choisi dans `**mot**`. Les `_` ne comptent qu'en
    // bord de mot (dans un mot, Markdown ne les lit pas comme une mise en forme)
    const before = countRun(value, start - 1, -1, marker)
    const after = countRun(value, end, 1, marker)
    const atWordEdge =
      marker === '*' ||
      (!WORD_CHAR.test(value[start - before - 1] ?? '') &&
        !WORD_CHAR.test(value[end + after] ?? ''))
    if (
      start !== end &&
      !inner.includes(marker) &&
      carries(before, size) &&
      carries(after, size) &&
      atWordEdge
    ) {
      return {
        start: start - size,
        end: end + size,
        text: inner,
        selectionStart: start - size,
        selectionEnd: end - size,
      }
    }
  }
  // Déjà entourée d'astérisques (`**mot**s`) : on en ajoute, `***mot***` se lit même collé à un
  // mot, là où `_` ne se lirait pas. Astérisques d'un seul côté ou à l'intérieur : `_`
  const starsAround = !inner.includes('*') && value[start - 1] === '*' && value[end] === '*'
  const touchesStars =
    !starsAround && (inner.includes('*') || value[start - 1] === '*' || value[end] === '*')
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
