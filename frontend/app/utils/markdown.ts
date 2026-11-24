// Module pur (sans dépendance Nuxt) : testable dans le projet Vitest `unit`.
//
// Rendu de la description d'une trace, écrite en Markdown (docs/DECISIONS.md, 2026-11-24).
// Sous-ensemble volontairement réduit : paragraphes et retours à la ligne, gras, italique, listes,
// liens. Ce qui n'en fait pas partie s'affiche comme du texte :
// - aucun HTML : il est échappé (le texte vient de l'étudiant et s'affiche sur un portfolio
//   public, avec `v-html`) ;
// - liens en http(s) ou mailto seulement (pas de `javascript:`, `data:`…), ouverts dans l'onglet ;
// - pas d'images (texte alternatif seul) ni de titres (rendus en paragraphe : la page a déjà les
//   siens, une trace ne doit pas casser leur hiérarchie) ;
// - ni bloc de code (un paragraphe collé avec un retrait de 4 espaces le devenait, sans retour à
//   la ligne), ni tableau, citation, filet, texte barré ou case à cocher (un champ sans libellé) :
//   leur texte s'affiche en paragraphe.
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

// Une adresse incomplète (`https://` laissé par la barre de mise en forme) ne donne pas de lien
const SAFE_LINK = /^(?:https?:\/\/[^\s/]|mailto:\S)/i

/** Adresse de lien acceptée : web ou courriel, rien qui s'exécute. */
export function isSafeLink(href: string): boolean {
  return SAFE_LINK.test(href.trim())
}

/** Texte brut en paragraphe, retours à la ligne gardés. */
function plainParagraph(text: string): string {
  return `<p>${escapeHtml(text.trim()).replace(/\n/g, '<br>')}</p>\n`
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
    code({ text }: Tokens.Code) {
      return plainParagraph(text)
    },
    table({ raw }: Tokens.Table) {
      return plainParagraph(raw)
    },
    blockquote({ tokens }: Tokens.Blockquote) {
      return this.parser.parse(tokens)
    },
    hr() {
      return ''
    },
    del({ tokens }: Tokens.Del) {
      return this.parser.parseInline(tokens)
    },
    // Case d'une liste de tâches : en texte, pas en champ sans libellé (on garde ce qui est coché)
    checkbox({ checked }: Tokens.Checkbox) {
      return checked ? '[x] ' : '[ ] '
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
