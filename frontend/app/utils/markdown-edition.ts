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

/** Entoure la sélection de `mark` (ou l'en retire si elle en est déjà entourée). */
function toggleWrap(selection: Selection, mark: string, placeholder: string): Edition {
  const { value, start, end } = trimmed(selection)
  const inner = value.slice(start, end)
  // Marques comprises dans la sélection : `**mot**` choisi en entier
  if (inner.length > 2 * mark.length && inner.startsWith(mark) && inner.endsWith(mark)) {
    const bare = inner.slice(mark.length, -mark.length)
    return { start, end, text: bare, selectionStart: start, selectionEnd: start + bare.length }
  }
  // Marques autour de la sélection : `mot` choisi dans `**mot**`
  const before = value.slice(start - mark.length, start)
  const after = value.slice(end, end + mark.length)
  if (start !== end && before === mark && after === mark) {
    return {
      start: start - mark.length,
      end: end + mark.length,
      text: inner,
      selectionStart: start - mark.length,
      selectionEnd: end - mark.length,
    }
  }
  const content = start === end ? placeholder : inner
  return {
    start,
    end,
    text: `${mark}${content}${mark}`,
    selectionStart: start + mark.length,
    selectionEnd: start + mark.length + content.length,
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
      return toggleWrap(selection, '**', PLACEHOLDERS.bold)
    case 'italic':
      // `*` plutôt que `_` : `m_ot_clé` n'est pas de l'italique au milieu d'un mot
      return toggleWrap(selection, '*', PLACEHOLDERS.italic)
    case 'bullets':
      return toggleList(selection, false)
    case 'numbers':
      return toggleList(selection, true)
    case 'link':
      return link(selection)
  }
}
