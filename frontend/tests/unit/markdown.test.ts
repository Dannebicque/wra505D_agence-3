import { describe, expect, it } from 'vitest'
import { applyMarkdownAction, type Selection } from '../../app/utils/markdown-edition'
import { isSafeLink, renderMarkdown } from '../../app/utils/markdown'

/** Texte obtenu après l'action, et texte sélectionné ensuite. */
function run(selection: Selection, action: Parameters<typeof applyMarkdownAction>[1]) {
  const edit = applyMarkdownAction(selection, action)
  const value = selection.value.slice(0, edit.start) + edit.text + selection.value.slice(edit.end)
  return { value, selected: value.slice(edit.selectionStart, edit.selectionEnd) }
}

describe('renderMarkdown', () => {
  it('rend le gras, l’italique, les listes et les retours à la ligne', () => {
    const html = renderMarkdown('**Fort** et _léger_\nligne suivante\n\n- un\n- deux\n\n1. premier')
    expect(html).toContain('<strong>Fort</strong>')
    expect(html).toContain('<em>léger</em>')
    expect(html).toContain('<br>')
    expect(html).toMatch(/<ul>\s*<li>un<\/li>\s*<li>deux<\/li>\s*<\/ul>/)
    expect(html).toMatch(/<ol>\s*<li>premier<\/li>\s*<\/ol>/)
  })

  it('rend un lien web, sans le suivre pour le référencement', () => {
    expect(renderMarkdown('[Site](https://exemple.fr)')).toContain(
      '<a href="https://exemple.fr" rel="nofollow ugc noopener">Site</a>',
    )
  })

  it.each([
    ['<script>alert(1)</script>', '<script'],
    ['<img src=x onerror="alert(1)">', '<img'],
    ['texte <b onclick="x()">gras</b>', '<b '],
  ])('échappe le HTML écrit par l’étudiant : %s', (source, interdit) => {
    const html = renderMarkdown(source)
    expect(html).not.toContain(interdit)
    expect(html).toContain('&lt;')
  })

  it.each([
    '[clic](javascript:alert(1))',
    '[clic](JaVaScRiPt:alert(1))',
    '[clic](data:text/html;base64,PHNjcmlwdD4=)',
    '<javascript:alert(1)>',
  ])('ne crée pas de lien dangereux : %s', (source) => {
    const html = renderMarkdown(source)
    expect(html).not.toContain('<a ')
    expect(html.toLowerCase()).not.toContain('href="javascript')
  })

  it('échappe les guillemets d’une adresse (pas d’attribut injecté)', () => {
    const html = renderMarkdown('[x](https://a.fr/"onmouseover="alert(1))')
    expect(html).not.toMatch(/"\s*onmouseover=/)
  })

  it('rend les titres en paragraphe et les images en texte', () => {
    const html = renderMarkdown('# Grand titre\n\n![Affiche du festival](https://a.fr/i.png)')
    expect(html).not.toContain('<h1')
    expect(html).toContain('<p>Grand titre</p>')
    expect(html).not.toContain('<img')
    expect(html).toContain('Affiche du festival')
  })

  it('renvoie une chaîne vide pour une description vide', () => {
    expect(renderMarkdown(null)).toBe('')
    expect(renderMarkdown('   \n')).toBe('')
  })

  it('n’accepte que les liens web et courriel', () => {
    expect(isSafeLink('https://a.fr')).toBe(true)
    expect(isSafeLink('mailto:a@b.fr')).toBe(true)
    expect(isSafeLink('/etudiant')).toBe(false)
    expect(isSafeLink('vbscript:x')).toBe(false)
  })
})

describe('applyMarkdownAction', () => {
  it('met la sélection en gras, puis l’en retire', () => {
    const bold = run({ value: 'un mot ici', start: 3, end: 6 }, 'gras')
    expect(bold).toEqual({ value: 'un **mot** ici', selected: 'mot' })
    const back = run({ value: 'un **mot** ici', start: 5, end: 8 }, 'gras')
    expect(back).toEqual({ value: 'un mot ici', selected: 'mot' })
  })

  it('sans sélection, insère un exemple sélectionné, prêt à être remplacé', () => {
    expect(run({ value: 'Avant ', start: 6, end: 6 }, 'italique')).toEqual({
      value: 'Avant _texte en italique_',
      selected: 'texte en italique',
    })
  })

  it('transforme les lignes touchées en liste à puces, puis les rétablit', () => {
    const value = 'Intro\nun\ndeux'
    const list = run({ value, start: 7, end: 10 }, 'puces')
    expect(list.value).toBe('Intro\n- un\n- deux')
    expect(run({ value: list.value, start: 8, end: 14 }, 'puces').value).toBe(value)
  })

  it('numérote les lignes, en remplaçant des puces existantes', () => {
    expect(run({ value: '- un\n- deux', start: 0, end: 11 }, 'numeros').value).toBe(
      '1. un\n2. deux',
    )
  })

  it('fait du texte choisi le libellé d’un lien et sélectionne l’adresse', () => {
    expect(run({ value: 'voir le site', start: 5, end: 12 }, 'lien')).toEqual({
      value: 'voir [le site](https://)',
      selected: 'https://',
    })
  })

  it('fait d’une adresse choisie la cible du lien et sélectionne son libellé', () => {
    expect(run({ value: 'https://a.fr', start: 0, end: 12 }, 'lien')).toEqual({
      value: '[texte du lien](https://a.fr)',
      selected: 'texte du lien',
    })
  })
})
