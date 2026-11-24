// Module pur (sans dépendance Nuxt) : testable dans le projet Vitest `unit`.
//
// Actions de la barre de mise en forme de l'éditeur de description (`UiEditeurMarkdown`).
// Chaque action décrit un remplacement : la plage [start, end] du texte devient `text`, puis la
// sélection est placée sur [selectionStart, selectionEnd]. L'éditeur l'applique avec
// `insertText`, qui garde l'historique d'annulation du navigateur (Ctrl + Z).

export type MarkdownAction = 'gras' | 'italique' | 'puces' | 'numeros' | 'lien'

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
  gras: 'texte en gras',
  italique: 'texte en italique',
  lien: 'texte du lien',
} as const

const LINK_URL = 'https://'

/** Entoure la sélection de `mark` (ou l'en retire si elle en est déjà entourée). */
function toggleWrap({ value, start, end }: Selection, mark: string, placeholder: string): Edition {
  const before = value.slice(start - mark.length, start)
  const after = value.slice(end, end + mark.length)
  if (start !== end && before === mark && after === mark) {
    const inner = value.slice(start, end)
    return {
      start: start - mark.length,
      end: end + mark.length,
      text: inner,
      selectionStart: start - mark.length,
      selectionEnd: end - mark.length,
    }
  }
  const inner = start === end ? placeholder : value.slice(start, end)
  return {
    start,
    end,
    text: `${mark}${inner}${mark}`,
    selectionStart: start + mark.length,
    selectionEnd: start + mark.length + inner.length,
  }
}

const BULLET = /^- /
const NUMBER = /^\d+\. /

/** Préfixe chaque ligne touchée par la sélection (ou retire le préfixe s'il y est partout). */
function toggleList({ value, start, end }: Selection, ordered: boolean): Edition {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const nextBreak = value.indexOf('\n', end)
  const lineEnd = nextBreak === -1 ? value.length : nextBreak
  const lines = value.slice(lineStart, lineEnd).split('\n')
  const marker = ordered ? NUMBER : BULLET
  const allMarked = lines.every((line) => marker.test(line))
  const text = lines
    .map((line, index) => {
      const bare = line.replace(BULLET, '').replace(NUMBER, '')
      if (allMarked) return bare
      return `${ordered ? `${index + 1}.` : '-'} ${bare}`
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
function link({ value, start, end }: Selection): Edition {
  const selected = value.slice(start, end)
  if (selected && /^(?:https?:\/\/|mailto:)\S+$/i.test(selected)) {
    const text = `[${PLACEHOLDERS.lien}](${selected})`
    return {
      start,
      end,
      text,
      selectionStart: start + 1,
      selectionEnd: start + 1 + PLACEHOLDERS.lien.length,
    }
  }
  const label = selected || PLACEHOLDERS.lien
  const text = `[${label}](${LINK_URL})`
  const urlStart = start + label.length + 3
  // Sans texte choisi, on sélectionne le libellé à remplacer ; sinon l'adresse à taper
  return selected
    ? { start, end, text, selectionStart: urlStart, selectionEnd: urlStart + LINK_URL.length }
    : { start, end, text, selectionStart: start + 1, selectionEnd: start + 1 + label.length }
}

export function applyMarkdownAction(selection: Selection, action: MarkdownAction): Edition {
  switch (action) {
    case 'gras':
      return toggleWrap(selection, '**', PLACEHOLDERS.gras)
    case 'italique':
      return toggleWrap(selection, '_', PLACEHOLDERS.italique)
    case 'puces':
      return toggleList(selection, false)
    case 'numeros':
      return toggleList(selection, true)
    case 'lien':
      return link(selection)
  }
}
