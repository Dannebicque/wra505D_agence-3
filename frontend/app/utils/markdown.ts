// Module pur (sans dépendance Nuxt) : testable dans le projet Vitest `unit`.
//
// Rendu de la description d'une trace, écrite en Markdown (docs/DECISIONS.md, 2026-11-24).
// Sous-ensemble volontairement réduit : paragraphes et retours à la ligne, gras, italique, listes,
// liens. Ce qui n'en fait pas partie s'affiche comme du texte :
// - aucun HTML : il est échappé (le texte vient de l'étudiant et s'affiche sur un portfolio
//   public, avec `v-html`) ;
// - liens en http(s) ou mailto seulement (pas de `javascript:`, `data:`…), ouverts dans l'onglet ;
// - pas d'images (texte alternatif seul) ni de titres (rendus en paragraphe : la page a déjà les
//   siens, une trace ne doit pas casser leur hiérarchie).
import { Marked, type Tokens } from 'marked'

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char)
}

const SAFE_LINK = /^(?:https?:\/\/|mailto:)/i

/** Adresse de lien acceptée : web ou courriel, rien qui s'exécute. */
export function isSafeLink(href: string): boolean {
  return SAFE_LINK.test(href.trim())
}

const parser = new Marked({
  gfm: true,
  // Un retour à la ligne de l'étudiant reste un retour à la ligne
  breaks: true,
  renderer: {
    html({ text }: Tokens.HTML | Tokens.Tag) {
      return escapeHtml(text)
    },
    heading({ tokens }: Tokens.Heading) {
      return `<p>${this.parser.parseInline(tokens)}</p>\n`
    },
    image({ text }: Tokens.Image) {
      return escapeHtml(text)
    },
    link({ href, tokens }: Tokens.Link) {
      const label = this.parser.parseInline(tokens)
      if (!isSafeLink(href)) return label
      return `<a href="${escapeHtml(href.trim())}" rel="nofollow ugc noopener">${label}</a>`
    },
  },
})

/** HTML sûr d'une description en Markdown ; chaîne vide si elle est vide. */
export function renderMarkdown(source: string | null | undefined): string {
  if (!source?.trim()) return ''
  return parser.parse(source, { async: false })
}
